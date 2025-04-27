import React, {useState, useEffect} from 'react';
import {StyleSheet, View, TouchableOpacity, Modal} from 'react-native';
import {BaseLayout, DynamicText} from '../../../components';
import {
  color,
  moderateScale,
  scaledSize,
  scaleHeight,
  scaleWidth,
} from '../../../utils';
import {observer} from 'mobx-react-lite';
import {
  getMonthlyRevenueStats,
  setupRevenueTracking,
  formatCurrency,
  RevenueStats,
} from '../../../services/revenueService';
import {rootStore} from '../../../models/root-store';
import {
  Calendar,
  DocumentText,
  ShoppingBag,
  Activity,
  Profile2User,
  PercentageSquare,
  Box,
  Add,
  ArrowRight2,
  CloseCircle,
  MoneyRecive,
  EmptyWallet,
} from 'iconsax-react-native';
import {Fonts} from '../../../assets';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList, Screen} from '../../../navigation/navigation.type';

// Interface for week data
interface WeekData {
  label: string;
  weekNumber: number;
  revenue: number;
  orderCount: number;
  startDate: Date;
  endDate: Date;
}

// Hàm định dạng số tiền trên trục Y
const formatYAxisValue = (value: number): string => {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(0)}tỷ`;
  } else if (value >= 1000000) {
    return `${(value / 1000000).toFixed(0)}tr`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}k`;
  } else {
    return `${value}đ`;
  }
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Component definition
const MonthScreen: React.FC = observer(() => {
  const navigation = useNavigation<NavigationProp>();
  const [revenueStats, setRevenueStats] = useState<RevenueStats>({
    totalRevenue: 0,
    averageOrderValue: 0,
    totalProductsSold: 0,
    orderCount: 0,
  });
  const [weekData, setWeekData] = useState<WeekData[]>([]);
  const [maxRevenue, setMaxRevenue] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<WeekData | null>(null);
  const [orderCounts, setOrderCounts] = useState({
    total: 0,
    unpaid: 0,
    partlyPaid: 0,
    canceled: 0,
  });

  // Format current month for display
  const getCurrentMonth = (): string => {
    const now = new Date();
    const month = now.toLocaleDateString('vi-VN', {month: 'long'});
    const year = now.getFullYear();

    return `${month} ${year}`;
  };

  // Format date range for display (1st to Today)
  const getMonthDateRange = (): string => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);

    return `${firstDay.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
    })} - ${now.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
    })}`;
  };

  // Generate and calculate weekly data for the current month
  const generateWeekData = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Get last day of month
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    
    const weeks: WeekData[] = [];
    let highestRevenue = 0;
    
    // Create data for each week
    for (let weekNum = 1; weekNum <= 5; weekNum++) {
      const startDate = new Date(currentYear, currentMonth, (weekNum - 1) * 7 + 1);
      let endDate = new Date(currentYear, currentMonth, weekNum * 7);
      
      // Adjust end date if it goes beyond the month
      if (endDate > lastDay) {
        endDate = new Date(lastDay);
      }

      // Only include weeks that are actually in this month
      if (startDate.getMonth() === currentMonth) {
        // Calculate revenue for this week
        const weekRevenue = calculateWeekRevenue(startDate, endDate);
        const weekOrderCount = countOrdersForWeek(startDate, endDate);
        
        if (weekRevenue > highestRevenue) {
          highestRevenue = weekRevenue;
        }
        
        weeks.push({
          label: `Tuần ${weekNum}`,
          weekNumber: weekNum,
          revenue: weekRevenue,
          orderCount: weekOrderCount,
          startDate,
          endDate
        });
      }
    }
    
    // Set maximum revenue for scaling the chart
    const maxRevenueWithBuffer = highestRevenue > 0 ? highestRevenue * 1.2 : 500000;
    setMaxRevenue(maxRevenueWithBuffer);
    
    return weeks;
  };
  
  // Calculate revenue for a specific week
  const calculateWeekRevenue = (startDate: Date, endDate: Date): number => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    // Filter orders within date range that are paid and not canceled
    const weekOrders = rootStore.orders.orders.filter((order: any) => {
      const orderDate = new Date(order.createdAt);
      return (
        orderDate >= start &&
        orderDate <= end &&
        order.status !== 'canceled' &&
        (order.paymentStatus === 'paid' || order.paymentStatus === 'partpaid')
      );
    });
    
    // Calculate total revenue
    return weekOrders.reduce((sum: number, order: any) => {
      return sum + (order.paymentStatus === 'partpaid' ? order.paidAmount || 0 : order.totalAmount);
    }, 0);
  };
  
  // Count orders for a specific week
  const countOrdersForWeek = (startDate: Date, endDate: Date): number => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    // Count non-canceled orders
    return rootStore.orders.orders.filter((order: any) => {
      const orderDate = new Date(order.createdAt);
      return (
        orderDate >= start &&
        orderDate <= end &&
        order.status !== 'canceled'
      );
    }).length;
  };
  
  // Define Y-axis labels for the chart
  const getYAxisLabels = () => {
    const interval = maxRevenue / 4;
    return [
      formatYAxisValue(maxRevenue),
      formatYAxisValue(interval * 3),
      formatYAxisValue(interval * 2),
      formatYAxisValue(interval),
      '0đ',
    ];
  };
  
  // Handle bar press event
  const handleBarPress = (week: WeekData) => {
    console.log('Pressed bar for week:', week.label, 'with revenue:', week.revenue);
    
    // Use setTimeout to avoid issues with re-rendering
    setTimeout(() => {
      setSelectedWeek(week);
      setModalVisible(true);
    }, 0);
  };
  
  // Hide modal function
  const hideModal = () => {
    setModalVisible(false);
    // Clean up selected week when modal closes
    setTimeout(() => {
      setSelectedWeek(null);
    }, 300);
  };

  // Calculate order counts for the month
  const getMonthOrderCounts = () => {
    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      
      // Create start of month
      const startOfMonth = new Date(currentYear, currentMonth, 1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      // Create end of month
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);

      // Filter orders for the current month
      const monthOrders = rootStore.orders.orders.filter((order: any) => {
        try {
          const orderDate = new Date(order.createdAt);
          return orderDate >= startOfMonth && orderDate <= endOfMonth;
        } catch (error) {
          console.error('Error parsing order date:', error);
          return false;
        }
      });

      // Unpaid orders
      const unpaidOrders = monthOrders.filter(
        (order: any) => order.paymentStatus === 'unpaid' && order.status !== 'canceled',
      );

      // Partially paid orders
      const partlyPaidOrders = monthOrders.filter(
        (order: any) => order.paymentStatus === 'partpaid' && order.status !== 'canceled',
      );

      // Canceled orders
      const canceledOrders = monthOrders.filter(
        (order: any) => order.status === 'canceled',
      );

      return {
        total: monthOrders.length,
        unpaid: unpaidOrders.length,
        partlyPaid: partlyPaidOrders.length,
        canceled: canceledOrders.length,
      };
    } catch (error) {
      console.error('Error in getMonthOrderCounts:', error);
      return {
        total: 0,
        unpaid: 0,
        partlyPaid: 0,
        canceled: 0,
      };
    }
  };

  useEffect(() => {
    // Fetch orders if not already loaded
    if (rootStore.orders.orders.length === 0) {
      rootStore.orders.fetchOrders();
    }

    // Update revenue stats
    const updateStats = () => {
      const stats = getMonthlyRevenueStats();
      setRevenueStats(stats);
      setWeekData(generateWeekData());
      setOrderCounts(getMonthOrderCounts());
    };

    // Initial update
    updateStats();

    // Set up tracking for changes
    setupRevenueTracking(updateStats);

    // Clean up
    return () => {
      // Reaction is cleaned up in setupRevenueTracking
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);  // Disabling the linter warning since we want to run this only once

  return (
    <BaseLayout
      style={styles.container}
      scrollable
      contentContainerStyle={styles.contentContainer}>
      {/* Row for revenue and stats */}
      <View style={styles.statsRow}>
        {/* Main revenue card - 65% width */}
        <TouchableOpacity
          style={styles.mainCard}
          onPress={() => {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            
            navigation.navigate(Screen.REVENUE, {
              startDate: startOfMonth,
              endDate: now,
            });
          }}>
          <View style={styles.mainCardHeader}>
            <Calendar size={20} color="#FFFFFF" variant="Bold" />
            <DynamicText style={styles.mainCardTitle}>
              Doanh thu tháng này
            </DynamicText>
          </View>
          <DynamicText style={styles.monthName}>
            {getCurrentMonth()}
          </DynamicText>
          <DynamicText style={styles.dateRange}>
            {getMonthDateRange()}
          </DynamicText>
          <DynamicText style={styles.mainAmount}>
            {formatCurrency(revenueStats.totalRevenue)}
          </DynamicText>
          <View style={styles.orderInfoRow}>
            <DynamicText style={styles.orderInfoText}>
              {revenueStats.orderCount} hóa đơn
            </DynamicText>
          </View>
        </TouchableOpacity>

        {/* Right column for smaller stats - 35% width */}
        <View style={styles.statsColumn}>
          <View style={[styles.statCard, styles.purpleCard]}>
            <View style={styles.statIconContainer}>
              <DocumentText size={16} color="#FFFFFF" variant="Bold" />
            </View>
            <DynamicText style={styles.statTitle}>Giá trị đơn TB</DynamicText>
            <DynamicText style={styles.statValue}>
              {formatCurrency(revenueStats.averageOrderValue)}
            </DynamicText>
          </View>
          <View style={[styles.statCard, styles.greenCard]}>
            <View style={styles.statIconContainer}>
              <ShoppingBag size={16} color="#FFFFFF" variant="Bold" />
            </View>
            <DynamicText style={styles.statTitle}>Sản phẩm bán ra</DynamicText>
            <DynamicText style={styles.statValue}>
              {revenueStats.totalProductsSold}
            </DynamicText>
          </View>
        </View>
      </View>

      <View style={styles.rowContainer}>
        {/* Biểu đồ theo tuần trong tháng */}
        <View style={styles.chartContainer}>
          <View style={styles.chartHeader}>
            <Calendar size={20} color={color.accentColor.darkColor} />
            <DynamicText style={styles.chartTitle}>
              Doanh thu theo tuần
            </DynamicText>
          </View>
          
          <View style={styles.chartAxisContainer}>
            {/* Trục Y với các giá trị tham chiếu */}
            <View style={styles.yAxis}>
              {getYAxisLabels().map((label, index) => (
                <DynamicText key={index} style={styles.yAxisLabel}>
                  {label}
                </DynamicText>
              ))}
            </View>
            
            {/* Biểu đồ chính */}
            <View style={styles.chartContent}>
              {/* Vạch ngang tham chiếu */}
              <View style={[styles.referenceLine, {top: '0%'}]} />
              <View style={[styles.referenceLine, {top: '25%'}]} />
              <View style={[styles.referenceLine, {top: '50%'}]} />
              <View style={[styles.referenceLine, {top: '75%'}]} />
              <View style={[styles.referenceLine, {top: '100%'}]} />
              
              {/* Các cột dữ liệu */}
              {weekData.map((week, index) => {
                // Tính chiều cao phần trăm dựa vào doanh thu tối đa
                const heightPercentage = maxRevenue > 0 ? (week.revenue / maxRevenue) * 100 : 0;
                const currentWeek = Math.ceil(new Date().getDate() / 7);
                const isCurrentWeek = week.weekNumber === currentWeek;
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.chartBar}
                    onPress={() => handleBarPress(week)}
                    activeOpacity={0.7}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: heightPercentage > 0 ? `${heightPercentage}%` : 4,
                          backgroundColor: isCurrentWeek
                            ? color.primaryColor
                            : week.revenue > 0
                            ? '#4CD964'
                            : 'rgba(0, 0, 0, 0.1)',
                        },
                      ]}
                    />
                    <DynamicText style={styles.barLabel}>{week.label}</DynamicText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </View>

      {/* Order Summary Section */}
      <View style={styles.resultContainer}>
        <DynamicText style={styles.resultTitle}>Tóm tắt Hóa đơn</DynamicText>

        <TouchableOpacity 
          style={styles.resultItem}
          onPress={() => {
            // Get date range for current month
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth();
            
            const startOfMonth = new Date(currentYear, currentMonth, 1);
            startOfMonth.setHours(0, 0, 0, 0);
            
            const endOfMonth = new Date(currentYear, currentMonth + 1, 0);
            endOfMonth.setHours(23, 59, 59, 999);
            
            // Navigate to all orders for this month
            navigation.navigate(Screen.ORDERLIST, {
              filter: {
                startDate: startOfMonth.toISOString(),
                endDate: endOfMonth.toISOString()
              }
            });
          }}>
          <View style={styles.resultItemContent}>
            <View style={[styles.iconContainer, styles.primaryIconBg]}>
              <DocumentText size={20} color="#FFFFFF" variant="Bold" />
            </View>
            <View style={styles.resultLeft}>
              <DynamicText style={styles.resultItemTitle}>Tổng Hóa đơn</DynamicText>
              <DynamicText style={styles.resultItemValue}>
                {orderCounts.total}
              </DynamicText>
            </View>
          </View>
          <ArrowRight2 size={18} color={color.accentColor.grayColor} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.resultItem}
          onPress={() => {
            // Get date range for current month
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth();
            
            const startOfMonth = new Date(currentYear, currentMonth, 1);
            startOfMonth.setHours(0, 0, 0, 0);
            
            const endOfMonth = new Date(currentYear, currentMonth + 1, 0);
            endOfMonth.setHours(23, 59, 59, 999);
            
            // Navigate to unpaid orders for this month
            navigation.navigate(Screen.ORDERLIST, {
              filter: {
                startDate: startOfMonth.toISOString(),
                endDate: endOfMonth.toISOString(),
                paymentStatus: "unpaid"
              }
            });
          }}>
          <View style={styles.resultItemContent}>
            <View style={[styles.iconContainer, {backgroundColor: '#FF9500'}]}>
              <EmptyWallet size={20} color="#FFFFFF" variant="Bold" />
            </View>
            <View style={styles.resultLeft}>
              <DynamicText style={styles.resultItemTitle}>
                Đơn chưa thanh toán
              </DynamicText>
              <DynamicText style={styles.resultItemValue}>
                {orderCounts.unpaid}
              </DynamicText>
            </View>
          </View>
          <ArrowRight2 size={18} color={color.accentColor.grayColor} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.resultItem}
          onPress={() => {
            // Get date range for current month
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth();
            
            const startOfMonth = new Date(currentYear, currentMonth, 1);
            startOfMonth.setHours(0, 0, 0, 0);
            
            const endOfMonth = new Date(currentYear, currentMonth + 1, 0);
            endOfMonth.setHours(23, 59, 59, 999);
            
            // Navigate to partially paid orders for this month
            navigation.navigate(Screen.ORDERLIST, {
              filter: {
                startDate: startOfMonth.toISOString(),
                endDate: endOfMonth.toISOString(),
                paymentStatus: "partpaid"
              }
            });
          }}>
          <View style={styles.resultItemContent}>
            <View style={[styles.iconContainer, {backgroundColor: '#4A6FFF'}]}>
              <MoneyRecive size={20} color="#FFFFFF" variant="Bold" />
            </View>
            <View style={styles.resultLeft}>
              <DynamicText style={styles.resultItemTitle}>
                Đơn thanh toán một phần
              </DynamicText>
              <DynamicText style={styles.resultItemValue}>
                {orderCounts.partlyPaid}
              </DynamicText>
            </View>
          </View>
          <ArrowRight2 size={18} color={color.accentColor.grayColor} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.resultItem, styles.lastItem]}
          onPress={() => {
            // Get date range for current month
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth();
            
            const startOfMonth = new Date(currentYear, currentMonth, 1);
            startOfMonth.setHours(0, 0, 0, 0);
            
            const endOfMonth = new Date(currentYear, currentMonth + 1, 0);
            endOfMonth.setHours(23, 59, 59, 999);
            
            // Navigate to canceled orders for this month
            navigation.navigate(Screen.ORDERLIST, {
              status: "canceled",
              filter: {
                startDate: startOfMonth.toISOString(),
                endDate: endOfMonth.toISOString()
              }
            });
          }}>
          <View style={styles.resultItemContent}>
            <View style={[styles.iconContainer, styles.dangerIconBg]}>
              <CloseCircle size={20} color="#FFFFFF" variant="Bold" />
            </View>
            <View style={styles.resultLeft}>
              <DynamicText style={styles.resultItemTitle}>Đơn hủy</DynamicText>
              <DynamicText style={styles.resultItemValue}>
                {orderCounts.canceled}
              </DynamicText>
            </View>
          </View>
          <ArrowRight2 size={18} color={color.accentColor.grayColor} />
        </TouchableOpacity>
      </View>

      {/* Thêm padding bottom để không che phần cuối cùng khi cuộn */}
      <View style={styles.bottomPadding} />
      
      {/* Modal hiển thị thông tin chi tiết khi nhấn vào cột */}
      {modalVisible && selectedWeek && (
        <Modal
          transparent={true}
          visible={modalVisible}
          onRequestClose={hideModal}
          animationType="fade">
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={hideModal}>
            <View style={styles.modalContainer}>
              <View
                style={[
                  styles.modalBubble,
                  {
                    backgroundColor:
                      selectedWeek.weekNumber === Math.ceil(new Date().getDate() / 7)
                        ? color.primaryColor
                        : '#4CD964',
                  },
                ]}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <View style={styles.modalHeaderLeft}>
                      <DynamicText style={styles.modalTitle}>
                        Doanh thu:
                      </DynamicText>
                      <DynamicText style={styles.modalAmount}>
                        {formatCurrency(selectedWeek.revenue)}
                      </DynamicText>
                    </View>
                    <View style={styles.modalHeaderRight}>
                      <DynamicText style={styles.modalOrderCount}>
                        Số Hóa đơn: {selectedWeek.orderCount}
                      </DynamicText>
                    </View>
                  </View>
                  <DynamicText style={styles.modalDate}>
                    {selectedWeek.startDate.toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                    })} - 
                    {selectedWeek.endDate.toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                    })}
                  </DynamicText>
                </View>
                <View
                  style={[
                    styles.bubbleArrow,
                    {
                      borderTopColor:
                        selectedWeek.weekNumber === Math.ceil(new Date().getDate() / 7)
                          ? color.primaryColor
                          : '#4CD964',
                    },
                  ]}
                />
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </BaseLayout>
  );
});

