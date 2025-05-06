import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  Alert,
  TextInput,
  TouchableOpacity,
  Modal,
  Dimensions,
  Image,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {observer} from 'mobx-react-lite';
import Icon from 'react-native-vector-icons/Ionicons';
import {Header, DynamicText, BaseLayout} from '../../../components';
import {color, moderateScale} from '../../../utils';
import {updateOrderPayment} from '../../../services/api/ordersApi';
import {rootStore} from '../../../models/root-store';
import LinearGradient from 'react-native-linear-gradient';
import {Fonts} from '../../../assets/fonts';
import {Images} from '../../../assets/images';

// Lấy kích thước màn hình để điều chỉnh style phù hợp
const {width} = Dimensions.get('window');
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
    totalAmount,
    remainingAmount,
    isPartialPayment = false,
    isNewOrder = false,
    onPaymentComplete,
  } = route.params as PaymentScreenProps;

  // Lấy số tiền cần thanh toán (tổng hóa đơn hoặc số tiền còn lại nếu thanh toán 1 phần)
  const amountToPay = remainingAmount || totalAmount;

  const [selectedMethod, setSelectedMethod] = useState<string>('cash');
  const [paymentAmount, setPaymentAmount] = useState<string>(
    amountToPay.toString(),
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [paymentNote, setPaymentNote] = useState<string>('');

  // Đảm bảo giá trị ban đầu cho số tiền
  useEffect(() => {
    if (amountToPay) {
      setPaymentAmount(amountToPay.toString());
    }
  }, [amountToPay]);

  // Format currency function with dot separator for thousands
  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return '0 ₫';
    return numAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' ₫';
  };

  // Format displayed amount for input
  const formatDisplayAmount = (amount: string) => {
    // Remove non-numeric characters and convert to number
    const numericValue = amount.replace(/[^0-9]/g, '');
    if (numericValue === '') return '';

    // Format with dots
    const formattedValue = parseInt(numericValue)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return formattedValue;
  };

  // Payment methods available
  const paymentMethods = [
    {id: 'cash', label: 'Tiền mặt', icon: 'cash-outline'},
    {id: 'credit card', label: 'Chuyển khoản', icon: 'card-outline'},
    {id: 'e-wallet', label: 'Ví điện tử', icon: 'wallet-outline'},
    {id: 'debit card', label: 'Thanh toán thẻ', icon: 'card-outline'},
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
      Alert.alert(
        'Lỗi',
        'Số tiền thanh toán không được vượt quá số tiền cần thanh toán',
      );
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
      console.log(
        `Phương thức: ${selectedMethod}, Số tiền: ${amount}, Thanh toán một phần: ${isPartialPay}`,
      );

      const response = await updateOrderPayment(
        orderId,
        selectedMethod,
        amount,
        isPartialPay,
      );

      if (response.ok) {
        // Refresh order data in store
        await rootStore.orders.fetchOrders();

        // Gọi callback nếu được cung cấp (để có thể cập nhật trạng thái ở màn hình gọi)
        if (onPaymentComplete) {
          onPaymentComplete(selectedMethod, amount);
        }

        // Hiển thị thông báo thành công với chi tiết thanh toán
        Alert.alert(
          'Thành công',
          isPartialPay
            ? 'Thanh toán một phần đã được ghi nhận. Đơn hàng đã được chuyển sang trạng thái "Chờ xử lý"'
            : 'Thanh toán đã được ghi nhận thành công. Đơn hàng đã được chuyển sang trạng thái "Đã xử lý"',
          [
            {
              text: 'Xem chi tiết đơn hàng',
              onPress: () => navigation.navigate('ORDER_DETAIL', {orderId}),
            },
          ],
        );
      } else {
        const errorData = response.data as {message?: string} | undefined;
        const errorMessage =
          errorData?.message || 'Không thể cập nhật thanh toán';
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
      return 'Thanh toán đơn hàng mới';
    } else if (remainingAmount && isPartialPayment) {
      return 'Thanh toán phần còn lại';
    } else {
      return 'Thanh toán';
    }
  };

  return (
    <BaseLayout scrollable>
      <Header
        title={getPaymentTitle()}
        showBackIcon
        onPressBack={() => navigation.goBack()}
      />
      {/* Phần hiển thị số tiền thanh toán */}
      <LinearGradient
        colors={['#ECF6FF', '#F9FCFF']}
        style={[
          styles.sectionCard,
          styles.amountContainer,
          isTablet && styles.tabletAmountContainer,
        ]}>
        <DynamicText style={styles.amountLabel}>Số tiền thanh toán</DynamicText>
        <View style={styles.amountInputWrapper}>
          <View style={styles.currencySymbolContainer}>
            <TextInput
              style={[styles.amountInput, isTablet && styles.tabletAmountInput]}
              keyboardType="numeric"
              value={formatDisplayAmount(paymentAmount)}
              onChangeText={handleAmountChange}
              placeholder="0"
              placeholderTextColor="#999"
            />
            <DynamicText style={styles.currencySymbol}>₫</DynamicText>
          </View>
        </View>

        {remainingAmount !== undefined && (
          <View style={styles.remainingAmountContainer}>
            <DynamicText style={styles.remainingText}>
              Số tiền cần thanh toán: {formatCurrency(remainingAmount)}
            </DynamicText>
            {totalAmount !== remainingAmount && (
              <DynamicText style={styles.previousPaymentText}>
                Đã thanh toán trước đó:{' '}
                {formatCurrency(totalAmount - remainingAmount)}
              </DynamicText>
            )}
          </View>
        )}
      </LinearGradient>

      {/* Phần nhập tham chiếu */}
      <View style={[styles.sectionCard, isTablet && styles.tabletSection]}>
        <DynamicText style={styles.sectionTitle}>Tham chiếu</DynamicText>
        <TextInput
          style={styles.noteInput}
          placeholder="Nhập tham chiếu thanh toán (tùy chọn)"
          value={paymentNote}
          onChangeText={setPaymentNote}
        />
      </View>

      {/* Phần chọn phương thức thanh toán dạng hàng ngang */}
      <View style={[styles.sectionCard, isTablet && styles.tabletSection]}>
        <DynamicText style={styles.sectionTitle}>
          Phương thức thanh toán
        </DynamicText>

        <View style={styles.paymentMethodsRow}>
          {paymentMethods.map(method => {
            const isSelected = selectedMethod === method.id;
            return (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentMethodCard,
                  isSelected && styles.selectedPaymentMethodCard,
                ]}
                onPress={() => setSelectedMethod(method.id)}>
                <View
                  style={[
                    styles.methodIconContainer,
                    isSelected && styles.selectedMethodIconContainer,
                  ]}>
                  <Icon
                    name={method.icon}
                    size={24}
                    color={isSelected ? '#FFFFFF' : color.primaryColor}
                  />
                </View>
                <DynamicText
                  style={[
                    styles.paymentMethodLabel,
                    isSelected && styles.selectedPaymentMethodLabel,
                  ]}>
                  {method.label}
                </DynamicText>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Hiển thị mã QR khi phương thức chuyển khoản được chọn */}
        {selectedMethod === 'credit card' && (
          <View style={styles.qrCodeContainer}>
            <DynamicText style={styles.qrCodeTitle}>
              Quét mã QR để chuyển khoản
            </DynamicText>
            <View style={styles.qrCodeImageContainer}>
              <Image
                source={Images.QR_CODE}
                style={styles.qrCodeImage}
                resizeMode="contain"
              />
            </View>
            <DynamicText style={styles.qrCodeHint}>
              Sau khi chuyển khoản, vui lòng nhập số tiền và bấm "Hoàn tất thanh
              toán"
            </DynamicText>
          </View>
        )}
      </View>

      {/* Button Section - Cancel and Complete Payment Buttons */}
      <View
        style={[
          styles.buttonContainer,
          isTablet && styles.tabletButtonContainer,
        ]}>
        {/* Cancel Button */}
        <TouchableOpacity
          style={[
            styles.cancelPaymentButton,
            isTablet && styles.tabletCancelButton,
          ]}
          onPress={() => navigation.goBack()}>
          <DynamicText style={styles.cancelPaymentText}>Hủy</DynamicText>
        </TouchableOpacity>

        {/* Complete Payment Button */}
        <LinearGradient
          colors={['#007AFF', '#0055FF']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={[
            styles.completeButton,
            isTablet && styles.tabletCompleteButton,
          ]}>
          <TouchableOpacity
            style={styles.completeButtonTouchable}
            onPress={handlePayment}
            disabled={isSubmitting}>
            <DynamicText style={styles.completeButtonText}>
              {isSubmitting ? 'Đang xử lý...' : 'Hoàn tất thanh toán'}
            </DynamicText>
          </TouchableOpacity>
        </LinearGradient>
      </View>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmation}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmation(false)}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContainer,
              isTablet && styles.tabletModalContainer,
            ]}>
            <DynamicText style={styles.modalTitle}>
              Xác nhận thanh toán
            </DynamicText>

            <View style={styles.modalContent}>
              <DynamicText style={styles.confirmationText}>
                Xác nhận thanh toán {formatCurrency(paymentAmount)} qua{' '}
                {getMethodLabel(selectedMethod)}?
              </DynamicText>

              {isPartialPaymentNow() && (
                <View style={styles.partialPaymentWarning}>
                  <Icon name="alert-circle-outline" size={20} color="#FFA500" />
                  <DynamicText style={styles.confirmationPartial}>
                    Đây là thanh toán một phần ({calculatePaymentPercentage()}
                    %). Đơn hàng sẽ được đánh dấu là "Thanh toán một phần".
                  </DynamicText>
                </View>
              )}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowConfirmation(false)}>
                <DynamicText style={styles.cancelButtonText}>Hủy</DynamicText>
              </TouchableOpacity>

              <LinearGradient
                colors={['#007AFF', '#0055FF']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={[styles.modalButton, styles.confirmButton]}>
                <TouchableOpacity
                  style={styles.confirmButtonTouchable}
                  onPress={processPayment}>
                  <DynamicText style={styles.confirmButtonText}>
                    Xác nhận
                  </DynamicText>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </View>
        </View>
      </Modal>
    </BaseLayout>
  );
});

