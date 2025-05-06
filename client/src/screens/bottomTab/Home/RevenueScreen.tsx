import React, {useState, useEffect, useMemo, useCallback} from 'react';
import {StyleSheet, View, TouchableOpacity, FlatList, ActivityIndicator} from 'react-native';
import {BaseLayout, DynamicText, Header} from '../../../components';
import {color, moderateScale} from '../../../utils';
import {observer} from 'mobx-react-lite';
import {
  formatCurrency,
  RevenueStats,
} from '../../../services/revenueService';
import {rootStore} from '../../../models/root-store';
import {
  Calendar,
  ShoppingBag,
  ArrowRight2,
  CloseCircle,
} from 'iconsax-react-native';
import {Fonts} from '../../../assets';
import {useNavigation, useRoute} from '@react-navigation/native';
import {Screen, RootStackParamList} from '../../../navigation/navigation.type';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {OrderInstance} from '../../../models/Order/Order';

type NavigationProps = NativeStackNavigationProp<RootStackParamList>;

// Define an interface for order items
interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
  [key: string]: any;
}

const RevenueScreen = observer(() => {
  const navigation = useNavigation<NavigationProps>();
  const route = useRoute();
  const params = route.params as {startDate: string; endDate: string} | undefined;
  
  const startDate = useMemo(() => params?.startDate ? new Date(params.startDate) : new Date(), [params?.startDate]);
  const endDate = useMemo(() => params?.endDate ? new Date(params.endDate) : new Date(), [params?.endDate]);
  
  const [revenueStats, setRevenueStats] = useState<RevenueStats>({
    totalRevenue: 0,
    averageOrderValue: 0,
    totalProductsSold: 0,
    orderCount: 0,
  });
  const [filteredOrders, setFilteredOrders] = useState<OrderInstance[]>([]);
  const [loading, setLoading] = useState(true);

  // Calculate revenue stats directly from filtered orders
  const calculateRevenueStats = (orders: OrderInstance[]): RevenueStats => {
    // Filter out canceled orders
    const validOrders = orders.filter(order => order.status !== 'canceled');
    
    // Calculate total revenue
    const totalRevenue = validOrders.reduce((sum, order) => {
      if (order.paymentStatus === 'paid') {
        return sum + order.totalAmount;
      } else if (order.paymentStatus === 'partpaid') {
        return sum + (order.paidAmount || 0);
      }
      return sum;
    }, 0);
    
    // Count total products sold
    const totalProductsSold = validOrders.reduce((sum, order) => {
      // Safely access items property with type casting if necessary
      const orderItems = order.items as OrderItem[] || [];
      return sum + (orderItems.reduce((itemSum: number, item: OrderItem) => itemSum + item.quantity, 0));
    }, 0);
    
    // Calculate average order value
    const averageOrderValue = validOrders.length > 0 ? totalRevenue / validOrders.length : 0;
    
    return {
      totalRevenue,
      averageOrderValue,
      totalProductsSold,
      orderCount: validOrders.length,
    };
  };

  const updateStats = useCallback(() => {
    try {
      // Create copies of dates to avoid mutation
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Set the start date to the beginning of the day (00:00:00.000)
      start.setHours(0, 0, 0, 0);
      
      // Set the end date to the end of the day (23:59:59.999)
      end.setHours(23, 59, 59, 999);
      
      console.log(`Filtering orders from ${start.toISOString()} to ${end.toISOString()}`);

      // Filter orders based on their creation timestamp
      const orders = rootStore.orders.orders.filter((order: OrderInstance) => {
        try {
          const orderDate = new Date(order.createdAt);
          
          // Check if order date is within range (inclusive of start and end dates)
          const isInRange = orderDate >= start && orderDate <= end;
          
          if (isInRange) {
            console.log(`Order ${order.orderID} (${orderDate.toISOString()}) is in range`);
          }
          
          return isInRange;
        } catch (error) {
          console.error(`Error parsing date for order ${order.orderID}:`, error);
          return false;
        }
      });
      
      console.log(`Found ${orders.length} orders matching date range out of ${rootStore.orders.orders.length} total`);
      
      // Sort orders by creation date, newest first
      const sortedOrders = [...orders].sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      // Calculate revenue stats from the filtered orders
      const stats = calculateRevenueStats(orders);
      console.log('Calculated revenue stats:', stats);
      
      setRevenueStats(stats);
      setFilteredOrders(sortedOrders);
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    // Load orders if not already loaded
    if (rootStore.orders.orders.length === 0) {
      setLoading(true);
      console.log('No orders found, fetching orders...');
      
      // Get the start and end of the full date range for fetching
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      // Fetch orders for the specific date range
      rootStore.orders.fetchOrders(
        start.toISOString(), 
        end.toISOString()
      ).then(() => {
        console.log(`Fetched ${rootStore.orders.orders.length} orders`);
        updateStats();
        setLoading(false);
      }).catch((error: unknown) => {
        console.error('Error fetching orders:', error);
        setLoading(false);
      });
    } else {
      console.log(`Using ${rootStore.orders.orders.length} existing orders`);
      updateStats();
      setLoading(false);
    }
  }, [startDate, endDate, updateStats]);

  const formatDateRange = () => {
    return `${startDate.toLocaleDateString('vi-VN')} - ${endDate.toLocaleDateString('vi-VN')}`;
  };

  // Format order status for display
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ xử lý';
      case 'processing': return 'Đã xử lý';
      case 'shipping': return 'Đang giao';
      case 'delivered': return 'Đã giao';
      case 'canceled': return 'Đã hủy';
      default: return status;
    }
  };

  // Get color for order status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F9A825';
      case 'processing': return '#1976D2';
      case 'shipping': return '#7B1FA2';
      case 'delivered': return '#43A047';
      case 'canceled': return '#E53935';
      default: return color.accentColor.grayColor;
    }
  };
  const navigateToOrderScreen = (status?: string) => {
    navigation.navigate(Screen.BOTTOM_TAB, {status});
  };

  // Get payment status text
  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Đã thanh toán';
      case 'unpaid': return 'Chưa thanh toán';
      case 'refunded': return 'Đã hoàn tiền';
      case 'partpaid': return 'Thanh toán một phần';
      default: return status;
    }
  };

  // Get color for payment status
  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#43A047';
      case 'unpaid': return '#E53935';
      case 'refunded': return '#1976D2';
      case 'partpaid': return '#F9A825';
      default: return color.accentColor.grayColor;
    }
  };

  const renderOrderItem = ({item}: {item: OrderInstance}) => {
    const orderDate = new Date(item.createdAt);
    
    return (
      <TouchableOpacity 
        style={styles.orderItem}
        onPress={() => navigation.navigate(Screen.ORDER_DETAIL, {
          orderId: item._id, 
          fromScreen: 'Revenue'
        })}>
        <View style={styles.orderLeft}>
          <View style={styles.orderHeader}>
            <DynamicText style={styles.orderId}>#{item.orderID.slice(-4)}</DynamicText>
            {item.status === 'canceled' && (
              <View style={styles.canceledBadge}>
                <CloseCircle size={12} color="#FFF" variant="Bold" />
                <DynamicText style={styles.canceledText}>Đã hủy</DynamicText>
              </View>
            )}
          </View>
          <DynamicText style={styles.orderDate}>
            {orderDate.toLocaleDateString('vi-VN')} {orderDate.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
          </DynamicText>
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <DynamicText style={styles.statusText}>{getStatusText(item.status)}</DynamicText>
            </View>
            <View style={[styles.paymentBadge, { backgroundColor: getPaymentStatusColor(item.paymentStatus) }]}>
              <DynamicText style={styles.statusText}>{getPaymentStatusText(item.paymentStatus)}</DynamicText>
            </View>
          </View>
        </View>
        <DynamicText style={styles.orderAmount}>
          {formatCurrency(item.totalAmount)}
        </DynamicText>
      </TouchableOpacity>
    );
  };

  const EmptyListComponent = () => (
    <View style={styles.emptyContainer}>
      <DynamicText style={styles.emptyText}>
        Không có Hóa đơn nào trong khoảng thời gian này
      </DynamicText>
    </View>
  );

  return (
    <BaseLayout 
      style={styles.container}
      scrollable
      contentContainerStyle={{paddingBottom: moderateScale(16)}}>
      <Header
        title="Doanh thu"
        showBackIcon
        onPressBack={() => navigateToOrderScreen()}
      />

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          {/* Main revenue card - 65% width */}
          <TouchableOpacity
            style={[styles.mainCard, {flex: 0.65}]}
           >
            <View style={styles.mainCardContent}>
              <View style={styles.mainCardHeader}>
                <View style={styles.headerLeft}>
                  <Calendar size={20} color="#FFFFFF" variant="Bold" />
                  <DynamicText style={styles.mainCardTitle}>
                    Doanh thu
                  </DynamicText>
                </View>
                <TouchableOpacity style={styles.dateRangeButton}
                  onPress={() => navigation.navigate(Screen.DAY_RANGE)} >
                  <View style={styles.dateRangeRow}>
                    <Calendar size={14} color="rgba(255, 255, 255, 0.8)" variant="Bold" />
                    <DynamicText style={styles.dateRangeText}>
                      {formatDateRange()}
                    </DynamicText>
                    <ArrowRight2 size={14} color="rgba(255, 255, 255, 0.8)" />
                  </View>
                </TouchableOpacity>
              </View>
              <View style={styles.amountContainer}>
                <DynamicText style={styles.mainAmount}>
                  {formatCurrency(revenueStats.totalRevenue)}
                </DynamicText>
                <View style={styles.orderInfoRow}>
                  <DynamicText style={styles.orderInfoText}>
                    {revenueStats.orderCount} hóa đơn
                  </DynamicText>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          {/* Right column for smaller stats - 35% width */}
          <View style={[styles.statsColumn, {flex: 0.35}]}>
            <View style={[styles.statCard, styles.orangeCard]}>
              <View style={styles.statCardHeader}>
                <View style={styles.statIconContainer}>
                  <ShoppingBag size={18} color="#FFFFFF" variant="Bold" />
                </View>
                <DynamicText style={styles.statTitle}>Sản phẩm</DynamicText>
              </View>
              <DynamicText style={styles.statValue}>
                {revenueStats.totalProductsSold}
              </DynamicText>
            </View>
          </View>
        </View>
      </View>

      {/* Orders List */}
      <View style={styles.ordersContainer}>
        <DynamicText style={styles.ordersTitle}>
          Danh sách Hóa đơn ({filteredOrders.length})
        </DynamicText>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={color.primaryColor} />
            <DynamicText style={styles.loadingText}>Đang tải Hóa đơn...</DynamicText>
          </View>
        ) : (
          <FlatList
            data={filteredOrders}
            keyExtractor={item => item._id}
            renderItem={renderOrderItem}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={EmptyListComponent}
            contentContainerStyle={
              filteredOrders.length === 0 
                ? { flex: 1, justifyContent: 'center' } 
                : { paddingBottom: moderateScale(20) }
            }
          />
        )}
      </View>
    </BaseLayout>
  );
});

