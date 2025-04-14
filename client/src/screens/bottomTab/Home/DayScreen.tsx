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
  getDailyRevenueStats,
  setupRevenueTracking,
  formatCurrency,
  RevenueStats,
} from '../../../services/revenueService';
import {rootStore} from '../../../models/root-store';
import {
  DocumentText,
  Chart1,
  ShoppingBag,
  Calendar,
  CloseCircle,
  ArrowRight2,
  Activity,
  Box,
  Profile2User,
  PercentageSquare,
  Add,
  MoneyRecive,
  EmptyWallet,
} from 'iconsax-react-native';
import {Fonts} from '../../../assets';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList, Screen} from '../../../navigation/navigation.type';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Interface for time slot data
interface TimeSlotData {
  label: string;
  startHour: number;
  endHour: number;
  revenue: number;
  orderCount: number;
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

const DayScreen = observer(() => {
  const navigation = useNavigation<NavigationProp>();
  const [revenueStats, setRevenueStats] = useState<RevenueStats>({
    totalRevenue: 0,
    averageOrderValue: 0,
    totalProductsSold: 0,
    orderCount: 0,
  });
  const [timeSlots, setTimeSlots] = useState<TimeSlotData[]>([]);
  const [maxRevenue, setMaxRevenue] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlotData | null>(null);

  // Tính toán số đơn hàng theo từng loại
  const getOrderCounts = () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Lọc đơn hàng trong ngày hôm nay với xử lý lỗi parse ngày
      const todayOrders = rootStore.orders.orders.filter((order: any) => {
        try {
          const orderDate = new Date(order.createdAt);
          return orderDate >= today && orderDate < tomorrow;
        } catch (error) {
          console.error('Error parsing order date:', error);
          return false;
        }
      });

      // Đơn hàng chưa thanh toán
      const unpaidOrders = todayOrders.filter(
        (order: any) => order.paymentStatus === 'unpaid' && order.status !== 'canceled',
      );

      // Đơn hàng thanh toán một phần
      const partlyPaidOrders = todayOrders.filter(
        (order: any) => order.paymentStatus === 'partpaid' && order.status !== 'canceled',
      );

      // Đơn hàng hủy
      const canceledOrders = todayOrders.filter(
        (order: any) => order.status === 'canceled',
      );

      return {
        total: todayOrders.length,
        unpaid: unpaidOrders.length,
        partlyPaid: partlyPaidOrders.length,
        canceled: canceledOrders.length,
      };
    } catch (error) {
      console.error('Error in getOrderCounts:', error);
      return {
        total: 0,
        unpaid: 0,
        partlyPaid: 0,
        canceled: 0,
      };
    }
  };
  
  const [orderCounts, setOrderCounts] = useState({
    total: 0,
    unpaid: 0,
    partlyPaid: 0,
    canceled: 0,
  });

