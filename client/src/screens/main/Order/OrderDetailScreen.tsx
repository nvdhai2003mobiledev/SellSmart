import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { observer } from 'mobx-react-lite';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BaseLayout, Header, Button, DynamicText } from '../../../components';
import { color, moderateScale } from '../../../utils';
import { rootStore } from '../../../models/root-store';
import { format } from 'date-fns';
import { updateOrderStatus } from '../../../services/api/ordersApi';
import { Screen } from '../../../navigation/navigation.type';
import { More, CloseCircle, Timer, ReceiptItem } from 'iconsax-react-native';

const OrderDetailScreen = observer(() => {
  const navigation = useNavigation();
  const route = useRoute();
  const { orderId } = route.params as { orderId: string };
  const navigateToOrderList = (status?: string) => {
    // @ts-ignore - ignore navigation type error
    navigation.navigate(Screen.ORDERLIST, { status });
  };
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showActions, setShowActions] = useState(false);
  
  // Define loadOrderDetails with useCallback to prevent it from changing on every render
  const loadOrderDetails = useCallback(async () => {
    try {
      setLoading(true);
      // Tìm đơn hàng từ store
      const foundOrder = rootStore.orders.orders.find((o: any) => o._id === orderId);
      
      if (foundOrder) {
        console.log('=== CHI TIẾT ĐƠN HÀNG ===');
        console.log(`ID: ${foundOrder._id}`);
        console.log(`Mã đơn hàng: ${foundOrder.orderID}`);
        console.log(`Trạng thái: ${foundOrder.status}`);
        console.log(`Trạng thái thanh toán: ${foundOrder.paymentStatus}`);
        console.log(`Số tiền tổng: ${foundOrder.totalAmount}`);
        console.log(`Giá gốc: ${foundOrder.originalAmount !== undefined ? foundOrder.originalAmount : 'không có thông tin'}`);
        console.log(`Số tiền đã thanh toán: ${foundOrder.paidAmount !== undefined ? foundOrder.paidAmount : 'không có thông tin'}`);
        console.log(`Phương thức thanh toán: ${foundOrder.paymentMethod || 'không có'}`);
        
        // Log thông tin khuyến mãi chi tiết
        if (foundOrder.promotionID) {
          console.log(`Promotion ID: ${foundOrder.promotionID}`);
        }
        
        if (foundOrder.promotionDetails) {
          console.log('Chi tiết khuyến mãi:', JSON.stringify(foundOrder.promotionDetails, null, 2));
        } else {
          console.log('Không có chi tiết khuyến mãi');
        }
        
        // Kiểm tra chênh lệch giữa giá gốc và giá cuối cùng
        if (foundOrder.originalAmount && foundOrder.totalAmount) {
          const discountDifference = foundOrder.originalAmount - foundOrder.totalAmount;
          console.log(`Chênh lệch giá (giảm giá): ${discountDifference}`);
          
          // Nếu có chênh lệch nhưng không có promotionDetails, tạo thông tin khuyến mãi
          if (discountDifference > 0 && !foundOrder.promotionDetails) {
            console.log('Phát hiện giảm giá nhưng không có thông tin khuyến mãi, tạo thông tin tạm thời');
            foundOrder.promotionDetails = {
              name: 'Khuyến mãi',
              discount: Math.round((discountDifference / foundOrder.originalAmount) * 100),
              discountAmount: discountDifference
            };
          }
        }
        
        if (foundOrder.paymentDetails && foundOrder.paymentDetails.length > 0) {
          console.log('Chi tiết thanh toán:', JSON.stringify(foundOrder.paymentDetails, null, 2));
        } else {
          console.log('Không có chi tiết thanh toán');
        }
        
        setOrder(foundOrder);
      } else {
        // Nếu không tìm thấy, có thể fetch lại từ server
        console.log(`Không tìm thấy đơn hàng ID ${orderId} trong store, tiến hành fetch lại từ server...`);
        await rootStore.orders.fetchOrders();
        const refreshedOrder = rootStore.orders.orders.find((o: any) => o._id === orderId);
        
        if (refreshedOrder) {
          console.log('=== CHI TIẾT ĐƠN HÀNG SAU KHI FETCH LẠI ===');
          console.log(`ID: ${refreshedOrder._id}`);
          console.log(`Mã đơn hàng: ${refreshedOrder.orderID}`);
          console.log(`Trạng thái: ${refreshedOrder.status}`);
          console.log(`Trạng thái thanh toán: ${refreshedOrder.paymentStatus}`);
          console.log(`Số tiền tổng: ${refreshedOrder.totalAmount}`);
          console.log(`Số tiền đã thanh toán: ${refreshedOrder.paidAmount !== undefined ? refreshedOrder.paidAmount : 'không có thông tin'}`);
          console.log(`Phương thức thanh toán: ${refreshedOrder.paymentMethod || 'không có'}`);
          
          if (refreshedOrder.paymentDetails && refreshedOrder.paymentDetails.length > 0) {
            console.log('Chi tiết thanh toán:', JSON.stringify(refreshedOrder.paymentDetails, null, 2));
          } else {
            console.log('Không có chi tiết thanh toán');
          }
          
          setOrder(refreshedOrder);
        } else {
          console.error(`Không thể tìm thấy đơn hàng ID ${orderId} sau khi refresh`);
          Alert.alert('Lỗi', 'Không tìm thấy thông tin đơn hàng');
        }
      }
    } catch (error) {
      console.error('Error loading order details:', error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi tải thông tin đơn hàng');
    } finally {
      setLoading(false);
    }
  }, [orderId]);
  
  useEffect(() => {
    loadOrderDetails();
  }, [loadOrderDetails]);

  const formatCurrency = (amount: number) => {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + 'đ';
  };
  
  const handleReceivePayment = () => {
    // Tính toán số tiền cần thanh toán dựa vào tình trạng hiện tại
    const remainingAmount = order.paymentStatus === 'partpaid' 
      ? order.totalAmount - (order.paidAmount || 0)
      : order.totalAmount;
    
    // Đánh dấu thanh toán một phần nếu đã thanh toán trước đó
    const isPartial = order.paymentStatus === 'partpaid';

    // Điều hướng đến màn hình thanh toán
    // @ts-ignore - Bỏ qua lỗi TypeScript vì chúng ta biết đây là screen hợp lệ
    navigation.navigate(Screen.PAYMENT_METHODS, {
      orderId: order._id,
      orderNumber: order.orderID.slice(-4),
      totalAmount: order.totalAmount,
      remainingAmount: remainingAmount,
      isPartialPayment: isPartial,
      isNewOrder: false,
    });
  };
  
  const handleShipping = () => {
    Alert.alert('Thông báo', 'Chức năng giao hàng đang được phát triển');
  };
  
  const handleProcessOrder = async () => {
    try {
      setLoading(true);
      console.log(`Bắt đầu xử lý đơn hàng ${orderId}`);

      Alert.alert(
        'Xác nhận',
        'Xử lý đơn hàng này sẽ cập nhật trạng thái và giảm tồn kho tương ứng. Bạn có chắc chắn muốn tiếp tục?',
        [
          {
            text: 'Hủy',
            style: 'cancel',
            onPress: () => {
              console.log('Người dùng đã hủy xử lý đơn hàng');
              setLoading(false);
            }
          },
          {
            text: 'Xác nhận',
            onPress: async () => {
              console.log(`Đang gửi yêu cầu cập nhật trạng thái đơn hàng ${orderId} thành processing`);
              const response = await updateOrderStatus(orderId, 'processing');
              console.log('Kết quả cập nhật trạng thái:', response);

              if (response.ok) {
                Alert.alert('Thành công', 'Đơn hàng đã được xử lý và cập nhật tồn kho');
                await rootStore.orders.fetchOrders();
                await loadOrderDetails();
              } else {
                const errorData = response.data as { message?: string } | undefined;
                const errorMessage = errorData?.message || 'Không thể xử lý đơn hàng';
                Alert.alert('Lỗi', errorMessage);
                console.error('Lỗi cập nhật trạng thái:', errorMessage);
              }
              setLoading(false);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error processing order:', error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi xử lý đơn hàng');
      setLoading(false);
    }
  };
  
  // Toggle action sheet visibility
  const toggleActions = () => {
    setShowActions(!showActions);
  };
  
  const handleActionSelected = (action: string) => {
    setShowActions(false);
    
    if (action === 'cancel') {
      // Kiểm tra xem đơn hàng đã bị hủy chưa
      if (order?.status === 'canceled') {
        Alert.alert('Thông báo', 'Đơn hàng này đã bị hủy');
        return;
      }
      
      // Điều hướng đến màn hình hủy đơn hàng với thông tin ID đơn hàng
      // @ts-ignore - Bỏ qua lỗi TypeScript vì chúng ta biết đây là screen hợp lệ
      navigation.navigate(Screen.ORDER_CANCEL, { 
        orderId: order?._id,
        orderNumber: order?.orderID.slice(-4) // Gửi mã đơn ngắn gọn để hiển thị
      });
    } else if (action === 'history') {
      // TODO: Implement order history view
      Alert.alert('Thông báo', 'Tính năng đang được phát triển');
    } else if (action === 'archive') {
      // TODO: Implement order archiving
      Alert.alert('Thông báo', 'Tính năng đang được phát triển');
    }
  };
  
  if (loading) {
    return (
      <BaseLayout>
        <Header
          title="Chi tiết đơn hàng"
          showBackIcon
          onPressBack={() => navigateToOrderList()}
          showRightIcon
          RightIcon={<More size={24} color={color.accentColor.darkColor} />}
          onPressRight={toggleActions}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={color.primaryColor} />
        </View>
      </BaseLayout>
    );
  }
  
  if (!order) {
    return (
      <BaseLayout>
        <Header
          title="Chi tiết đơn hàng"
          showBackIcon
          onPressBack={() => navigateToOrderList()}
          showRightIcon
          RightIcon={<More size={24} color={color.accentColor.darkColor} />}
          onPressRight={toggleActions}
        />
        <View style={styles.emptyContainer}>
          <DynamicText style={styles.emptyText}>Không tìm thấy thông tin đơn hàng</DynamicText>
        </View>
      </BaseLayout>
    );
  }
  
  // Lấy 4 ký tự cuối của order ID để hiển thị
  const orderIdShort = order.orderID.slice(-4);
  const orderDate = new Date(order.createdAt);
  const formattedDate = format(orderDate, 'dd/MM/yyyy HH:mm');
  
  // Lấy tên người tạo đơn hàng từ thông tin đăng nhập
  const employeeName = order.employeeID?.fullName || rootStore.auth.userFullName || 'Admin';
  
  return (
    <BaseLayout>
      <Header
        title="Chi tiết đơn hàng"
        showBackIcon
        onPressBack={() => navigateToOrderList()}
        showRightIcon
        RightIcon={<More size={24} color={color.accentColor.darkColor} />}
        onPressRight={toggleActions}
      />
      
      <ScrollView style={styles.scrollView}>
        {/* Thông tin đơn hàng */}
        <View style={styles.orderInfoSection}>
          <View style={styles.orderIdRow}>
            <DynamicText style={[
              styles.orderId,
              order.status === 'canceled' && styles.canceledOrderId
            ]}>#{orderIdShort}</DynamicText>
            <View style={[
              styles.statusBadge,
              order.status === 'pending' ? styles.statusPending :
              order.status === 'processing' ? styles.statusProcessing :
              order.status === 'canceled' ? styles.statusCanceled :
              styles.statusDelivered
            ]}>
              <DynamicText style={styles.statusText}>
                {order.status === 'pending' ? 'Chưa xử lý' :
                 order.status === 'processing' ? 'Đã xử lý' :
                 order.status === 'shipping' ? 'Đang giao' :
                 order.status === 'delivered' ? 'Đã giao' :
                 order.status === 'canceled' ? 'Đã hủy' : order.status}
              </DynamicText>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <DynamicText style={styles.infoLabel}>Thời gian:</DynamicText>
            <DynamicText style={styles.infoValue}>{formattedDate}</DynamicText>
          </View>
          
          <View style={styles.infoRow}>
            <DynamicText style={styles.infoLabel}>Người thực hiện:</DynamicText>
            <DynamicText style={styles.infoValue}>{employeeName}</DynamicText>
          </View>
          
          <View style={styles.infoRow}>
            <DynamicText style={styles.infoLabel}>Trạng thái thanh toán:</DynamicText>
            <View style={[
              styles.paymentStatusBadge,
              order.paymentStatus === 'paid' ? styles.statusPaid : 
              order.paymentStatus === 'partpaid' ? styles.statusPartialPaid : 
              styles.statusUnpaid
            ]}>
              <DynamicText style={styles.paymentStatusText}>
                {order.paymentStatus === 'paid' ? 'Đã thanh toán' : 
                 order.paymentStatus === 'partpaid' ? 'Thanh toán một phần' :
                 order.paymentStatus === 'unpaid' ? 'Chưa thanh toán' : 'Đã hoàn tiền'}
              </DynamicText>
            </View>
          </View>
          
          {/* Hiển thị thông tin thanh toán một phần nếu có */}
          {order.paymentStatus === 'partpaid' && (
            <View style={styles.partialPaymentInfo}>
              <View style={styles.infoRow}>
                <DynamicText style={styles.infoLabel}>Đã thanh toán:</DynamicText>
                <DynamicText style={styles.infoValue}>{formatCurrency(order.paidAmount || 0)}</DynamicText>
              </View>
              <View style={styles.infoRow}>
                <DynamicText style={styles.infoLabel}>Còn lại:</DynamicText>
                <DynamicText style={[styles.infoValue, styles.remainingAmount]}>
                  {formatCurrency(order.totalAmount - (order.paidAmount || 0))}
                </DynamicText>
              </View>
            </View>
          )}
          
          {/* Chi tiết các lần thanh toán nếu có */}
          {order.paymentDetails && order.paymentDetails.length > 0 && (
            <View style={styles.paymentDetailsContainer}>
              <DynamicText style={styles.paymentDetailsTitle}>Chi tiết thanh toán:</DynamicText>
              {order.paymentDetails.map((payment: any, index: number) => (
                <View key={index} style={styles.paymentDetailItem}>
                  <DynamicText style={styles.paymentDetailMethod}>
                    {payment.method === 'cash' ? 'Tiền mặt' : 
                     payment.method === 'credit card' ? 'Chuyển khoản' : 
                     payment.method === 'e-wallet' ? 'Ví điện tử' : payment.method}
                  </DynamicText>
                  <DynamicText style={styles.paymentDetailAmount}>
                    {formatCurrency(payment.amount)}
                  </DynamicText>
                  <DynamicText style={styles.paymentDetailDate}>
                    {new Date(payment.date).toLocaleString()}
                  </DynamicText>
                </View>
              ))}
            </View>
          )}
          
          {/* Hiển thị thông tin khuyến mãi nếu có */}
          {((order.promotionDetails && order.promotionDetails.discountAmount > 0) || 
            (order.originalAmount && order.originalAmount > order.totalAmount)) && (
            <View style={styles.promotionContainer}>
              <DynamicText style={styles.promotionTitle}>Thông tin khuyến mãi</DynamicText>
              
              <View style={styles.infoRow}>
                <DynamicText style={styles.infoLabel}>Chương trình:</DynamicText>
                <DynamicText style={styles.promotionName}>
                  {order.promotionDetails?.name || 'Khuyến mãi'}
                </DynamicText>
              </View>
              
              <View style={styles.infoRow}>
                <DynamicText style={styles.infoLabel}>Mức giảm:</DynamicText>
                <DynamicText style={styles.discountValue}>
                  {order.promotionDetails?.discount || 
                    (order.originalAmount ? Math.round(((order.originalAmount - order.totalAmount) / order.originalAmount) * 100) : 0)}%
                </DynamicText>
              </View>
              
              <View style={styles.infoRow}>
                <DynamicText style={styles.infoLabel}>Tiền giảm:</DynamicText>
                <DynamicText style={styles.discountAmount}>
                  -{formatCurrency(order.promotionDetails?.discountAmount || 
                    (order.originalAmount ? order.originalAmount - order.totalAmount : 0))}
                </DynamicText>
              </View>
              
              {order.originalAmount && order.originalAmount > 0 && (
                <View style={styles.infoRow}>
                  <DynamicText style={styles.infoLabel}>Giá gốc:</DynamicText>
                  <DynamicText style={styles.originalAmount}>
                    {formatCurrency(order.originalAmount)}
                  </DynamicText>
                </View>
              )}
            </View>
          )}
          
          <View style={styles.totalRow}>
            <DynamicText style={styles.totalLabel}>Tổng tiền:</DynamicText>
            <DynamicText style={[
              styles.totalValue,
              order.status === 'canceled' && styles.canceledTotal
            ]}>
              {order.status === 'canceled' ? '0đ' : formatCurrency(order.totalAmount)}
            </DynamicText>
          </View>
        </View>
        
        {/* Phần thanh toán - Chỉ hiển thị khi đơn hàng chưa thanh toán hoặc thanh toán một phần */}
        {(order.paymentStatus === 'unpaid' || order.paymentStatus === 'partpaid') && order.status !== 'canceled' && (
          <View style={styles.section}>
            <DynamicText style={styles.sectionTitle}>
              {order.paymentStatus === 'unpaid' ? 'Xử lý thanh toán' : 'Thanh toán số tiền còn lại'}
            </DynamicText>
            <DynamicText style={styles.paymentDescription}>
              {order.paymentStatus === 'unpaid' 
                ? 'Đơn hàng này chưa được thanh toán. Hãy nhận thanh toán để tiếp tục xử lý.' 
                : `Khách hàng đã thanh toán ${formatCurrency(order.paidAmount || 0)}. Số tiền còn lại: ${formatCurrency(order.totalAmount - (order.paidAmount || 0))}`
              }
            </DynamicText>
            
            <Button
              title={order.paymentStatus === 'unpaid' ? "Nhận thanh toán" : "Thanh toán phần còn lại"}
              buttonContainerStyle={styles.inlinePaymentButton}
              titleStyle={styles.buttonText}
              onPress={handleReceivePayment}
            />
          </View>
        )}
        
        {/* Thông tin khách hàng */}
        <View style={styles.section}>
          <DynamicText style={styles.sectionTitle}>Thông tin khách hàng</DynamicText>
          <View style={styles.customerInfo}>
            <DynamicText style={styles.customerName}>{order.customerID.fullName}</DynamicText>
            <DynamicText style={styles.customerPhone}>{order.customerID.phoneNumber}</DynamicText>
            {order.customerID.address && (
              <DynamicText style={styles.customerAddress}>Địa chỉ: {order.customerID.address}</DynamicText>
            )}
          </View>
        </View>
        
        {/* Danh sách sản phẩm */}
        <View style={styles.section}>
          <DynamicText style={styles.sectionTitle}>Sản phẩm ({order.products.length})</DynamicText>
          {order.products.map((product: any, index: number) => (
            <View key={index} style={styles.productItem}>
              <View style={styles.productInfo}>
                <DynamicText style={styles.productName}>{product.name}</DynamicText>
                <DynamicText style={styles.productVariants}>
                  {product.attributes.map((attr: any) => 
                    `${attr.name}: ${Array.isArray(attr.value) ? attr.value.join(', ') : attr.value}`
                  ).join(' | ')}
                </DynamicText>
                <DynamicText style={styles.productPrice}>{formatCurrency(product.price)}</DynamicText>
              </View>
              <View style={styles.productQuantity}>
                <DynamicText style={styles.quantityText}>x{product.quantity}</DynamicText>
                <DynamicText style={styles.itemTotal}>{formatCurrency(product.price * product.quantity)}</DynamicText>
              </View>
            </View>
          ))}
        </View>
        
        {/* Ghi chú */}
        {order.notes && (
          <View style={styles.section}>
            <DynamicText style={styles.sectionTitle}>Ghi chú</DynamicText>
            <DynamicText style={styles.notes}>{order.notes}</DynamicText>
          </View>
        )}
        
        {/* Lý do hủy đơn - Chỉ hiển thị khi đơn hàng đã bị hủy */}
        {order.status === 'canceled' && (
          <View style={styles.section}>
            <DynamicText style={[styles.sectionTitle, { color: color.accentColor.errorColor }]}>
              Lý do hủy đơn
            </DynamicText>
            {order.cancelReason ? (
              <DynamicText style={styles.cancelReason}>{order.cancelReason}</DynamicText>
            ) : (
              <DynamicText style={styles.cancelReasonNotAvailable}>
                Không có thông tin về lý do hủy đơn hàng
              </DynamicText>
            )}
          </View>
        )}
      </ScrollView>
      
      {/* Action Sheet for 3-dots menu */}
      {showActions && (
        <>
          <TouchableOpacity 
            style={styles.actionSheetOverlay}
            activeOpacity={1} 
            onPress={() => setShowActions(false)}
          >
            <View style={styles.actionSheet}>
              <TouchableOpacity 
                style={styles.actionItem} 
                onPress={() => handleActionSelected('cancel')}
              >
                <CloseCircle size={24} color={color.accentColor.errorColor} />
                <DynamicText style={[styles.actionText, styles.cancelText]}>Hủy đơn hàng</DynamicText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionItem} 
                onPress={() => handleActionSelected('history')}
              >
                <ReceiptItem size={24} color={color.accentColor.darkColor} />
                <DynamicText style={styles.actionText}>Lịch sử đơn hàng</DynamicText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionItem} 
                onPress={() => handleActionSelected('archive')}
              >
                <Timer size={24} color={color.accentColor.darkColor} />
                <DynamicText style={styles.actionText}>Lưu trữ</DynamicText>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </>
      )}
      
      {/* Nút xử lý đơn hàng */}
      <View style={styles.buttonContainer}>
        {(order.paymentStatus === 'unpaid' || order.paymentStatus === 'partpaid') && order.status !== 'canceled' && (
          <Button
            title={order.paymentStatus === 'unpaid' ? "Nhận thanh toán" : "Thanh toán phần còn lại"}
            buttonContainerStyle={styles.receivePaymentButton}
            titleStyle={styles.buttonText}
            onPress={handleReceivePayment}
          />
        )}
        
        {/* Chỉ hiển thị nút này nếu đơn hàng có trạng thái pending và đã thanh toán */}
        {order.status === 'pending' && order.paymentStatus === 'paid' && (
          <Button
            title="Xử lý đơn hàng"
            buttonContainerStyle={styles.processOrderButton}
            titleStyle={styles.buttonText}
            onPress={handleProcessOrder}
          />
        )}
        
        {order.status === 'processing' && order.status !== 'canceled' && (
          <Button
            title="Giao hàng"
            buttonContainerStyle={styles.shippingButton}
            titleStyle={styles.buttonText}
            onPress={handleShipping}
          />
        )}
      </View>
    </BaseLayout>
  );
});

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: moderateScale(16),
    color: color.accentColor.grayColor,
  },
  scrollView: {
    paddingHorizontal: moderateScale(16),
    paddingTop: moderateScale(10),
    paddingBottom: moderateScale(70),
    marginBottom:moderateScale(50),
  },
  orderInfoSection: {
    backgroundColor: '#ffffff',
    borderRadius: moderateScale(8),
    padding: moderateScale(16),
    marginBottom: moderateScale(16),
  },
  orderIdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(12),
  },
  orderId: {
    fontSize: moderateScale(20),
    fontWeight: 'bold',
    color: color.accentColor.darkColor,
  },
  statusBadge: {
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(4),
  },
  statusPending: {
    backgroundColor: '#FFD700',
  },
  statusProcessing: {
    backgroundColor: '#87CEEB',
  },
  statusDelivered: {
    backgroundColor: '#90EE90',
  },
  statusCanceled: {
    backgroundColor: '#FF6347',
  },
  statusText: {
    fontSize: moderateScale(12),
    fontWeight: '500',
    color: color.accentColor.darkColor,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: moderateScale(8),
  },
  infoLabel: {
    fontSize: moderateScale(14),
    color: color.accentColor.grayColor,
  },
  infoValue: {
    fontSize: moderateScale(14),
    color: color.accentColor.darkColor,
    fontWeight: '500',
  },
  paymentStatusBadge: {
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(4),
  },
  statusPaid: {
    backgroundColor: '#90EE90',
  },
  statusUnpaid: {
    backgroundColor: '#FFD700',
  },
  paymentStatusText: {
    fontSize: moderateScale(12),
    fontWeight: '500',
    color: color.accentColor.darkColor,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: moderateScale(8),
    paddingTop: moderateScale(8),
    borderTopWidth: 1,
    borderTopColor: color.accentColor.grayColor,
  },
  totalLabel: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: color.accentColor.darkColor,
  },
  totalValue: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: color.primaryColor,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: moderateScale(8),
    padding: moderateScale(16),
    marginBottom: moderateScale(16),
  },
  sectionTitle: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: color.accentColor.darkColor,
    marginBottom: moderateScale(8),
  },
  paymentDescription: {
    fontSize: moderateScale(14),
    color: color.accentColor.grayColor,
    marginBottom: moderateScale(16),
  },
  inlinePaymentButton: {
    backgroundColor: color.primaryColor,
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(8),
    height:moderateScale(60),
  },
  customerInfo: {
    marginTop: moderateScale(8),
  },
  customerName: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: color.accentColor.darkColor,
  },
  customerPhone: {
    fontSize: moderateScale(14),
    color: color.accentColor.grayColor,
    marginTop: moderateScale(4),
  },
  customerAddress: {
    fontSize: moderateScale(14),
    color: color.accentColor.grayColor,
    marginTop: moderateScale(4),
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: moderateScale(8),
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  productInfo: {
    flex: 2,
  },
  productName: {
    fontSize: moderateScale(14),
    fontWeight: 'bold',
    color: color.accentColor.darkColor,
  },
  productVariants: {
    fontSize: moderateScale(12),
    color: color.accentColor.grayColor,
    marginTop: moderateScale(2),
  },
  productPrice: {
    fontSize: moderateScale(14),
    color: color.primaryColor,
    marginTop: moderateScale(2),
  },
  productQuantity: {
    flex: 1,
    alignItems: 'flex-end',
  },
  quantityText: {
    fontSize: moderateScale(14),
    color: color.accentColor.darkColor,
  },
  itemTotal: {
    fontSize: moderateScale(14),
    fontWeight: 'bold',
    color: color.accentColor.darkColor,
    marginTop: moderateScale(4),
  },
  notes: {
    fontSize: moderateScale(14),
    color: color.accentColor.darkColor,
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: moderateScale(16),
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
  },
  receivePaymentButton: {
    flex: 1,
    backgroundColor: color.primaryColor,
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(8),
    marginRight: moderateScale(8),
  },
  processOrderButton: {
    flex: 1,
    backgroundColor: color.primaryColor,
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(8),
    marginRight: moderateScale(8),
  },
  shippingButton: {
    flex: 1,
    backgroundColor: '#4169E1',
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(8),
    marginLeft: moderateScale(8),
  },
  buttonText: {
    fontSize: moderateScale(14),
    color: '#ffffff',
    fontWeight: 'bold',
  },
  canceledOrderId: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  canceledTotal: {
    color: color.accentColor.grayColor,
    textDecorationLine: 'line-through',
  },
  actionSheetOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  actionSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    paddingTop: moderateScale(20),
    paddingBottom: moderateScale(30),
    paddingHorizontal: moderateScale(16),
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2',
  },
  actionText: {
    fontSize: moderateScale(16),
    marginLeft: moderateScale(16),
    color: color.accentColor.darkColor,
  },
  cancelText: {
    color: color.accentColor.errorColor,
  },
  cancelReason: {
    fontSize: moderateScale(14),
    color: color.accentColor.darkColor,
  },
  cancelReasonNotAvailable: {
    fontSize: moderateScale(14),
    color: color.accentColor.grayColor,
  },
  statusPartialPaid: {
    backgroundColor: '#FFB74D', // Orange color for partial payment
  },
  
  partialPaymentInfo: {
    marginTop: moderateScale(8),
    paddingTop: moderateScale(8),
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  
  remainingAmount: {
    color: color.accentColor.errorColor,
    fontWeight: 'bold',
  },
  
  paymentDetailsContainer: {
    marginTop: moderateScale(8),
    paddingTop: moderateScale(8),
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  
  paymentDetailsTitle: {
    fontSize: moderateScale(14),
    color: color.accentColor.darkColor,
    fontWeight: 'bold',
    marginBottom: moderateScale(4),
  },
  
  paymentDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: moderateScale(4),
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  
  paymentDetailMethod: {
    fontSize: moderateScale(12),
    color: color.accentColor.darkColor,
    flex: 1,
  },
  
  paymentDetailAmount: {
    fontSize: moderateScale(12),
    color: color.primaryColor,
    fontWeight: 'bold',
    marginHorizontal: moderateScale(8),
  },
  
  paymentDetailDate: {
    fontSize: moderateScale(12),
    color: color.accentColor.grayColor,
  },
  
  promotionContainer: {
    marginTop: moderateScale(8),
    paddingTop: moderateScale(8),
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  
  promotionTitle: {
    fontSize: moderateScale(14),
    color: color.accentColor.darkColor,
    fontWeight: 'bold',
    marginBottom: moderateScale(8),
  },
  
  promotionName: {
    fontSize: moderateScale(14),
    color: color.primaryColor,
    fontWeight: '500',
  },
  
  discountValue: {
    fontSize: moderateScale(14),
    color: color.accentColor.darkColor,
    fontWeight: '500',
  },
  
  discountAmount: {
    fontSize: moderateScale(14),
    color: color.accentColor.errorColor,
    fontWeight: 'bold',
  },
  
  originalAmount: {
    fontSize: moderateScale(14),
    color: color.accentColor.grayColor,
    textDecorationLine: 'line-through',
  },
});

export default OrderDetailScreen; 