export default RevenueScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.backgroundColor,
  },
  statsContainer: {
    marginBottom: moderateScale(16),
    paddingHorizontal: moderateScale(16),
  },
  statsRow: {
    flexDirection: 'row',
    gap: moderateScale(12),
  },
  statCard: {
    flex: 1,
    backgroundColor: color.accentColor.whiteColor,
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    height: moderateScale(150),
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    justifyContent: 'space-between',
  },
  mainCard: {
    flex: 0.65,
    backgroundColor: color.primaryColor,
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    height: moderateScale(150),
    shadowColor: color.primaryColor,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  mainCardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  mainCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: moderateScale(8),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mainCardTitle: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Inter_SemiBold,
    color: '#FFFFFF',
    marginLeft: moderateScale(8),
  },
  mainAmount: {
    fontSize: moderateScale(24),
    color: '#FFFFFF',
    fontFamily: Fonts.Inter_SemiBold,
    marginBottom: moderateScale(4),
  },
  statsColumn: {
    flex: 0.35,
    flexDirection: 'column',
    gap: moderateScale(12),
  },
  blueCard: {
    backgroundColor: '#4A6FFF',
  },
  orangeCard: {
    backgroundColor: '#FF9500',
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(8),
  },
  statIconContainer: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(8),
  },
  statTitle: {
    fontSize: moderateScale(14),
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  statValue: {
    fontSize: moderateScale(24),
    color: '#FFFFFF',
    fontFamily: Fonts.Inter_SemiBold,
  },
  ordersContainer: {
    flex: 1,
    backgroundColor: color.accentColor.whiteColor,
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginHorizontal: moderateScale(16),
    marginTop: moderateScale(16),
  },
  ordersTitle: {
    fontSize: moderateScale(16),
    color: color.accentColor.darkColor,
    fontFamily: Fonts.Inter_SemiBold,
    marginBottom: moderateScale(16),
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  orderLeft: {
    flex: 1,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(4),
  },
  orderId: {
    fontSize: moderateScale(14),
    color: color.accentColor.darkColor,
    fontFamily: Fonts.Inter_SemiBold,
    marginRight: moderateScale(8),
  },
  canceledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E53935',
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(4),
  },
  canceledText: {
    fontSize: moderateScale(10),
    color: '#FFFFFF',
    marginLeft: moderateScale(2),
  },
  orderDate: {
    fontSize: moderateScale(12),
    color: color.accentColor.grayColor,
    marginBottom: moderateScale(6),
  },
  orderAmount: {
    fontSize: moderateScale(14),
    color: color.primaryColor,
    fontFamily: Fonts.Inter_SemiBold,
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(6),
  },
  statusBadge: {
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(4),
  },
  paymentBadge: {
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(4),
  },
  statusText: {
    fontSize: moderateScale(10),
    color: '#FFFFFF',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: moderateScale(14),
    color: color.accentColor.grayColor,
    marginTop: moderateScale(12),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: moderateScale(150),
  },
  emptyText: {
    fontSize: moderateScale(14),
    color: color.accentColor.grayColor,
    textAlign: 'center',
  },
  dateRangeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: moderateScale(6),
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(3),
  },
  dateRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateRangeText: {
    fontSize: moderateScale(10),
    color: '#FFFFFF',
    marginHorizontal: moderateScale(3),
  },
  amountContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  orderInfoRow: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(3),
    alignSelf: 'flex-start',
  },
  orderInfoText: {
    fontSize: moderateScale(10),
    color: '#FFFFFF',
    fontWeight: '500',
  },
}); 