  // Format today's date
  const getToday = (): string => {
    const now = new Date();
    return now.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Generate time slots for today
  const generateTimeSlots = () => {
    const slots: TimeSlotData[] = [
      { label: '7h-9h', startHour: 7, endHour: 8, revenue: 0, orderCount: 0 },
      { label: '9h-11h', startHour: 9, endHour: 10, revenue: 0, orderCount: 0 },
      { label: '11h-13h', startHour: 11, endHour: 12, revenue: 0, orderCount: 0 },
      { label: '13h-15h', startHour: 13, endHour: 14, revenue: 0, orderCount: 0 },
      { label: '15h-17h', startHour: 15, endHour: 16, revenue: 0, orderCount: 0 },
      { label: '17h-19h', startHour: 17, endHour: 18, revenue: 0, orderCount: 0 },
      { label: '19h-21h', startHour: 19, endHour: 20, revenue: 0, orderCount: 0 },
    ];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Filter orders for today
    const todayOrders = rootStore.orders.orders.filter((order: any) => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= today && orderDate < tomorrow && order.status !== 'canceled';
    });

    // Calculate revenue for each time slot
    let highestRevenue = 0;
    
    slots.forEach((slot, index) => {
      const slotOrders = todayOrders.filter((order: any) => {
        const orderDate = new Date(order.createdAt);
        const orderHour = orderDate.getHours();
        // Include orders from startHour to endHour+1 (to cover 2 hours)
        return orderHour >= slot.startHour && orderHour <= slot.endHour + 1;
      });

      // Calculate revenue for this slot
      const slotRevenue = slotOrders.reduce((sum: number, order: any) => {
        if (order.paymentStatus === 'paid' || order.paymentStatus === 'partpaid') {
          return sum + (order.paymentStatus === 'partpaid' ? order.paidAmount || 0 : order.totalAmount);
        }
        return sum;
      }, 0);

      slots[index].revenue = slotRevenue;
      slots[index].orderCount = slotOrders.length;

      if (slotRevenue > highestRevenue) {
        highestRevenue = slotRevenue;
      }
    });

    // Set maximum revenue for scaling the chart
    const maxRevenueWithBuffer = highestRevenue > 0 ? highestRevenue * 1.2 : 400000;
    setMaxRevenue(maxRevenueWithBuffer);

    return slots;
  };

  // Get Y-axis labels for the chart
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

  useEffect(() => {
    // Fetch orders if not already loaded
    if (rootStore.orders.orders.length === 0) {
      rootStore.orders.fetchOrders();
    }

    // Update revenue stats
    const updateStats = () => {
      const stats = getDailyRevenueStats();
      setRevenueStats(stats);
      setTimeSlots(generateTimeSlots());
      setOrderCounts(getOrderCounts());
    };

    // Initial update
    updateStats();

    // Set up tracking for changes
    setupRevenueTracking(updateStats);

    // Clean up
    return () => {
      // Reaction is cleaned up in setupRevenueTracking
    };
  }, []);

  // Xử lý khi nhấn vào một cột trong biểu đồ
  const handleBarPress = (slot: TimeSlotData) => {
    console.log('Pressed bar for time slot:', slot.label, 'with revenue:', slot.revenue);

    // Sử dụng setTimeout để tránh vấn đề với re-render
    setTimeout(() => {
      setSelectedTimeSlot(slot);
      setModalVisible(true);
    }, 0);
  };