const styles = StyleSheet.create({
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
    padding: moderateScale(16),
  },
  tabletScrollViewContent: {
    paddingHorizontal: moderateScale(20),
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginBottom: moderateScale(16),
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.03)',
  },
  amountContainer: {
    alignItems: 'center',
    padding: moderateScale(20),
  },
  tabletAmountContainer: {
    padding: moderateScale(28),
  },
  amountLabel: {
    fontSize: moderateScale(16),
    color: color.accentColor.darkColor,
    marginBottom: moderateScale(16),
    fontFamily: Fonts.Inter_SemiBold,
  },
  amountInputWrapper: {
    marginBottom: moderateScale(12),
    width: '100%',
    alignItems: 'center',
  },
  currencySymbolContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountInput: {
    fontSize: moderateScale(40),
    color: color.accentColor.darkColor,
    textAlign: 'center',
    fontFamily: Fonts.Inter_Bold,
  },
  currencySymbol: {
    fontSize: moderateScale(36),
    color: color.accentColor.darkColor,
    marginLeft: moderateScale(4),
    fontFamily: Fonts.Inter_Bold,
  },
  tabletAmountInput: {
    fontSize: moderateScale(50),
    marginVertical: moderateScale(16),
  },
  remainingAmountContainer: {
    marginTop: moderateScale(16),
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
    padding: moderateScale(12),
    borderRadius: moderateScale(10),
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.2)',
  },
  remainingText: {
    fontSize: moderateScale(16),
    color: color.primaryColor,
    textAlign: 'center',
    fontFamily: Fonts.Inter_SemiBold,
  },
  previousPaymentText: {
    fontSize: moderateScale(14),
    color: color.accentColor.grayColor,
    marginTop: moderateScale(4),
    textAlign: 'center',
    fontFamily: Fonts.Inter_Regular,
  },
  tabletSection: {
    padding: moderateScale(24),
  },
  sectionTitle: {
    fontSize: moderateScale(16),
    color: color.accentColor.darkColor,
    marginBottom: moderateScale(16),
    fontFamily: Fonts.Inter_SemiBold,
  },
  noteInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: moderateScale(10),
    fontSize: moderateScale(16),
    fontFamily: Fonts.Inter_Regular,
  },
  paymentMethodsRow: {
    flexDirection: 'row',
    paddingVertical: moderateScale(8),
    justifyContent: 'space-between',
    marginBottom: moderateScale(12),
  },
  paymentMethodCard: {
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
    borderRadius: moderateScale(10),
    padding: moderateScale(16),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.1)',
    width: '23%',
  },
  selectedPaymentMethodCard: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderColor: color.primaryColor,
  },
  methodIconContainer: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(8),
  },
  selectedMethodIconContainer: {
    backgroundColor: color.primaryColor,
  },
  paymentMethodLabel: {
    fontSize: moderateScale(14),
    color: color.accentColor.darkColor,
    fontFamily: Fonts.Inter_Regular,
    textAlign: 'center',
    marginTop: moderateScale(4),
  },
  selectedPaymentMethodLabel: {
    color: color.primaryColor,
    fontFamily: Fonts.Inter_SemiBold,
  },
  completeButton: {
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 0,
    borderRadius: moderateScale(12),
    overflow: 'hidden',
    flex: 2,
  },
  completeButtonTouchable: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(12),
  },
  tabletCompleteButton: {
    marginBottom: 0,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: moderateScale(16),
    fontFamily: Fonts.Inter_SemiBold,
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
    borderRadius: moderateScale(16),
    padding: moderateScale(24),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
  tabletModalContainer: {
    width: '60%',
    maxWidth: 500,
    padding: moderateScale(30),
  },
  modalTitle: {
    fontSize: moderateScale(20),
    color: color.accentColor.darkColor,
    marginBottom: moderateScale(20),
    textAlign: 'center',
    fontFamily: Fonts.Inter_Bold,
  },
  modalContent: {
    marginBottom: moderateScale(24),
  },
  confirmationText: {
    fontSize: moderateScale(16),
    color: color.accentColor.darkColor,
    textAlign: 'center',
    marginBottom: moderateScale(16),
    fontFamily: Fonts.Inter_Regular,
  },
  partialPaymentWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    padding: moderateScale(12),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: 'rgba(255, 165, 0, 0.3)',
  },
  confirmationPartial: {
    flex: 1,
    fontSize: moderateScale(14),
    color: '#FFA500',
    fontStyle: 'italic',
    marginLeft: moderateScale(8),
    fontFamily: Fonts.Inter_Regular,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    borderRadius: moderateScale(10),
    marginHorizontal: moderateScale(8),
    overflow: 'hidden',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    fontSize: moderateScale(16),
    color: color.accentColor.darkColor,
    textAlign: 'center',
    paddingVertical: moderateScale(14),
    fontFamily: Fonts.Inter_Regular,
  },
  confirmButton: {
    overflow: 'hidden',
  },
  confirmButtonTouchable: {
    width: '100%',
    paddingVertical: moderateScale(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: moderateScale(16),
    color: '#fff',
    fontFamily: Fonts.Inter_Bold,
  },
  qrCodeContainer: {
    marginTop: moderateScale(16),
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    paddingTop: moderateScale(16),
  },
  qrCodeTitle: {
    fontSize: moderateScale(16),
    color: color.accentColor.darkColor,
    marginBottom: moderateScale(16),
    fontFamily: Fonts.Inter_SemiBold,
    textAlign: 'center',
  },
  qrCodeImageContainer: {
    backgroundColor: '#fff',
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  qrCodeImage: {
    width: moderateScale(220),
    height: moderateScale(220),
  },
  qrCodeHint: {
    fontSize: moderateScale(14),
    color: color.accentColor.grayColor,
    marginTop: moderateScale(16),
    textAlign: 'center',
    fontFamily: Fonts.Inter_Regular,
    paddingHorizontal: moderateScale(16),
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: moderateScale(16),
    gap: moderateScale(12),
  },
  tabletButtonContainer: {
    marginBottom: moderateScale(24),
  },
  cancelPaymentButton: {
    backgroundColor: '#f0f0f0',
    padding: moderateScale(12),
    borderRadius: moderateScale(10),
    flex: 1,
  },
  tabletCancelButton: {
    padding: moderateScale(14),
  },
  cancelPaymentText: {
    fontSize: moderateScale(16),
    color: color.accentColor.darkColor,
    textAlign: 'center',
    fontFamily: Fonts.Inter_Regular,
  },
});

export default PaymentMethods;
