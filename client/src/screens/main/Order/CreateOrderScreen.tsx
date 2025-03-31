import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { BaseLayout, Button, Input, Header } from '../../../components';
import { useNavigation, useRoute } from '@react-navigation/native';
import { observer } from 'mobx-react-lite';
import { rootStore } from '../../../models/root-store';
import { Screen } from '../../../navigation/navigation.type';
import { color, moderateScale } from '../../../utils';
import { createOrder } from '../../../services/api/ordersApi';

// Define TypeScript interfaces
interface Product {
  _id: string;
  name: string;
  price: number;
  inventory: number;
  quantity: number;
  thumbnail?: string;
  attributes?: Array<{
    name: string;
    value: string | string[];
  }>;
}

interface Customer {
  _id: string;
  fullName: string;
  phoneNumber: string;
  address?: string;
  email?: string;
}

type PaymentMethodType = 'cash' | 'credit card' | 'debit card' | 'e-wallet';

const CreateOrderScreen = observer(() => {
  const navigation = useNavigation();
  const route = useRoute();
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('cash');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'unpaid'>('paid');

  // Mock customer để test
  const mockCustomer: Customer = {
    _id: '65ef1a8be4f41ba6be68e123', // Đây là một mock ID, có thể thay thế bằng ID thực tế từ hệ thống của bạn
    fullName: 'Nguyễn Văn A',
    phoneNumber: '0123456789',
    address: 'Số 123, Đường ABC, Quận 1, TP.HCM',
    email: 'nguyenvana@example.com'
  };

  // Hàm để sử dụng mock customer
  const useMockCustomer = () => {
    setCustomer(mockCustomer);
    Alert.alert('Thông báo', 'Đã sử dụng khách hàng mẫu để test');
  };

  // Calculate totals
  const totalQuantity = selectedProducts.reduce((sum, product) => sum + product.quantity, 0);
  const totalAmount = selectedProducts.reduce((sum, product) => sum + (product.price * product.quantity), 0);

  // Get selected products from navigation params
  useEffect(() => {
    if (route.params?.selectedProducts) {
      setSelectedProducts(route.params.selectedProducts);
    }
    if (route.params?.customer) {
      setCustomer(route.params.customer);
    }
  }, [route.params]);

  const navigateToProductSelection = () => {
    navigation.navigate(Screen.CHOOSE_ORDER_PRODUCT as never, { 
      selectedProducts,
      onProductsSelected: (products: Product[]) => setSelectedProducts(products)
    } as never);
  };

  const navigateToSelectCustomer = () => {
    // Navigate to customer selection screen
    navigation.navigate(Screen.CUSTOMER_SELECTION as never, { 
      onSelect: (selectedCustomer: Customer) => setCustomer(selectedCustomer) 
    } as never);
  };

  const increaseQuantity = (index) => {
    const product = selectedProducts[index];
    if (product.quantity < product.inventory) {
      const updatedProducts = [...selectedProducts];
      updatedProducts[index] = {
        ...product,
        quantity: product.quantity + 1
      };
      setSelectedProducts(updatedProducts);
    } else {
      Alert.alert('Lỗi', 'Số lượng không thể vượt quá tồn kho');
    }
  };

  const decreaseQuantity = (index) => {
    const product = selectedProducts[index];
    if (product.quantity > 1) {
      const updatedProducts = [...selectedProducts];
      updatedProducts[index] = {
        ...product,
        quantity: product.quantity - 1
      };
      setSelectedProducts(updatedProducts);
    }
  };

  const removeProduct = (index) => {
    const updatedProducts = [...selectedProducts];
    updatedProducts.splice(index, 1);
    setSelectedProducts(updatedProducts);
  };

  const formatCurrency = (amount) => {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + 'đ';
  };

  const handleCreateOrder = async () => {
    if (!customer) {
      Alert.alert('Cảnh báo', 'Vui lòng chọn khách hàng');
      return;
    }

    if (selectedProducts.length === 0) {
      Alert.alert('Cảnh báo', 'Vui lòng chọn ít nhất một sản phẩm');
      return;
    }

    try {
      // Calculate total amount
      const totalAmount = selectedProducts.reduce(
        (sum, product) => sum + product.price * product.quantity,
        0
      );

      // Prepare order data
      const orderData = {
        customerID: customer._id,
        products: selectedProducts.map(product => ({
          productID: product._id,
          name: product.name,
          price: product.price,
          quantity: product.quantity,
          inventory: Math.max(1, product.inventory || 1),
          attributes: product.attributes ? product.attributes.map(attr => ({
            name: attr.name,
            value: Array.isArray(attr.value) ? attr.value : [attr.value]
          })) : [
            {
              name: "Loại",
              value: ["Mặc định"]
            }
          ]
        })),
        totalAmount,
        // Only set payment method if payment status is 'paid'
        paymentMethod: paymentStatus === 'paid' ? paymentMethod : '',
        paymentStatus: paymentStatus,
        status: paymentStatus === 'paid' ? 'processing' : 'pending',
        shippingAddress: customer.address || 'Nhận hàng tại cửa hàng',
        employeeID: rootStore.auth.userId || null,
        notes: notes || ""
      };

      console.log('Creating order with data:', orderData);

      // Debug log to verify createOrder is properly imported
      console.log('createOrder function type:', typeof createOrder);
      
      // Create order using API
      const response = await createOrder(orderData);

      if (response.ok) {
        // Get the created order ID from the response
        const createdOrderId = response.data?.data?._id || response.data?._id;
        
        if (createdOrderId) {
          // Navigate to order detail screen with the new order ID
          navigation.navigate(Screen.ORDER_DETAIL as never, { 
            orderId: createdOrderId 
          } as never);
        } else {
          // Fallback if we can't get the order ID
          Alert.alert('Thành công', 'Đơn hàng đã được tạo thành công', [
            { text: 'OK', onPress: () => navigation.navigate(Screen.ORDERLIST as never) }
          ]);
        }
        
        // Refresh orders in the store
        rootStore.orders.fetchOrders();
      } else {
        console.error('Order creation failed with status:', response.status);
        console.error('Response data:', JSON.stringify(response.data, null, 2));
        
        const errorMessage = response.data?.message || 'Không thể tạo đơn hàng';
        Alert.alert('Lỗi', errorMessage);
      }
    } catch (error) {
      console.error('Error creating order:', error);
      // Show more detailed error message
      let errorMessage = 'Đã xảy ra lỗi khi tạo đơn hàng';
      if (error instanceof Error) {
        errorMessage = `Lỗi: ${error.message}`;
      }
      Alert.alert('Lỗi tạo đơn hàng', errorMessage);
    }
  };

  const saveAsDraft = () => {
    // Implement save as draft functionality
    Alert.alert('Thông báo', 'Chức năng lưu nháp đang được phát triển');
  };

  const renderProductItem = (product, index) => (
    <View key={product._id || index} style={styles.productContainer}>
      <Image
        source={{ uri: product.thumbnail || 'https://via.placeholder.com/80' }}
        style={styles.productImage}
      />
      <View style={styles.productDetails}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.productVariant}>
          {product.attributes?.map(attr => `${attr.name}: ${Array.isArray(attr.value) ? attr.value.join(', ') : attr.value}`).join(' | ')}
        </Text>
        <Text style={styles.productPrice}>{formatCurrency(product.price)}</Text>
        <View style={styles.quantityContainer}>
          <TouchableOpacity onPress={() => decreaseQuantity(index)} style={styles.quantityButton}>
            <Icon name="remove-outline" size={20} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.productQuantity}>{product.quantity}</Text>
          <TouchableOpacity onPress={() => increaseQuantity(index)} style={styles.quantityButton}>
            <Icon name="add-outline" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity onPress={() => removeProduct(index)}>
        <Icon name="close-outline" size={24} color="#000" />
      </TouchableOpacity>
    </View>
  );

  return (
    <BaseLayout>
      {/* Header */}
      <Header
        title="Tạo đơn hàng"
        showBackIcon
        onPressBack={() => navigation.goBack()}
      />

      <ScrollView style={styles.scrollView}>
        {/* Product Selection */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Sản phẩm</Text>
          <TouchableOpacity onPress={navigateToProductSelection}>
            <Text style={styles.linkText}>Cửa hàng chính</Text>
          </TouchableOpacity>
        </View>

        {/* Selected Products */}
        {selectedProducts.length > 0 ? (
          selectedProducts.map((product, index) => renderProductItem(product, index))
        ) : (
          <View style={styles.emptyProductContainer}>
            <Icon name="cart-outline" size={50} color="#ccc" />
            <Text style={styles.emptyText}>Đơn hàng của bạn chưa có sản phẩm nào!</Text>
            <TouchableOpacity style={styles.selectProductButton} onPress={navigateToProductSelection}>
              <Icon name="add-outline" size={24} color="#fff" />
              <Text style={styles.selectProductText}>Chọn sản phẩm</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Customer Info */}
        <TouchableOpacity style={styles.customerSection} onPress={navigateToSelectCustomer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Khách hàng</Text>
            <Icon name="chevron-forward-outline" size={moderateScale(20)} color="#007AFF" />
          </View>
          
          {customer ? (
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{customer.fullName}</Text>
              <Text style={styles.customerPhone}>{customer.phoneNumber}</Text>
              <Text style={styles.customerAddress}>{customer.address}</Text>
            </View>
          ) : (
            <>
              <Text style={styles.selectCustomerText}>Chọn khách hàng</Text>
              <TouchableOpacity 
                style={styles.mockCustomerButton} 
                onPress={useMockCustomer}
              >
                <Text style={styles.mockCustomerText}>Sử dụng khách hàng mẫu</Text>
              </TouchableOpacity>
            </>
          )}
        </TouchableOpacity>

        {/* Payment Method Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Thanh toán</Text>
          <View style={styles.paymentStatusContainer}>
            <Text style={styles.paymentStatusLabel}>Trạng thái thanh toán:</Text>
            <View style={styles.paymentStatusOptions}>
              <TouchableOpacity
                style={[
                  styles.paymentStatusOption,
                  paymentStatus === 'paid' && styles.selectedPaymentStatusOption
                ]}
                onPress={() => setPaymentStatus('paid')}
              >
                <Icon
                  name="checkmark-circle-outline"
                  size={moderateScale(22)}
                  color={paymentStatus === 'paid' ? color.accentColor.whiteColor : color.accentColor.darkColor}
                />
                <Text
                  style={[
                    styles.paymentStatusText,
                    paymentStatus === 'paid' && styles.selectedPaymentMethodText
                  ]}
                >
                  Đã thanh toán
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.paymentStatusOption,
                  paymentStatus === 'unpaid' && styles.selectedPaymentStatusOption
                ]}
                onPress={() => setPaymentStatus('unpaid')}
              >
                <Icon
                  name="time-outline"
                  size={moderateScale(22)}
                  color={paymentStatus === 'unpaid' ? color.accentColor.whiteColor : color.accentColor.darkColor}
                />
                <Text
                  style={[
                    styles.paymentStatusText,
                    paymentStatus === 'unpaid' && styles.selectedPaymentMethodText
                  ]}
                >
                  Thanh toán sau
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Only show payment methods if status is 'paid' */}
          {paymentStatus === 'paid' && (
            <View style={styles.paymentMethodsContainer}>
              <Text style={styles.paymentMethodsLabel}>Phương thức thanh toán:</Text>
              
              <View style={styles.paymentMethodsOptions}>
                <TouchableOpacity
                  style={[
                    styles.paymentMethodOption,
                    paymentMethod === 'cash' && styles.selectedPaymentMethod
                  ]}
                  onPress={() => setPaymentMethod('cash')}
                >
                  <Icon
                    name="cash-outline"
                    size={moderateScale(22)}
                    color={paymentMethod === 'cash' ? color.accentColor.whiteColor : color.accentColor.darkColor}
                  />
                  <Text
                    style={[
                      styles.paymentMethodText,
                      paymentMethod === 'cash' && styles.selectedPaymentMethodText
                    ]}
                  >
                    Tiền mặt
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.paymentMethodOption,
                    paymentMethod === 'credit card' && styles.selectedPaymentMethod
                  ]}
                  onPress={() => setPaymentMethod('credit card')}
                >
                  <Icon
                    name="card-outline"
                    size={moderateScale(22)}
                    color={
                      paymentMethod === 'credit card'
                        ? color.accentColor.whiteColor
                        : color.accentColor.darkColor
                    }
                  />
                  <Text
                    style={[
                      styles.paymentMethodText,
                      paymentMethod === 'credit card' &&
                        styles.selectedPaymentMethodText
                    ]}
                  >
                    Chuyển khoản
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.paymentMethodOption,
                    paymentMethod === 'e-wallet' && styles.selectedPaymentMethod
                  ]}
                  onPress={() => setPaymentMethod('e-wallet')}
                >
                  <Icon
                    name="wallet-outline"
                    size={moderateScale(22)}
                    color={
                      paymentMethod === 'e-wallet' ? color.accentColor.whiteColor : color.accentColor.darkColor
                    }
                  />
                  <Text
                    style={[
                      styles.paymentMethodText,
                      paymentMethod === 'e-wallet' &&
                        styles.selectedPaymentMethodText
                    ]}
                  >
                    Ví điện tử
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Notes */}
        <View style={styles.notesSection}>
          <Text style={styles.sectionTitle}>Ghi chú</Text>
          <Input
            placeholderText="Nhập ghi chú đơn hàng"
            multiline
            numberOfLines={3}
            inputContainerStyle={styles.textArea}
            onChangeText={setNotes}
            value={notes}
          />
        </View>

        {/* Order Summary */}
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tổng số lượng</Text>
            <Text style={styles.summaryValue}>{totalQuantity}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tổng tiền hàng</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalAmount)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Giảm giá</Text>
            <Text style={styles.summaryValue}>0đ</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Phí giao hàng</Text>
            <Text style={styles.summaryValue}>0đ</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Tổng khách phải trả</Text>
            <Text style={styles.totalAmount}>{formatCurrency(totalAmount)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <Button
          title="Lưu nháp"
          buttonContainerStyle={styles.draftButton}
          titleStyle={styles.draftButtonText}
          onPress={saveAsDraft}
        />
        <Button
          title="Tạo đơn"
          buttonContainerStyle={styles.createButton}
          titleStyle={styles.createButtonText}
          onPress={handleCreateOrder}
        />
      </View>
    </BaseLayout>
  );
});