  // Khi ẩn modal
  const hideModal = () => {
    setModalVisible(false);
    // Xóa selectedTimeSlot khi đóng modal để tránh lỗi
    setTimeout(() => {
      setSelectedTimeSlot(null);
    }, 300);
  };

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
            const today = new Date();
            navigation.navigate(Screen.REVENUE, {
              startDate: today,
              endDate: today,
            });
          }}>
          <View style={styles.mainCardHeader}>
            <Calendar size={20} color="#FFFFFF" variant="Bold" />
            <DynamicText style={styles.mainCardTitle}>
              Doanh thu hôm nay
            </DynamicText>
          </View>
          <DynamicText style={styles.dateText}>{getToday()}</DynamicText>
          <DynamicText style={styles.mainAmount}>
            {formatCurrency(revenueStats.totalRevenue)}
          </DynamicText>
          <View style={styles.orderInfoRow}>
            <DynamicText style={styles.orderInfoText}>
              {revenueStats.orderCount} đơn hàng
            </DynamicText>
          </View>
        </TouchableOpacity>

        {/* Right column for smaller stats - 35% width */}
        <View style={styles.statsColumn}>
          <View style={[styles.statCard, styles.blueCard]}>
            <View style={styles.statIconContainer}>
              <DocumentText size={16} color="#FFFFFF" variant="Bold" />
            </View>
            <DynamicText style={styles.statTitle}>Giá trị đơn TB</DynamicText>
            <DynamicText style={styles.statValue}>
              {formatCurrency(revenueStats.averageOrderValue)}
            </DynamicText>
          </View>
          <View style={[styles.statCard, styles.orangeCard]}>
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
        {/* Phần biểu đồ */}
        <View style={styles.chartContainer}>
          <View style={styles.chartHeader}>
            <Chart1 size={20} color={color.accentColor.darkColor} />
            <DynamicText style={styles.chartTitle}>
              Doanh thu theo khung giờ
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
              {timeSlots.map((slot, index) => {
                // Tính chiều cao phần trăm dựa vào doanh thu tối đa
                const heightPercentage = maxRevenue > 0 ? (slot.revenue / maxRevenue) * 100 : 0;
                const currentHour = new Date().getHours();
                const isCurrentTimeSlot = currentHour >= slot.startHour && currentHour <= slot.endHour + 1;

                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.chartBar}
                    onPress={() => handleBarPress(slot)}
                    activeOpacity={0.7}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: heightPercentage > 0 ? `${heightPercentage}%` : 4,
                          backgroundColor: isCurrentTimeSlot
                            ? color.primaryColor
                            : slot.revenue > 0
                            ? '#4CD964'
                            : 'rgba(0, 0, 0, 0.1)',
                        },
                      ]}
                    />
                    <DynamicText style={styles.barLabel}>{slot.label}</DynamicText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
        
        <View style={styles.quickAccessContainer}>
          <View style={styles.chartHeader}>
            <Activity size={20} color={color.accentColor.darkColor} />
            <DynamicText style={styles.chartTitle}>Truy cập nhanh</DynamicText>
          </View>
          <View
            style={[styles.quickAccessContent, {marginTop: moderateScale(10)}]}>
            <QuickAccessItem
              backgroundColor={color.primaryColor}
              icon={
                <DocumentText
                  size={scaledSize(34)}
                  variant="Bold"
                  color={color.accentColor.whiteColor}
                />
              }
              title="Đơn hàng"
              onPress={() => navigation.navigate(Screen.ORDERSCREEN)}
            />
            <QuickAccessItem
              backgroundColor={'#EE0033'}
              icon={
                <Box
                  size={scaledSize(34)}
                  variant="Bold"
                  color={color.accentColor.whiteColor}
                />
              }
              title="Sản phẩm"
              onPress={() => navigation.navigate(Screen.ORDERSCREEN)}
            />
            <QuickAccessItem
              backgroundColor={'#00CC6A'}
              icon={
                <Profile2User
                  size={scaledSize(34)}
                  variant="Bold"
                  color={color.accentColor.whiteColor}
                />
              }
              title="Nhà cung cấp"
              onPress={() => {
                navigation.navigate(Screen.PROVIDER);
              }}
            />
          </View>
          <View
            style={[styles.quickAccessContent, {marginTop: moderateScale(12)}]}>
            <QuickAccessItem
              backgroundColor="#37BCAC"
              icon={
                <PercentageSquare
                  size={scaledSize(34)}
                  variant="Bold"
                  color={color.accentColor.whiteColor}
                />
              }
              title="Khuyến mãi"
              onPress={() => {navigation.navigate(Screen.PROMOTION_LIST)}}
            />
            <QuickAccessItem
              backgroundColor="#2D4982"
              icon={
                <Profile2User
                  size={scaledSize(34)}
                  variant="Bold"
                  color={color.accentColor.whiteColor}
                />
              }
              title="Khách hàng"
              onPress={() => {navigation.navigate(Screen.CUSTOMERS)}}
            />
            <QuickAccessItem
              backgroundColor={color.accentColor.grayColor}
              icon={
                <Add
                  size={scaledSize(40)}
                  variant="Linear"
                  color={color.accentColor.whiteColor}
                />
              }
              title="Thêm"
              onPress={() => {}}
            />
          </View>
        </View>
      </View>

      {/* Kết quả kinh doanh - Updated */}
      <View style={styles.resultContainer}>
        <DynamicText style={styles.resultTitle}>Tóm tắt đơn hàng</DynamicText>

        <TouchableOpacity 
          style={styles.resultItem}
          onPress={() => {
            // Navigate to all orders for today
            const today = new Date();
            const startOfDay = new Date(today);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(today);
            endOfDay.setHours(23, 59, 59, 999);
            
            navigation.navigate(Screen.ORDERLIST, {
              filter: {
                startDate: startOfDay.toISOString(),
                endDate: endOfDay.toISOString()
              }
            });
          }}>
          <View style={styles.resultItemContent}>
            <View style={[styles.iconContainer, styles.primaryIconBg]}>
              <DocumentText size={20} color="#FFFFFF" variant="Bold" />
            </View>
            <View style={styles.resultLeft}>
              <DynamicText style={styles.resultItemTitle}>Tổng đơn hàng</DynamicText>
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
            // Navigate to unpaid orders for today
            const today = new Date();
            const startOfDay = new Date(today);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(today);
            endOfDay.setHours(23, 59, 59, 999);
            
            navigation.navigate(Screen.ORDERLIST, {
              filter: {
                startDate: startOfDay.toISOString(),
                endDate: endOfDay.toISOString(),
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
            // Navigate to partially paid orders for today
            const today = new Date();
            const startOfDay = new Date(today);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(today);
            endOfDay.setHours(23, 59, 59, 999);
            
            navigation.navigate(Screen.ORDERLIST, {
              filter: {
                startDate: startOfDay.toISOString(),
                endDate: endOfDay.toISOString(),
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
            // Navigate to canceled orders for today
            const today = new Date();
            const startOfDay = new Date(today);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(today);
            endOfDay.setHours(23, 59, 59, 999);
            
            navigation.navigate(Screen.ORDERLIST, {
              status: "canceled",
              filter: {
                startDate: startOfDay.toISOString(),
                endDate: endOfDay.toISOString()
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
      {modalVisible && selectedTimeSlot && (
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
                      (new Date().getHours() >= selectedTimeSlot.startHour && 
                       new Date().getHours() <= selectedTimeSlot.endHour + 1)
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
                        {formatCurrency(selectedTimeSlot.revenue)}
                      </DynamicText>
                    </View>
                    <View style={styles.modalHeaderRight}>
                      <DynamicText style={styles.modalOrderCount}>
                        Số đơn hàng: {selectedTimeSlot.orderCount}
                      </DynamicText>
                    </View>
                  </View>
                  <DynamicText style={styles.modalDate}>
                    Khung giờ: {selectedTimeSlot.label}
                  </DynamicText>
                </View>
                <View
                  style={[
                    styles.bubbleArrow,
                    {
                      borderTopColor:
                        (new Date().getHours() >= selectedTimeSlot.startHour && 
                         new Date().getHours() <= selectedTimeSlot.endHour + 1)
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

export default DayScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  rowContainer: {
    flexDirection: 'row',
    gap: scaleWidth(12),
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
  dateText: {
    fontSize: moderateScale(11),
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: moderateScale(10),
    textTransform: 'capitalize',
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
  mainAmount: {
    fontSize: moderateScale(24),
    color: '#FFFFFF',
    fontFamily: Fonts.Inter_SemiBold,
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
  blueCard: {
    backgroundColor: '#4A6FFF', // Blue
  },
  orangeCard: {
    backgroundColor: '#FF9500', // Orange
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
  chartContainer: {
    flex: 0.85,
    backgroundColor: color.accentColor.whiteColor,
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginBottom: moderateScale(16),
    shadowColor: 'rgba(0, 0, 0, 0.5)',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(16),
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
  },
  bar: {
    width: moderateScale(28),
    borderRadius: moderateScale(10),
    marginBottom: moderateScale(6),
  },
  barLabel: {
    fontSize: moderateScale(9),
    color: color.accentColor.grayColor,
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
  bottomPadding: {
    height: moderateScale(100),
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
    borderTopColor: '#4CD964', // Will be dynamically set based on time slot
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
});
