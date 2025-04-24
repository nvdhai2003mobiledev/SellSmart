import React, {useState, useEffect} from 'react';
import {
  View,
  Text as RNText,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  FlatList,
  Dimensions,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  BaseLayout,
  Input,
  Header,
  DynamicText,
} from '../../../components';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {observer} from 'mobx-react-lite';
import {rootStore} from '../../../models/root-store';
import {Screen} from '../../../navigation/navigation.type';
import {color, moderateScale, scaleHeight} from '../../../utils';
import {createOrder} from '../../../services/api/ordersApi';
import {IPromotion} from '../../../models/promotion/promotion';
import {promotionAPI} from '../../../services/api/promotionAPI';
import {Fonts} from '../../../assets/fonts';

// Product type definition
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
  variantId?: string;
  originalProductId?: string;
  product_code?: string;
}

// Customer type definition
interface Customer {
  _id: string;
  fullName: string;
  phoneNumber: string;
  address?: string;
  email?: string;
}

// Payment method type
type PaymentMethodType = 'cash' | 'credit card' | 'debit card' | 'e-wallet';

// Route params type
interface CreateOrderParams {
  selectedProducts?: Product[];
  customer?: Customer;
}

const CreateOrderScreen = observer(() => {
  const navigation = useNavigation();
  const route =
    useRoute<RouteProp<Record<string, CreateOrderParams>, string>>();
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [notes, setNotes] = useState('');
  const [_paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('cash');
  const [paymentStatus, setPaymentStatus] = useState<
    'paid' | 'unpaid' | 'partpaid'
  >('paid');

  // Promotion related state
  const [promotions, setPromotions] = useState<IPromotion[]>([]);
  const [selectedPromotion, setSelectedPromotion] = useState<IPromotion | null>(
    null,
  );
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [promotionError, setPromotionError] = useState('');
  const [isLoadingPromotions, setIsLoadingPromotions] = useState(false);

  // Payment details related state
  const [paymentDetails, setPaymentDetails] = useState<{
    method: PaymentMethodType;
    amount: number;
    isPartial: boolean;
  } | null>(null);

  // At the beginning of the component, add:
  const windowWidth = Dimensions.get('window').width;
  const windowHeight = Dimensions.get('window').height;
  
  // Then add code after useState declarations:
  
  // Device specific modal adjustments
  const isIOS = Platform.OS === 'ios';
  useEffect(() => {
    console.log('Device info - Width:', windowWidth, 'Height:', windowHeight, 'Platform:', Platform.OS);
  }, []);

  // Calculate totals
  const calculateTotal = () => {
    return selectedProducts.reduce(
      (sum, product) => sum + product.price * product.quantity,
      0,
    );
  };

  const calculateDiscount = () => {
    if (!selectedPromotion) return 0;
    const total = calculateTotal();
    if (total < selectedPromotion.minOrderValue) return 0;

    const discount = (total * selectedPromotion.discount) / 100;
    return Math.min(discount, selectedPromotion.maxDiscount);
  };

  const isValidOrder = () => {
    return selectedProducts.length > 0 && selectedCustomer !== null;
  };

  // Format currency function
  const formatCurrency = (amount: number) => {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + 'đ';
  };

  // Fetch promotions - preload active promotions that match current order value
  const fetchPromotions = async () => {
    try {
      setIsLoadingPromotions(true);
      setPromotionError('');
      console.log('Starting to fetch promotions...');

      const response = await promotionAPI.getPromotions();
      console.log('Promotion API response:', JSON.stringify(response, null, 2));

      if (response.ok && response.data) {
        // Filter only active promotions with valid dates
        const currentDate = new Date();
        const activePromotions = response.data.filter(
          promotion =>
            promotion.status === 'active' &&
            new Date(promotion.startDate) <= currentDate &&
            new Date(promotion.endDate) >= currentDate,
        );

        console.log('Active promotions found:', activePromotions.length);
        setPromotions(activePromotions);
      } else {
        console.error('Failed to fetch promotions:', response.problem, response.status, response.originalError);
        setPromotionError('Không thể tải danh sách khuyến mãi');
      }
    } catch (error) {
      console.error('Error fetching promotions:', error);
      setPromotionError('Đã xảy ra lỗi khi tải khuyến mãi');
    } finally {
      setIsLoadingPromotions(false);
    }
  };

  // Automatically fetch promotions when products change
  useEffect(() => {
    if (selectedProducts.length > 0) {
      fetchPromotions();
    }
  }, [selectedProducts]);

  // Apply selected promotion
  const applyPromotion = (promotion: IPromotion) => {
    const total = calculateTotal();
    if (total < promotion.minOrderValue) {
      Alert.alert(
        'Không đủ điều kiện',
        `Giá trị Hóa đơn phải từ ${formatCurrency(
          promotion.minOrderValue,
        )} để áp dụng khuyến mãi này.`,
      );
      return;
    }
    setSelectedPromotion(promotion);
    setShowPromotionModal(false);
  };

  // Remove applied promotion
  const removePromotion = () => {
    setSelectedPromotion(null);
  };

  // Navigation functions
  const navigateToProductSelection = () => {
    // Properly pass currently selected products to preserve selections
    navigation.navigate(Screen.CHOOSE_ORDER_PRODUCT as any, {
      selectedProducts,
    });
  };

  const navigateToSelectCustomer = () => {
    // Navigate to customer selection screen
    navigation.navigate(Screen.CUSTOMER_SELECTION as any, {
      onSelect: (customer: Customer) => setSelectedCustomer(customer),
    });
  };

  // Open promotion selection modal
  const openPromotionModal = () => {
    console.log('Opening promotion modal');
    
    // Set modal visible immediately to ensure it shows up
    setShowPromotionModal(true);
    console.log('Modal visibility set to true: ', showPromotionModal);
    
    // Then fetch promotions
    fetchPromotions()
      .then(() => {
        console.log(`Fetched ${promotions.length} promotions for modal`);
      })
      .catch(error => {
        console.error('Error fetching promotions:', error);
        setPromotionError('Đã xảy ra lỗi khi tải khuyến mãi');
      });
  };

  // Initialize with products from route params and preserve state
  useEffect(() => {
    // Handle selected products from product selection screen
    if (route.params?.selectedProducts) {
      setSelectedProducts(route.params.selectedProducts);
    }
    
    // Handle customer if provided in the route params
    if (route.params?.customer) {
      setSelectedCustomer(route.params.customer);
    }
  }, [route.params]);

  // Product quantity management
  const increaseQuantity = (index: number) => {
    const product = selectedProducts[index];
    if (product.quantity < product.inventory) {
      const updatedProducts = [...selectedProducts];
      updatedProducts[index] = {
        ...product,
        quantity: product.quantity + 1,
      };
      setSelectedProducts(updatedProducts);
    } else {
      Alert.alert('Lỗi', 'Số lượng không thể vượt quá tồn kho');
    }
  };

  const decreaseQuantity = (index: number) => {
    const product = selectedProducts[index];
    if (product.quantity > 1) {
      const updatedProducts = [...selectedProducts];
      updatedProducts[index] = {
        ...product,
        quantity: product.quantity - 1,
      };
      setSelectedProducts(updatedProducts);
    }
  };

  const removeProduct = (index: number) => {
    const updatedProducts = [...selectedProducts];
    updatedProducts.splice(index, 1);
    setSelectedProducts(updatedProducts);
  };

  // Create order function
  const handleCreateOrder = async () => {
    if (!selectedCustomer) {
      Alert.alert('Cảnh báo', 'Vui lòng chọn khách hàng');
      return;
    }

    if (selectedProducts.length === 0) {
      Alert.alert('Cảnh báo', 'Vui lòng chọn ít nhất một sản phẩm');
      return;
    }

    try {
      // Tính toán tổng tiền Hóa đơn
      const total = selectedPromotion
        ? calculateTotal() - calculateDiscount()
        : calculateTotal();
      
      // Xác định thông tin thanh toán
      const paidAmount = paymentDetails ? paymentDetails.amount : 0;
      const isFullyPaid = paidAmount >= total;
      const isPartiallyPaid = paidAmount > 0 && paidAmount < total;

      // Xác định trạng thái thanh toán
      const paymentStatus = !paymentDetails
        ? 'unpaid'
        : isFullyPaid
        ? 'paid'
        : 'partpaid';

      // Trạng thái Hóa đơn dựa trên thanh toán
      // - 'pending': Chưa thanh toán
      // - 'waiting': Thanh toán một phần, chờ thanh toán đủ
      // - 'processing': Đã thanh toán đủ, đang xử lý
      const orderStatus = paymentStatus === 'unpaid' 
        ? 'pending' 
        : paymentStatus === 'partpaid'
        ? 'waiting'
        : 'processing';

      // Log thông tin thanh toán để debug
      console.log('===== Thông tin Hóa đơn trước khi gửi =====');
      console.log(`Khách hàng: ${selectedCustomer.fullName}`);
      console.log(`Sản phẩm: ${selectedProducts.length} items`);
      selectedProducts.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name} x ${product.quantity} (ID: ${product._id})`);
        if (product.originalProductId) {
          console.log(`   Original Product ID: ${product.originalProductId}`);
        }
        if (product.variantId) {
          console.log(`   Variant ID: ${product.variantId}`);
        }
        if (product.attributes && product.attributes.length > 0) {
          console.log(`   Attributes: ${JSON.stringify(product.attributes)}`);
        }
      });
      console.log(`Tổng tiền: ${total}`);
      console.log(`Số tiền đã thanh toán: ${paidAmount}`);
      console.log(`Đã thanh toán đủ: ${isFullyPaid ? 'Có' : 'Không'}`);
      console.log(`Thanh toán một phần: ${isPartiallyPaid ? 'Có' : 'Không'}`);
      console.log(
        `Phương thức thanh toán: ${
          paymentDetails ? paymentDetails.method : 'Chưa thanh toán'
        }`,
      );
      console.log(`Trạng thái thanh toán: ${paymentStatus}`);
      console.log(`Trạng thái Hóa đơn: ${orderStatus}`);

      if (paymentDetails) {
        console.log(
          'Chi tiết thanh toán:',
          JSON.stringify(paymentDetails, null, 2),
        );
      }

      // Map products for the order data
      const orderData = {
        customerID: selectedCustomer._id,
        products: selectedProducts.map(product => {
          // Start with productID from the product
          let productID = product._id;
          let variantID = product.variantId;
          
          // If no originalProductId exists, but _id contains a dash, it was previously combined
          if (!product.originalProductId && typeof product._id === 'string' && product._id.includes('-')) {
            const parts = product._id.split('-');
            productID = parts[0];  // First part is the actual product ID
            variantID = parts[1] || variantID;  // Second part is the variant ID if it exists
            console.log(`Split combined ID: Original=${productID}, Variant=${variantID}`);
          }
          
          // Ensure variant ID is properly formatted
          if (variantID && typeof variantID === 'object' && variantID._id) {
            variantID = variantID._id.toString();
          } else if (variantID) {
            variantID = variantID.toString();
          }
          
          console.log(`Product in order: ${product.name}`);
          console.log(`Final ProductID: ${productID}`);
          console.log(`Final VariantID: ${variantID || 'None'}`);
          
          return {
            productID: productID,
            name: product.name,
            quantity: product.quantity,
            price: product.price,
            inventory: product.inventory || Math.max(1, product.quantity),
            attributes: product.attributes || [],
            variantID: variantID || undefined,
            product_code: product.product_code || undefined
          };
        }),
        totalAmount: total,
        paymentMethod: paymentDetails ? paymentDetails.method : null,
        paymentStatus: paymentStatus,
        // Thêm số tiền đã thanh toán
        paidAmount: paidAmount,
        // Thêm chi tiết thanh toán nếu có
        paymentDetails: paymentDetails
          ? [
              {
                method: paymentDetails.method,
                amount: paymentDetails.amount,
                date: new Date(),
              },
            ]
          : [],
        status: orderStatus,
        shippingAddress: selectedCustomer.address || 'Nhận hàng tại cửa hàng',
        employeeID: rootStore.auth.userId,
        notes,
        promotionID: selectedPromotion?._id || null,
        promotionDetails: selectedPromotion
          ? {
              name: selectedPromotion.name,
              discount: selectedPromotion.discount,
              discountAmount: calculateDiscount(),
            }
          : null,
      };

      console.log(
        'Creating order with data:',
        JSON.stringify(orderData, null, 2),
      );

      // Create order using API
      const response = await createOrder(orderData);

      if (response.ok) {
        console.log(
          'Phản hồi API tạo Hóa đơn:',
          JSON.stringify(response.data, null, 2),
        );

        // Lấy ID Hóa đơn từ response
        // Kiểm tra cả hai định dạng phản hồi có thể có từ API
        let orderId = null;

        if (response.data) {
          // Sử dụng any để tránh các lỗi TypeScript
          const responseData = response.data as any;

          if (responseData.order && responseData.order._id) {
            // Định dạng: { success: true, message: '...', order: { _id: '...' } }
            orderId = responseData.order._id;
            console.log(
              'Order data from response:',
              JSON.stringify(responseData.order, null, 2),
            );
          } else if (responseData.data && responseData.data._id) {
            // Định dạng: { data: { _id: '...' } }
            orderId = responseData.data._id;
            console.log(
              'Order data from response.data:',
              JSON.stringify(responseData.data, null, 2),
            );
          } else if (responseData._id) {
            // Định dạng: { _id: '...' }
            orderId = responseData._id;
            console.log(
              'Order data from direct response:',
              JSON.stringify(responseData, null, 2),
            );
          }
        }

        console.log('Hóa đơn đã tạo thành công với ID:', orderId);

        // Refresh orders in the store
        await rootStore.orders.fetchOrders();

        if (orderId) {
          // Điều hướng đến trang chi tiết Hóa đơn với ID Hóa đơn vừa tạo
          navigation.navigate(Screen.ORDER_DETAIL, {orderId});
        } else {
          // Fallback nếu không lấy được ID Hóa đơn
          Alert.alert('Thành công', 'Hóa đơn đã được tạo thành công', [
            {text: 'OK', onPress: () => navigation.navigate(Screen.ORDERLIST)},
          ]);
        }
      } else {
        console.error('Order creation failed with status:', response.status);
        console.error('Response data:', response.data);

        let errorMessage = 'Không thể tạo Hóa đơn';
        if (response.data) {
          // Sử dụng any cho response.data
          const errorData = response.data as any;
          errorMessage = errorData.message || errorMessage;
        }

        Alert.alert('Lỗi', errorMessage);
      }
    } catch (error) {
      console.error('Error creating order:', error);
      // Show more detailed error message
      let errorMessage = 'Đã xảy ra lỗi khi tạo Hóa đơn';
      if (error instanceof Error) {
        errorMessage = `Lỗi: ${error.message}`;
      }
      Alert.alert('Lỗi tạo Hóa đơn', errorMessage);
    }
  };

  const saveAsDraft = () => {
    // Implement save as draft functionality
    Alert.alert('Thông báo', 'Chức năng lưu nháp đang được phát triển');
  };

  // Render product item in the list
  const renderProductItem = (product: Product, index: number) => (
    <View key={product._id || index} style={styles.productContainer}>
      {/* Thumbnail image with proper URL handling */}
      {product.thumbnail ? (
        <Image 
          source={{ uri: product.thumbnail }} 
          style={styles.productImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.productImage, {backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center'}]}>
          <RNText style={{fontSize: 18, color: '#999'}}>{product.name?.[0] || '?'}</RNText>
        </View>
      )}
      
      <View style={styles.productDetails}>
        <DynamicText style={styles.productName}>{product.name}</DynamicText>
        <DynamicText style={styles.productVariant}>
          {product.attributes
            ?.map(
              attr =>
                `${attr.name}: ${
                  Array.isArray(attr.value) ? attr.value.join(', ') : attr.value
                }`,
            )
            .join(' | ')}
        </DynamicText>
        <DynamicText style={styles.productPrice}>
          {formatCurrency(product.price)}
        </DynamicText>
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            onPress={() => decreaseQuantity(index)}
            style={styles.quantityButton}>
            <DynamicText style={styles.quantityButtonText}>-</DynamicText>
          </TouchableOpacity>
          <DynamicText style={styles.productQuantity}>
            {product.quantity}
          </DynamicText>
          <TouchableOpacity
            onPress={() => increaseQuantity(index)}
            style={styles.quantityButton}>
            <DynamicText style={styles.quantityButtonText}>+</DynamicText>
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity onPress={() => removeProduct(index)}>
        <DynamicText style={styles.removeText}>×</DynamicText>
      </TouchableOpacity>
    </View>
  );

  // Log modal state on each render for debugging
  console.log('Render - showPromotionModal:', showPromotionModal, 'promotions:', promotions.length);

  return (
    <BaseLayout>
      <Header
        title="Tạo Hóa đơn"
        showBackIcon={true}
        onPressBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.scrollView}>
        {/* Products Section - Đặt lên đầu tiên */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <DynamicText style={styles.sectionTitle}>Sản phẩm</DynamicText>
            <TouchableOpacity
              style={styles.editButton}
              onPress={navigateToProductSelection}>
              <DynamicText style={styles.editButtonText}>Thêm</DynamicText>
            </TouchableOpacity>
          </View>
          {selectedProducts.length > 0 ? (
            <View style={styles.productsList}>
              {selectedProducts.map((product, index) =>
                renderProductItem(product, index),
              )}
            </View>
          ) : (
            <TouchableOpacity
              style={styles.selectProductButton}
              onPress={navigateToProductSelection}>
              <DynamicText style={styles.selectProductText}>
                Thêm sản phẩm
              </DynamicText>
            </TouchableOpacity>
          )}
        </View>

        {/* Customer Selection Section - Chuyển xuống sau sản phẩm */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <DynamicText style={styles.sectionTitle}>
              Thông tin khách hàng
            </DynamicText>
            <TouchableOpacity
              style={styles.editButton}
              onPress={navigateToSelectCustomer}>
              <DynamicText style={styles.editButtonText}>Chọn</DynamicText>
            </TouchableOpacity>
          </View>
          {selectedCustomer ? (
            <View style={styles.customerInfo}>
              <DynamicText style={styles.customerName}>
                {selectedCustomer.fullName}
              </DynamicText>
              <DynamicText style={styles.customerPhone}>
                {selectedCustomer.phoneNumber}
              </DynamicText>
              <DynamicText style={styles.customerAddress}>
                {selectedCustomer.address}
              </DynamicText>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.selectCustomerButton}
              onPress={navigateToSelectCustomer}>
              <DynamicText style={styles.selectCustomerText}>
                Chọn khách hàng
              </DynamicText>
            </TouchableOpacity>
          )}
        </View>

        {/* Promotion Section - Only show if products are selected */}
        {selectedProducts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <DynamicText style={styles.sectionTitle}>Khuyến mãi</DynamicText>
              <TouchableOpacity
                style={styles.editButton}
                onPress={openPromotionModal}>
                <DynamicText style={styles.editButtonText}>Chọn</DynamicText>
              </TouchableOpacity>
            </View>
            {selectedPromotion ? (
              <View style={styles.selectedPromotionContainer}>
                <View style={styles.promotionHeader}>
                  <DynamicText style={styles.promotionName}>
                    {selectedPromotion.name}
                  </DynamicText>
                  <TouchableOpacity
                    style={styles.removePromotionButton}
                    onPress={removePromotion}>
                    <DynamicText style={styles.removePromotionText}>
                      ×
                    </DynamicText>
                  </TouchableOpacity>
                </View>
                <View style={styles.promotionDetails}>
                  <DynamicText style={styles.promotionDetailText}>
                    Giảm giá: {selectedPromotion.discount}%
                  </DynamicText>
                  <DynamicText style={styles.promotionDetailText}>
                    Giảm tối đa: {formatCurrency(selectedPromotion.maxDiscount)}
                  </DynamicText>
                  <DynamicText style={styles.promotionDetailText}>
                    Đơn tối thiểu:{' '}
                    {formatCurrency(selectedPromotion.minOrderValue)}
                  </DynamicText>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.selectPromotionButton}
                onPress={openPromotionModal}>
                <DynamicText style={styles.selectPromotionText}>
                  Chọn khuyến mãi
                </DynamicText>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Payment Method Section */}
        <View style={styles.section}>
          <DynamicText style={styles.sectionTitle}>Thanh toán</DynamicText>
          <View style={styles.paymentStatusContainer}>
            <DynamicText style={styles.paymentStatusLabel}>
              Trạng thái thanh toán:
            </DynamicText>
            <View style={styles.paymentStatusOptions}>
              <TouchableOpacity
                style={[
                  styles.paymentStatusOption,
                  paymentStatus === 'paid' &&
                    styles.selectedPaymentStatusOption,
                ]}
                onPress={() => {
                  // Chuyển tới màn hình thanh toán
                  if (selectedProducts.length === 0) {
                    Alert.alert(
                      'Thông báo',
                      'Vui lòng chọn sản phẩm trước khi thanh toán',
                    );
                    return;
                  }

                  const total = calculateTotal() - calculateDiscount();

                  navigation.navigate(Screen.PAYMENT_METHODS, {
                    orderId: 'new', // Đánh dấu đây là Hóa đơn mới
                    orderNumber: 'tạm thời',
                    totalAmount: total,
                    isNewOrder: true,
                    onPaymentComplete: (method, amount) => {
                      setPaymentStatus('paid');
                      setPaymentMethod(method);
                      // Lưu thông tin thanh toán để hiển thị và sử dụng khi tạo Hóa đơn
                      setPaymentDetails({
                        method: method,
                        amount: amount,
                        isPartial: amount < total,
                      });
                    },
                  });
                }}>
                <DynamicText
                  style={[
                    styles.paymentStatusText,
                    paymentStatus === 'paid' &&
                      styles.selectedPaymentStatusText,
                  ]}>
                  Đã thanh toán
                </DynamicText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paymentStatusOption,
                  paymentStatus === 'unpaid' &&
                    styles.selectedPaymentStatusOption,
                ]}
                onPress={() => {
                  setPaymentStatus('unpaid');
                  setPaymentDetails(null);
                }}>
                <DynamicText
                  style={[
                    styles.paymentStatusText,
                    paymentStatus === 'unpaid' &&
                      styles.selectedPaymentStatusText,
                  ]}>
                  Thanh toán sau
                </DynamicText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Only show payment methods if status is 'paid' */}
          {paymentStatus === 'paid' && paymentDetails && (
            <View style={styles.paymentDetailsContainer}>
              <View style={styles.paymentMethodsContainer}>
                <DynamicText style={styles.paymentMethodsLabel}>
                  Phương thức thanh toán:
                </DynamicText>
                <DynamicText style={styles.paymentMethodValue}>
                  {paymentDetails.method === 'cash'
                    ? 'Tiền mặt'
                    : paymentDetails.method === 'credit card'
                    ? 'Chuyển khoản'
                    : paymentDetails.method === 'e-wallet'
                    ? 'Ví điện tử'
                    : paymentDetails.method === 'debit card'
                    ? 'Thanh toán thẻ'
                    : paymentDetails.method}
                </DynamicText>
              </View>

              <View style={styles.paymentAmountContainer}>
                <DynamicText style={styles.paymentAmountLabel}>
                  Số tiền đã thanh toán:
                </DynamicText>
                <DynamicText style={styles.paymentAmountValue}>
                  {formatCurrency(paymentDetails.amount)}
                </DynamicText>
              </View>

              {paymentDetails.isPartial && (
                <View style={styles.partialPaymentNote}>
                  <Icon
                    name="information-circle-outline"
                    size={16}
                    color="#FFA500"
                  />
                  <DynamicText style={styles.partialPaymentText}>
                    Thanh toán một phần. Số tiền còn lại sẽ được thu sau.
                  </DynamicText>
                </View>
              )}

              <TouchableOpacity
                style={styles.changePaymentButton}
                onPress={() => {
                  const total = calculateTotal() - calculateDiscount();

                  navigation.navigate(Screen.PAYMENT_METHODS, {
                    orderId: 'new',
                    orderNumber: 'tạm thời',
                    totalAmount: total,
                    remainingAmount: paymentDetails.isPartial
                      ? total - paymentDetails.amount
                      : undefined,
                    isPartialPayment: paymentDetails.isPartial,
                    isNewOrder: true,
                    onPaymentComplete: (method, amount) => {
                      setPaymentStatus('paid');
                      setPaymentMethod(method);
                      setPaymentDetails({
                        method: method,
                        amount: amount,
                        isPartial: amount < total,
                      });
                    },
                  });
                }}>
                <DynamicText style={styles.changePaymentText}>
                  Thay đổi thanh toán
                </DynamicText>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Notes Section */}
        <View style={styles.section}>
          <DynamicText style={styles.sectionTitle}>Ghi chú</DynamicText>
          <Input
            placeholderText="Nhập ghi chú cho Hóa đơn"
            value={notes}
            onChangeText={setNotes}
            inputContainerStyle={styles.notesInput}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Order Summary Section */}
        <View style={styles.section}>
          <DynamicText style={styles.sectionTitle}>Tổng Hóa đơn</DynamicText>
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <DynamicText style={styles.summaryLabel}>Tạm tính:</DynamicText>
              <DynamicText style={styles.summaryValue}>
                {formatCurrency(calculateTotal())}
              </DynamicText>
            </View>
            {selectedPromotion && (
              <>
                <View style={styles.summaryRow}>
                  <DynamicText style={styles.summaryLabel}>
                    Giảm giá:
                  </DynamicText>
                  <DynamicText
                    style={[styles.summaryValue, styles.discountText]}>
                    -{formatCurrency(calculateDiscount())}
                  </DynamicText>
                </View>
                <View style={styles.summaryRow}>
                  <DynamicText style={styles.summaryLabel}>
                    Tổng cộng:
                  </DynamicText>
                  <DynamicText style={[styles.summaryValue, styles.totalText]}>
                    {formatCurrency(calculateTotal() - calculateDiscount())}
                  </DynamicText>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.button, styles.saveDraftButton]}
            onPress={saveAsDraft}>
            <DynamicText style={styles.saveDraftButtonText}>
              Lưu nháp
            </DynamicText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.createOrderButton]}
            onPress={handleCreateOrder}
            disabled={!isValidOrder()}>
            <DynamicText style={styles.createOrderButtonText}>
              Tạo Hóa đơn
            </DynamicText>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Promotion Selection Modal */}
      <Modal
        visible={showPromotionModal}
        transparent={true}
        animationType="slide"
        statusBarTranslucent={true}
        hardwareAccelerated={true}
        presentationStyle="overFullScreen"
        onRequestClose={() => {
          console.log('Modal closing by request');
          setShowPromotionModal(false);
        }}>
        <View style={[styles.modalOverlay, {zIndex: 1000}]}>
          <View style={[styles.modalContent, {zIndex: 1001}]}>
            <View style={styles.modalHeader}>
              <DynamicText style={styles.modalTitle}>
                Danh sách khuyến mãi
              </DynamicText>
              <TouchableOpacity
                onPress={() => {
                  console.log('Close button pressed');
                  setShowPromotionModal(false);
                }}
                style={styles.closeButton}>
                <DynamicText style={styles.closeButtonText}>×</DynamicText>
              </TouchableOpacity>
            </View>

            {isLoadingPromotions ? (
              <View style={styles.loadingContainer}>
                <DynamicText style={styles.loadingText}>
                  Đang tải...
                </DynamicText>
              </View>
            ) : promotionError ? (
              <View style={styles.errorContainer}>
                <DynamicText style={styles.errorText}>
                  {promotionError}
                </DynamicText>
              </View>
            ) : promotions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <DynamicText style={styles.emptyText}>
                  Không có khuyến mãi nào đang diễn ra
                </DynamicText>
              </View>
            ) : (
              <FlatList
                data={promotions}
                renderItem={({item}) => {
                  const isEligible = calculateTotal() >= item.minOrderValue;
                  return (
                    <TouchableOpacity
                      style={[
                        styles.promotionItem,
                        !isEligible && styles.ineligiblePromotion,
                      ]}
                      onPress={() => {
                        if (isEligible) {
                          applyPromotion(item);
                        } else {
                          Alert.alert(
                            'Không đủ điều kiện',
                            `Giá trị Hóa đơn phải từ ${formatCurrency(
                              item.minOrderValue,
                            )} để áp dụng khuyến mãi này.`,
                          );
                        }
                      }}
                      disabled={!isEligible}>
                      <View style={styles.promotionItemHeader}>
                        <DynamicText style={styles.promotionItemName}>
                          {item.name}
                        </DynamicText>
                        <View
                          style={[
                            styles.statusBadge,
                            isEligible
                              ? styles.eligibleBadge
                              : styles.ineligibleBadge,
                          ]}>
                          <DynamicText style={styles.statusText}>
                            {isEligible
                              ? 'Đang diễn ra'
                              : 'Đơn tối thiểu ' +
                                formatCurrency(item.minOrderValue)}
                          </DynamicText>
                        </View>
                      </View>
                      <View style={styles.promotionItemDetails}>
                        <DynamicText style={styles.promotionItemDetail}>
                          Giảm giá: {item.discount}%
                        </DynamicText>
                        <DynamicText style={styles.promotionItemDetail}>
                          Đơn tối thiểu: {formatCurrency(item.minOrderValue)}
                        </DynamicText>
                        <DynamicText style={styles.promotionItemDetail}>
                          Giảm tối đa: {formatCurrency(item.maxDiscount)}
                        </DynamicText>
                      </View>
                      <View style={styles.promotionDates}>
                        <DynamicText style={styles.dateText}>
                          Từ: {new Date(item.startDate).toLocaleDateString()}
                        </DynamicText>
                        <DynamicText style={styles.dateText}>
                          Đến: {new Date(item.endDate).toLocaleDateString()}
                        </DynamicText>
                      </View>
                    </TouchableOpacity>
                  );
                }}
                keyExtractor={item => item._id}
                contentContainerStyle={styles.promotionList}
              />
            )}
          </View>
        </View>
      </Modal>
    </BaseLayout>
  );
});

const styles = StyleSheet.create({
  scrollView: {
    paddingHorizontal: moderateScale(16),
    paddingTop: moderateScale(16),
    paddingBottom: moderateScale(50),
    marginBottom: moderateScale(50),
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(8),
    padding: moderateScale(16),
    marginBottom: moderateScale(16),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(12),
  },
  sectionTitle: {
    fontSize: moderateScale(16),
    fontFamily: Fonts.Inter_SemiBold,
    color: '#000',
  },
  editButton: {
    height: scaleHeight(80),
    paddingHorizontal: moderateScale(10),
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: moderateScale(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    fontSize: moderateScale(12),
    color: '#007AFF',
  },
  customerInfo: {
    marginTop: moderateScale(8),
  },
  customerName: {
    fontSize: moderateScale(16),
    fontFamily: Fonts.Inter_SemiBold,
    color: '#000',
  },
  customerPhone: {
    fontSize: moderateScale(14),
    color: '#666',
    marginTop: moderateScale(4),
  },
  customerAddress: {
    fontSize: moderateScale(14),
    color: '#666',
    marginTop: moderateScale(4),
  },
  selectCustomerButton: {
    height: scaleHeight(80),
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: moderateScale(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectCustomerText: {
    fontSize: moderateScale(12),
    color: '#007AFF',
  },
  productsList: {
    marginTop: moderateScale(8),
  },
  productContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(8),
    backgroundColor: color.backgroundColor,
    borderRadius: moderateScale(8),
    marginVertical: moderateScale(4),
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  productImage: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(4),
    marginRight: moderateScale(10),
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Inter_SemiBold,
    color: '#000',
  },
  productVariant: {
    fontSize: moderateScale(12),
    color: '#666',
    marginTop: moderateScale(2),
  },
  productPrice: {
    fontSize: moderateScale(14),
    color: '#007AFF',
    marginTop: moderateScale(4),
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: moderateScale(4),
  },
  quantityButton: {
    backgroundColor: '#f0f0f0',
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonText: {
    fontSize: moderateScale(18),
    color: '#007AFF',
    lineHeight: moderateScale(24),
  },
  productQuantity: {
    fontSize: moderateScale(14),
    color: '#000',
    marginHorizontal: moderateScale(10),
  },
  removeText: {
    fontSize: moderateScale(24),
    color: 'red',
    padding: moderateScale(8),
  },
  selectProductButton: {
    height: scaleHeight(80),
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: moderateScale(8),
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  selectProductText: {
    fontSize: moderateScale(12),
    color: '#007AFF',
    marginLeft: moderateScale(8),
  },
  selectedPromotionContainer: {
    backgroundColor: '#f0f7ff',
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
    marginTop: moderateScale(8),
  },
  promotionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(8),
  },
  promotionName: {
    fontSize: moderateScale(16),
    fontFamily: Fonts.Inter_SemiBold,
    color: color.accentColor.darkColor,
  },
  promotionDetails: {
    marginTop: moderateScale(4),
  },
  promotionDetailText: {
    fontSize: moderateScale(14),
    color: color.accentColor.darkColor,
    marginBottom: moderateScale(4),
  },
  removePromotionButton: {
    padding: moderateScale(4),
  },
  removePromotionText: {
    fontSize: moderateScale(20),
    color: color.accentColor.errorColor,
  },
  selectPromotionButton: {
    height: scaleHeight(80),
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: moderateScale(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectPromotionText: {
    fontSize: moderateScale(12),
    color: '#007AFF',
  },
  summaryContainer: {
    marginTop: moderateScale(8),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: moderateScale(8),
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  summaryLabel: {
    fontSize: moderateScale(14),
    color: '#000',
  },
  summaryValue: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Inter_SemiBold,
    color: '#000',
  },
  discountText: {
    fontSize: moderateScale(14),
    color: 'red',
  },
  totalText: {
    fontSize: moderateScale(16),
    color: '#007AFF',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: moderateScale(16),
  },
  button: {
    flex: 1,
    height: scaleHeight(80),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: moderateScale(8),
    marginHorizontal: moderateScale(4),
  },
  saveDraftButton: {
    backgroundColor: '#f0f0f0',
  },
  saveDraftButtonText: {
    fontSize: moderateScale(14),
    color: '#000',
  },
  createOrderButton: {
    backgroundColor: '#007AFF',
  },
  createOrderButtonText: {
    fontSize: moderateScale(12),
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(16),
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    width: '100%',
    maxHeight: '80%',
    padding: moderateScale(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: moderateScale(8),
  },
  modalTitle: {
    fontSize: moderateScale(18),
    fontFamily: Fonts.Inter_SemiBold,
    color: '#000',
  },
  closeButton: {
    padding: moderateScale(4),
  },
  closeButtonText: {
    fontSize: moderateScale(24),
    color: '#000',
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: moderateScale(16),
    alignItems: 'center',
  },
  loadingText: {
    fontSize: moderateScale(14),
    color: '#666',
  },
  errorContainer: {
    padding: moderateScale(16),
    alignItems: 'center',
  },
  errorText: {
    fontSize: moderateScale(14),
    color: color.accentColor.errorColor,
  },
  emptyContainer: {
    padding: moderateScale(16),
    alignItems: 'center',
  },
  emptyText: {
    fontSize: moderateScale(14),
    color: '#666',
  },
  promotionList: {
    paddingVertical: moderateScale(8),
  },
  promotionItem: {
    backgroundColor: '#f7f9fc',
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
    marginBottom: moderateScale(8),
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  ineligiblePromotion: {
    opacity: 0.6,
    backgroundColor: '#f0f0f0',
  },
  promotionItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(8),
  },
  promotionItemName: {
    fontSize: moderateScale(16),
    fontFamily: Fonts.Inter_SemiBold,
    color: '#000',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(4),
  },
  eligibleBadge: {
    backgroundColor: '#e1f5fe',
  },
  ineligibleBadge: {
    backgroundColor: '#f5f5f5',
  },
  statusText: {
    fontSize: moderateScale(10),
    color: '#007AFF',
  },
  promotionItemDetails: {
    marginBottom: moderateScale(8),
  },
  promotionItemDetail: {
    fontSize: moderateScale(12),
    color: '#666',
    marginBottom: moderateScale(4),
  },
  promotionDates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: moderateScale(10),
    color: '#999',
  },
  paymentStatusContainer: {
    marginTop: moderateScale(8),
  },
  paymentStatusLabel: {
    fontSize: moderateScale(14),
    color: '#000',
    marginBottom: moderateScale(4),
  },
  paymentStatusOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentStatusOption: {
    height: scaleHeight(80),
    justifyContent: 'center',
    paddingHorizontal: moderateScale(10),
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: moderateScale(8),
  },
  selectedPaymentStatusOption: {
    backgroundColor: '#007AFF',
  },
  paymentStatusText: {
    fontSize: moderateScale(12),
    color: color.primaryColor,
    fontFamily: Fonts.Inter_SemiBold,
  },
  selectedPaymentStatusText: {
    color: '#fff',
  },
  paymentDetailsContainer: {
    marginTop: moderateScale(8),
  },
  paymentMethodsContainer: {
    marginBottom: moderateScale(8),
  },
  paymentMethodsLabel: {
    fontSize: moderateScale(14),
    color: '#000',
    marginBottom: moderateScale(4),
  },
  paymentMethodValue: {
    fontSize: moderateScale(14),
    color: '#000',
    fontFamily: Fonts.Inter_SemiBold,
  },
  paymentAmountContainer: {
    marginBottom: moderateScale(8),
  },
  paymentAmountLabel: {
    fontSize: moderateScale(14),
    color: '#000',
    marginBottom: moderateScale(4),
  },
  paymentAmountValue: {
    fontSize: moderateScale(14),
    color: '#000',
    fontFamily: Fonts.Inter_SemiBold,
  },
  partialPaymentNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: moderateScale(8),
  },
  partialPaymentText: {
    fontSize: moderateScale(14),
    color: '#666',
    marginLeft: moderateScale(8),
  },
  changePaymentButton: {
    padding: moderateScale(8),
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: moderateScale(8),
    alignItems: 'center',
  },
  changePaymentText: {
    fontSize: moderateScale(14),
    color: '#007AFF',
  },
  notesInput: {
    marginTop: moderateScale(8),
  },
});

export default CreateOrderScreen;