// Add QuickAccessItem component
const QuickAccessItem = ({
  icon,
  title,
  onPress,
  backgroundColor,
}: {
  icon: React.ReactNode;
  title: string;
  onPress: () => void;
  backgroundColor?: string;
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.quickAccessItem, {backgroundColor}]}>
      <View style={styles.iconQuickAccessContainer}>{icon}</View>
      <DynamicText style={styles.title}>{title}</DynamicText>
    </TouchableOpacity>
  );
};

export default MonthScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: moderateScale(16),
    backgroundColor: color.backgroundColor,
  },
  contentContainer: {
    paddingVertical: scaleHeight(30),
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: moderateScale(16),
    gap: moderateScale(12),
  },
  mainCard: {
    flex: 0.65,
    backgroundColor: color.primaryColor,
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    shadowColor: color.primaryColor,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  statsColumn: {
    flex: 0.35,
    flexDirection: 'column',
    gap: moderateScale(12),
  },
  mainCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(12),
  },
  mainCardTitle: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Inter_SemiBold,
    color: '#FFFFFF',
    marginLeft: moderateScale(8),
  },
  monthName: {
    fontSize: moderateScale(12),
    fontFamily: Fonts.Inter_SemiBold,
    color: '#FFFFFF',
    marginBottom: moderateScale(2),
    textTransform: 'capitalize',
  },
  dateRange: {
    fontSize: moderateScale(10),
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: moderateScale(10),
  },
  mainAmount: {
    fontSize: moderateScale(24),
    fontFamily: Fonts.Inter_SemiBold,
    color: '#FFFFFF',
    marginBottom: moderateScale(8),
  },
  orderInfoRow: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(5),
    alignSelf: 'flex-start',
  },
  orderInfoText: {
    fontSize: moderateScale(10),
    color: '#FFFFFF',
    fontWeight: '500',
  },
  statCard: {
    flex: 1,
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  purpleCard: {
    backgroundColor: '#8A4FFF', // Purple
  },
  greenCard: {
    backgroundColor: '#34C759', // Green
  },
  statIconContainer: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(8),
  },
  statTitle: {
    fontSize: moderateScale(11),
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    marginBottom: moderateScale(4),
  },
  statValue: {
    fontSize: moderateScale(14),
    color: '#FFFFFF',
    fontFamily: Fonts.Inter_SemiBold,
  },
  rowContainer: {
    flexDirection: 'row',
    gap: scaleWidth(12),
    marginBottom: moderateScale(16),
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(16),
  },
  chartContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  chartTitle: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: color.accentColor.darkColor,
    marginLeft: moderateScale(8),
  },
  chartAxisContainer: {
    flexDirection: 'row',
    height: moderateScale(180),
  },
  yAxis: {
    width: moderateScale(45),
    height: '100%',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingRight: moderateScale(4),
  },
  yAxisLabel: {
    fontSize: moderateScale(9),
    color: color.accentColor.grayColor,
    textAlign: 'right',
  },
  chartContent: {
    flex: 1,
    height: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    position: 'relative',
  },
  referenceLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  chartBar: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  bar: {
    width: moderateScale(32),
    borderRadius: moderateScale(10),
    marginBottom: moderateScale(6),
  },
  barLabel: {
    fontSize: moderateScale(11),
    color: color.accentColor.grayColor,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    position: 'absolute',
    width: '50%',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalBubble: {
    width: '100%',
    borderRadius: moderateScale(10),
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
    zIndex: 1001,
  },
  bubbleArrow: {
    position: 'absolute',
    bottom: -10,
    alignSelf: 'center',
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#4CD964', // Will be dynamically set based on week
  },
  modalContent: {
    padding: moderateScale(12),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: moderateScale(8),
  },
  modalHeaderLeft: {
    flex: 0.6,
  },
  modalHeaderRight: {
    flex: 0.4,
    alignItems: 'flex-end',
  },
  modalTitle: {
    fontSize: moderateScale(12),
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: moderateScale(4),
  },
  modalAmount: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalOrderCount: {
    fontSize: moderateScale(12),
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    textAlign: 'right',
  },
  modalDate: {
    fontSize: moderateScale(11),
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'right',
  },
  quickAccessContainer: {
    flex: 0.4,
    backgroundColor: color.accentColor.whiteColor,
    height: '94%',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    shadowColor: 'rgba(0, 0, 0, 0.5)',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 2,
  },
  quickAccessContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  quickAccessItem: {
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    width: '30%',
    height: scaleHeight(150),
  },
  iconQuickAccessContainer: {
    marginBottom: scaleHeight(8),
  },
  title: {
    fontSize: scaledSize(18),
    fontFamily: Fonts.Inter_SemiBold,
    color: color.accentColor.whiteColor,
    textAlign: 'center',
  },
  bottomPadding: {
    height: moderateScale(100),
  },
  resultContainer: {
    backgroundColor: 'white',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: moderateScale(16),
  },
  resultTitle: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: color.accentColor.darkColor,
    marginBottom: moderateScale(12),
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: moderateScale(10),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  resultItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(8),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(12),
  },
  primaryIconBg: {
    backgroundColor: color.primaryColor,
  },
  secondaryIconBg: {
    backgroundColor: '#4A6FFF',
  },
  dangerIconBg: {
    backgroundColor: '#FF3B30',
  },
  resultLeft: {
    flex: 1,
  },
  resultItemTitle: {
    fontSize: moderateScale(13),
    color: color.accentColor.darkColor,
    marginBottom: moderateScale(2),
  },
  resultItemValue: {
    fontSize: moderateScale(13),
    color: color.accentColor.grayColor,
    fontWeight: '500',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
});