// Styles
const styles = StyleSheet.create({
  scrollView: {
    paddingHorizontal: moderateScale(16),
    paddingTop: moderateScale(10),
    paddingBottom: moderateScale(50),
    marginBottom:moderateScale(100),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: moderateScale(8),
  },
  sectionTitle: {
    fontSize: moderateScale(15),
    fontWeight: 'bold',
    color: '#000',
  },
  linkText: {
    fontSize: moderateScale(12),
    color: '#007AFF',
  },
  productContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: moderateScale(8),
    padding: moderateScale(8),
    marginBottom: moderateScale(8),
    alignItems: 'center',
  },
  productImage: {
    width: moderateScale(80),
    height: moderateScale(80),
    borderRadius:moderateScale(8),
    marginRight: moderateScale(8),
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: moderateScale(15),
    fontWeight: 'bold',
    color: '#000',
  },
  productVariant: {
    fontSize: moderateScale(12),
    color: '#666',
    marginVertical: moderateScale(2),
  },
  productPrice: {
    fontSize: moderateScale(15),
    fontWeight: 'bold',
    color: '#000',
    marginVertical: moderateScale(2),
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: moderateScale(4),
  },
  quantityButton: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    backgroundColor: '#f1f1f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productQuantity: {
    fontSize: moderateScale(12),
    color: '#000',
    marginHorizontal: moderateScale(10),
  },
  emptyProductContainer: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(8),
    padding: moderateScale(24),
    marginBottom: moderateScale(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: moderateScale(12),
    color: '#666',
    marginVertical: moderateScale(16),
  },
  selectProductButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    borderRadius: moderateScale(8),
    padding: moderateScale(8),
    alignItems: 'center',
  },
  selectProductText: {
    fontSize: moderateScale(14),
    color: '#fff',
    marginLeft: moderateScale(8),
  },
  customerSection: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(8),
    padding: moderateScale(16),
    marginBottom: moderateScale(16),
  },
  customerInfo: {
    marginTop: moderateScale(8),
  },
  customerName: {
    fontSize: moderateScale(13),
    fontWeight: 'bold',
    color: '#000',
  },
  customerPhone: {
    fontSize: moderateScale(14),
    color: '#666',
    marginTop: moderateScale(4),
  },
  customerAddress: {
    fontSize: moderateScale(12),
    color: '#666',
    marginTop: moderateScale(4),
  },
  selectCustomerText: {
    fontSize: moderateScale(14),
    color: '#666',
    marginTop: moderateScale(8),
  },
  paymentStatusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: moderateScale(16),
  },
  paymentStatusLabel: {
    fontSize: moderateScale(14),
    fontWeight: 'bold',
    color: '#000',
  },
  paymentStatusOptions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentStatusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(8),
    borderWidth: 1,
    borderColor: color.accentColor.grayColor,
    borderRadius: moderateScale(8),
    marginVertical: moderateScale(8),
    marginHorizontal: moderateScale(4),
    minWidth: moderateScale(150),
  },
  selectedPaymentStatusOption: {
    borderColor: color.primaryColor,
    backgroundColor: color.primaryColor,
  },
  paymentStatusText: {
    fontSize: moderateScale(14),
    color: color.accentColor.darkColor,
    marginLeft: moderateScale(8),
  },
  selectedPaymentMethodText: {
    color: color.accentColor.whiteColor,
  },
  sectionContainer: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(8),
    padding: moderateScale(16),
    marginBottom: moderateScale(16),
  },
  paymentMethodsContainer: {
    marginBottom: moderateScale(16),
  },
  paymentMethodsLabel: {
    fontSize: moderateScale(14),
    fontWeight: 'bold',
    color: color.accentColor.darkColor,
    marginBottom: moderateScale(8),
  },
  paymentMethodsOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paymentMethodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.white,
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: color.accentColor.grayColor,
    flex: 1,
    marginHorizontal: moderateScale(4),
  },
  selectedPaymentMethod: {
    borderColor: color.primaryColor,
    backgroundColor: color.primaryColor,
  },
  paymentMethodText: {
    fontSize: moderateScale(12),
    color: color.accentColor.darkColor,
    marginLeft: moderateScale(4),
  },
  notesSection: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(8),
    padding: moderateScale(16),
    marginBottom: moderateScale(16),
  },
  textArea: {
    borderWidth: moderateScale(1),
    borderColor: '#ddd',
    borderRadius: moderateScale(8),
    padding: moderateScale(20),
    fontSize: moderateScale(30),
    textAlignVertical: 'top',
    marginTop: moderateScale(8),
  },
  summarySection: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(8),
    padding: moderateScale(16),
    marginBottom: moderateScale(16),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: moderateScale(8),
  },
  summaryLabel: {
    fontSize: moderateScale(14),
    color: '#666',
  },
  summaryValue: {
    fontSize: moderateScale(14),
    color: '#000',
  },
  totalRow: {
    marginTop: moderateScale(8),
    paddingTop: moderateScale(8),
    borderTopWidth: moderateScale(1),
    borderTopColor: '#eee',
  },
  totalLabel: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: '#000',
  },
  totalAmount: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: '#007AFF',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: moderateScale(10),
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
    position: 'absolute',
    bottom: 70,
    left: 0,
    right: 0,
    zIndex: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  draftButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingVertical: moderateScale(0),
    borderRadius: moderateScale(8),
    alignItems: 'center',
    marginRight: moderateScale(8),
    marginVertical:moderateScale(5),
    height:moderateScale(35),
  },
  draftButtonText: {
    fontSize: moderateScale(14),
    color: '#000',
  },
  createButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: moderateScale(0),
    borderRadius: moderateScale(8),
    alignItems: 'center',
    marginLeft: moderateScale(8),
    marginVertical:moderateScale(5),
    height:moderateScale(35),
  },
  createButtonText: {
    fontSize: moderateScale(14),
    color: '#fff',
  },
  mockCustomerButton: {
    marginTop: moderateScale(8),
    backgroundColor: color.primaryColor,
    borderRadius: moderateScale(8),
    padding: moderateScale(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockCustomerText: {
    fontSize: moderateScale(14),
    color: color.accentColor.whiteColor,
    textAlign: 'center',
  },
});

export default CreateOrderScreen;
