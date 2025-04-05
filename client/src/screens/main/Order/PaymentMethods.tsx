import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, TextInput, ScrollView, TouchableOpacity, Modal, Dimensions, SafeAreaView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { observer } from 'mobx-react-lite';
import Icon from 'react-native-vector-icons/Ionicons';
import { Screen } from '../../../navigation/navigation.type';
import { Header, DynamicText } from '../../../components';
import { color, moderateScale } from '../../../utils';
import { updateOrderPayment } from '../../../services/api/ordersApi';
import { rootStore } from '../../../models/root-store';

// Lấy kích thước màn hình để điều chỉnh style phù hợp
const { width } = Dimensions.get('window');
const isTablet = width >= 768; // Giả định tablet có width >= 768

interface PaymentScreenProps {
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  remainingAmount?: number;
  isPartialPayment?: boolean;
  isNewOrder?: boolean;
  onPaymentComplete?: (method: string, amount: number) => void;
}

const PaymentMethods = observer(() => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  
  // Extract parameters from route
  const { 
    orderId, 
    orderNumber,
    totalAmount, 
    remainingAmount,
    isPartialPayment = false,
    isNewOrder = false,
    onPaymentComplete
  } = route.params as PaymentScreenProps;

  // Lấy số tiền cần thanh toán (tổng hóa đơn hoặc số tiền còn lại nếu thanh toán 1 phần)
  const amountToPay = remainingAmount || totalAmount;
  
  const [selectedMethod, setSelectedMethod] = useState<string>('cash');
  const [paymentAmount, setPaymentAmount] = useState<string>(amountToPay.toString());
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [paymentNote, setPaymentNote] = useState<string>('');

  // Đảm bảo giá trị ban đầu cho số tiền
  useEffect(() => {
    if (amountToPay) {
      setPaymentAmount(amountToPay.toString());
    }
  }, [amountToPay]);

  // Format currency function
  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return '0đ';
    return numAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + 'đ';
  };

  // Payment methods available
  const paymentMethods = [
    { id: 'cash', label: 'Tiền mặt', icon: 'cash-outline' },
    { id: 'credit card', label: 'Chuyển khoản', icon: 'card-outline' },
    { id: 'e-wallet', label: 'Ví điện tử', icon: 'wallet-outline' },
    { id: 'debit card', label: 'Thanh toán thẻ', icon: 'card-outline' },
  ];

  // Handle payment amount change
  const handleAmountChange = (value: string) => {
    // Remove non-numeric characters
    const numericValue = value.replace(/[^0-9]/g, '');
    setPaymentAmount(numericValue);
  };

  // Validate payment
  const validatePayment = () => {
    const amount = parseInt(paymentAmount, 10);
    
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số tiền hợp lệ');
      return false;
    }
    
    if (amount > amountToPay) {
      Alert.alert('Lỗi', 'Số tiền thanh toán không được vượt quá số tiền cần thanh toán');
      return false;
    }
    
    return true;
  };

  // Handle payment processing
  const handlePayment = async () => {
    if (!validatePayment()) return;
    setShowConfirmation(true);
  };
  
  // Process payment after confirmation
  const processPayment = async () => {
    setShowConfirmation(false);
    setIsSubmitting(true);
    
    try {
      const amount = parseInt(paymentAmount, 10);
      const isPartialPay = amount < amountToPay;
      
      // Đối với đơn hàng mới, gọi callback để truyền thông tin ngược lại
      if (isNewOrder && onPaymentComplete) {
        onPaymentComplete(selectedMethod, amount);
        navigation.goBack();
        return;
      }
      
      // Đối với đơn hàng đã tồn tại, gọi API để cập nhật thanh toán
      console.log(`Đang xử lý thanh toán cho đơn hàng ${orderId}`);
      console.log(`Phương thức: ${selectedMethod}, Số tiền: ${amount}, Thanh toán một phần: ${isPartialPay}`);
      
      const response = await updateOrderPayment(orderId, selectedMethod, amount, isPartialPay);
      
      if (response.ok) {
        // Refresh order data in store
        await rootStore.orders.fetchOrders();
        
        // Hiển thị thông báo thành công với chi tiết thanh toán
        Alert.alert(
          'Thành công', 
          `Đã thanh toán ${formatCurrency(amount)} qua ${getMethodLabel(selectedMethod)}`,
          [
            { 
              text: 'OK', 
              onPress: () => {
                // Navigate back to order detail screen
                navigation.navigate(Screen.ORDER_DETAIL, { orderId });
              }
            }
          ]
        );
      } else {
        const errorData = response.data as { message?: string } | undefined;
        const errorMessage = errorData?.message || 'Không thể cập nhật thanh toán';
        Alert.alert('Lỗi', errorMessage);
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi xử lý thanh toán');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Get payment method label
  const getMethodLabel = (methodId: string): string => {
    const method = paymentMethods.find(m => m.id === methodId);
    return method ? method.label : methodId;
  };

  // Tính phần trăm thanh toán
  const calculatePaymentPercentage = () => {
    const amount = parseInt(paymentAmount, 10);
    if (isNaN(amount) || amountToPay === 0) return 0;
    return Math.round((amount / amountToPay) * 100);
  };

  // Kiểm tra liệu có phải là thanh toán một phần hay không
  const isPartialPaymentNow = () => {
    const amount = parseInt(paymentAmount, 10);
    return !isNaN(amount) && amount < amountToPay;
  };

  // Hiển thị tiêu đề phù hợp dựa trên loại thanh toán
  const getPaymentTitle = () => {
    if (isNewOrder) {
      return "Thanh toán đơn hàng mới";
    } else if (remainingAmount && isPartialPayment) {
      return "Thanh toán phần còn lại";
    } else {
      return "Thanh toán";
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title={getPaymentTitle()}
        showBackIcon
        onPressBack={() => navigation.goBack()}
        showRightIcon
        RightIcon={<Icon name="checkmark" size={24} color={color.primaryColor} />}
        onPressRight={handlePayment}
      />
      
      <View style={styles.mainContainer}>
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={[
            styles.scrollViewContent,
            isTablet && styles.tabletScrollViewContent
          ]}
        >
          {/* Phần hiển thị số tiền thanh toán */}
          <View style={[styles.amountContainer, isTablet && styles.tabletAmountContainer]}>
            <DynamicText style={styles.amountLabel}>Số tiền thanh toán</DynamicText>
            <View style={styles.amountInputWrapper}>
              <TextInput
                style={[styles.amountInput, isTablet && styles.tabletAmountInput]}
                keyboardType="numeric"
                value={paymentAmount}
                onChangeText={handleAmountChange}
                placeholder="0"
                placeholderTextColor="#999"
              />
            </View>
            
            {remainingAmount !== undefined && (
              <View style={styles.remainingAmountContainer}>
                <DynamicText style={styles.remainingText}>
                  Số tiền cần thanh toán: {formatCurrency(remainingAmount)}
                </DynamicText>
                {totalAmount !== remainingAmount && (
                  <DynamicText style={styles.previousPaymentText}>
                    Đã thanh toán trước đó: {formatCurrency(totalAmount - remainingAmount)}
                  </DynamicText>
                )}
              </View>
            )}
          </View>
          
          {/* Phần nhập tham chiếu */}
          <View style={[styles.noteSection, isTablet && styles.tabletSection]}>
            <DynamicText style={styles.sectionTitle}>Tham chiếu</DynamicText>
            <TextInput
              style={styles.noteInput}
              placeholder="Nhập tham chiếu"
              value={paymentNote}
              onChangeText={setPaymentNote}
            />
          </View>

          {/* Phần chọn phương thức thanh toán */}
          <View style={[styles.methodsSection, isTablet && styles.tabletSection]}>
            <DynamicText style={styles.sectionTitle}>Phương thức thanh toán</DynamicText>
            
            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={styles.methodItem}
                onPress={() => setSelectedMethod(method.id)}
              >
                <View style={styles.methodItemLeft}>
                  <View style={styles.methodIconContainer}>
                    <Icon name={method.icon} size={24} color="#4CAF50" />
                  </View>
                  <DynamicText style={styles.methodLabel}>{method.label}</DynamicText>
                </View>
                
                <View style={styles.radioButton}>
                  {selectedMethod === method.id && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        
        <TouchableOpacity 
          style={[styles.completeButton, isTablet && styles.tabletCompleteButton]}
          onPress={handlePayment}
          disabled={isSubmitting}
        >
          <DynamicText style={styles.completeButtonText}>
            {isSubmitting ? 'Đang xử lý...' : 'Hoàn tất'}
          </DynamicText>
        </TouchableOpacity>
      </View>
      
      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmation}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmation(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, isTablet && styles.tabletModalContainer]}>
            <DynamicText style={styles.modalTitle}>Xác nhận thanh toán</DynamicText>
            
            <View style={styles.modalContent}>
              <DynamicText style={styles.confirmationText}>
                Xác nhận thanh toán {formatCurrency(paymentAmount)} qua {getMethodLabel(selectedMethod)}?
              </DynamicText>
              
              {isPartialPaymentNow() && (
                <DynamicText style={styles.confirmationPartial}>
                  Đây là thanh toán một phần ({calculatePaymentPercentage()}%). Đơn hàng sẽ được đánh dấu là "Thanh toán một phần".
                </DynamicText>
              )}
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setShowConfirmation(false)}
              >
                <DynamicText style={styles.cancelButtonText}>Hủy</DynamicText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={processPayment}
              >
                <DynamicText style={styles.confirmButtonText}>Xác nhận</DynamicText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  mainContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: moderateScale(20),
  },
  tabletScrollViewContent: {
    paddingHorizontal: moderateScale(16),
  },
  container: {
    flexGrow: 1,
    backgroundColor: '#f5f5f5',
  },
  amountContainer: {
    padding: moderateScale(16),
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: moderateScale(8),
  },
  tabletAmountContainer: {
    padding: moderateScale(24),
    marginBottom: moderateScale(16),
  },
  amountLabel: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: color.accentColor.darkColor,
    marginBottom: moderateScale(8),
  },
  amountInputWrapper: {
    marginBottom: moderateScale(8),
    width: '100%',
  },
  amountInput: {
    fontSize: moderateScale(40),
    fontWeight: 'bold',
    color: color.accentColor.darkColor,
    textAlign: 'center',
    width: '100%',
  },
  tabletAmountInput: {
    fontSize: moderateScale(50),
    marginVertical: moderateScale(16),
  },
  remainingAmountContainer: {
    marginTop: moderateScale(12),
    backgroundColor: '#f8f8f8',
    padding: moderateScale(10),
    borderRadius: moderateScale(8),
    width: '100%',
  },
  remainingText: {
    fontSize: moderateScale(16),
    color: color.primaryColor,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  previousPaymentText: {
    fontSize: moderateScale(14),
    color: color.accentColor.grayColor,
    marginTop: moderateScale(4),
    textAlign: 'center',
  },
  noteSection: {
    backgroundColor: '#fff',
    padding: moderateScale(16),
    marginTop: moderateScale(8),
    borderRadius: moderateScale(8),
    marginHorizontal: moderateScale(8),
  },
  tabletSection: {
    padding: moderateScale(24),
    marginTop: moderateScale(16),
    borderRadius: moderateScale(12),
  },
  sectionTitle: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: color.accentColor.darkColor,
    marginBottom: moderateScale(16),
  },
  noteInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: moderateScale(8),
    fontSize: moderateScale(16),
  },
  methodsSection: {
    backgroundColor: '#fff',
    padding: moderateScale(16),
    marginTop: moderateScale(16),
    borderRadius: moderateScale(8),
    marginHorizontal: moderateScale(8),
  },
  methodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  methodItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodIconContainer: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(16),
  },
  methodLabel: {
    fontSize: moderateScale(16),
    color: color.accentColor.darkColor,
  },
  radioButton: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    borderWidth: 2,
    borderColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInner: {
    width: moderateScale(12),
    height: moderateScale(12),
    borderRadius: moderateScale(6),
    backgroundColor: '#007AFF',
  },
  completeButton: {
    backgroundColor: '#007AFF',
    padding: moderateScale(16),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
  },
  tabletCompleteButton: {
    padding: moderateScale(20),
  },
  completeButtonText: {
    color: '#fff',
    fontSize: moderateScale(16),
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    padding: moderateScale(20),
  },
  tabletModalContainer: {
    width: '70%',
    maxWidth: 500,
    padding: moderateScale(30),
  },
  modalTitle: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: color.accentColor.darkColor,
    marginBottom: moderateScale(16),
    textAlign: 'center',
  },
  modalContent: {
    marginBottom: moderateScale(20),
  },
  confirmationText: {
    fontSize: moderateScale(16),
    color: color.accentColor.darkColor,
    textAlign: 'center',
    marginBottom: moderateScale(12),
  },
  confirmationPartial: {
    fontSize: moderateScale(14),
    color: '#FFA500',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    height: moderateScale(44),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: moderateScale(8),
    marginHorizontal: moderateScale(8),
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    fontSize: moderateScale(16),
    color: color.accentColor.darkColor,
  },
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  confirmButtonText: {
    fontSize: moderateScale(16),
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default PaymentMethods;
