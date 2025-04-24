import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Modal,
} from 'react-native';
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
  getWeeklyRevenueStats,
  setupRevenueTracking,
  formatCurrency,
  RevenueStats,
} from '../../../services/revenueService';
import {rootStore} from '../../../models/root-store';
import {
  Calendar,
  DocumentText,
  ShoppingBag,
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

// Interface cho dữ liệu ngày trong tuần
interface DayData {
  name: string;
  dayOfWeek: number;
  revenue: number;
  orderCount: number;
  date: Date;
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

const WeekScreen = observer(() => {
  const navigation = useNavigation<NavigationProp>();
  const [revenueStats, setRevenueStats] = useState<RevenueStats>({
    totalRevenue: 0,
    averageOrderValue: 0,
    totalProductsSold: 0,
    orderCount: 0,
  });
  const [weekDays, setWeekDays] = useState<DayData[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [maxRevenue, setMaxRevenue] = useState(0);
  const [orderCounts, setOrderCounts] = useState({
    total: 0,
    unpaid: 0,
    partlyPaid: 0,
    canceled: 0,
  });

  // Format date range for display (Monday to Today)
  const getWeekDateRange = (): string => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    const monday = new Date(now);
    monday.setDate(diff);

    return `${monday.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
    })} - ${now.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
    })}`;
  };

  // Tạo và tính toán dữ liệu doanh thu theo ngày thực tế
  const generateWeekDays = () => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ...
    const days: DayData[] = [];
    let highestRevenue = 0;

    // Lấy ngày bắt đầu tuần (thứ 2)
    const startOfWeek = new Date(now);
    const diff = currentDay === 0 ? -6 : 1 - currentDay;
    startOfWeek.setDate(now.getDate() + diff);
    startOfWeek.setHours(0, 0, 0, 0);

    // Tạo dữ liệu cho từng ngày trong tuần
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);

      // Tính doanh thu cho ngày cụ thể từ dữ liệu Hóa đơn
      const dayRevenue = calculateDayRevenue(date);

      if (dayRevenue > highestRevenue) {
        highestRevenue = dayRevenue;
      }

      // Đếm số Hóa đơn trong ngày
      const dayOrderCount = countOrdersForDay(date);

      // Chuyển đổi index của ngày sang tên hiển thị
      const dayName = i === 6 ? 'CN' : `T${i + 2}`;

      days.push({
        name: dayName,
        dayOfWeek: i === 6 ? 0 : i + 1, // 0 = Sunday, 1 = Monday, ...
        revenue: dayRevenue,
        orderCount: dayOrderCount,
        date,
      });
    }

    // Đảm bảo biểu đồ vẫn vẽ được ngay cả khi doanh thu = 0
    const maxRevenueWithBuffer =
      highestRevenue > 0 ? highestRevenue * 1.2 : 400000;
    setMaxRevenue(maxRevenueWithBuffer);

    return days;
  };

  // Tính doanh thu cho một ngày cụ thể
  const calculateDayRevenue = (date: Date): number => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Lọc Hóa đơn trong ngày và đã thanh toán
    const dayOrders = rootStore.orders.orders.filter((order: any) => {
      const orderDate = new Date(order.createdAt);
      return (
        orderDate >= startOfDay &&
        orderDate <= endOfDay &&
        order.status !== 'canceled' &&
        (order.paymentStatus === 'paid' || order.paymentStatus === 'partpaid')
      );
    });

    // Tính tổng doanh thu
    return dayOrders.reduce((sum: number, order: any) => {
      // Nếu thanh toán một phần, chỉ tính số tiền đã thanh toán
      return (
        sum +
        (order.paymentStatus === 'partpaid'
          ? order.paidAmount || 0
          : order.totalAmount)
      );
    }, 0);
  };

  // Đếm số Hóa đơn trong ngày
  const countOrdersForDay = (date: Date): number => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Đếm Hóa đơn không bị hủy
    return rootStore.orders.orders.filter((order: any) => {
      const orderDate = new Date(order.createdAt);
      return (
        orderDate >= startOfDay &&
        orderDate <= endOfDay &&
        order.status !== 'canceled'
      );
    }).length;
  };

  // Calculate order counts for the week
  const getWeekOrderCounts = () => {
    try {
      const now = new Date();
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
      
      // Get start of week (Monday)
      const monday = new Date(now);
      monday.setDate(diff);
      monday.setHours(0, 0, 0, 0);
      
      // Get end of week (Sunday)
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      // Filter orders for the current week
      const weekOrders = rootStore.orders.orders.filter((order: any) => {
        try {
          const orderDate = new Date(order.createdAt);
          return orderDate >= monday && orderDate <= sunday;
        } catch (error) {
          console.error('Error parsing order date:', error);
          return false;
        }
      });

      // Unpaid orders
      const unpaidOrders = weekOrders.filter(
        (order: any) => order.paymentStatus === 'unpaid' && order.status !== 'canceled',
      );

      // Partially paid orders
      const partlyPaidOrders = weekOrders.filter(
        (order: any) => order.paymentStatus === 'partpaid' && order.status !== 'canceled',
      );

      // Canceled orders
      const canceledOrders = weekOrders.filter(
        (order: any) => order.status === 'canceled',
      );

      return {
        total: weekOrders.length,
        unpaid: unpaidOrders.length,
        partlyPaid: partlyPaidOrders.length,
        canceled: canceledOrders.length,
      };
    } catch (error) {
      console.error('Error in getWeekOrderCounts:', error);
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
      const stats = getWeeklyRevenueStats();
      setRevenueStats(stats);
      setWeekDays(generateWeekDays());
      setOrderCounts(getWeekOrderCounts());
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
  }, []); // Bỏ qua warning về dependency để tránh re-render liên tục

  // Xử lý khi nhấn vào một cột trong biểu đồ
  const handleBarPress = (day: DayData) => {
    console.log('Pressed bar for day:', day.name, 'with revenue:', day.revenue);

    // Không sử dụng setSelectedDay và setModalVisible trực tiếp
    // vì có thể gây vấn đề với re-render
    setTimeout(() => {
      setSelectedDay(day);
      setModalVisible(true);
    }, 0);
  };

  // Định dạng Y-axis với 5 giá trị
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

  // Khi ẩn modal
  const hideModal = () => {
    setModalVisible(false);
    // Xóa selectedDay khi đóng modal để tránh lỗi
    setTimeout(() => {
      setSelectedDay(null);
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
            const now = new Date();
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(now);
            monday.setDate(diff);
            
            navigation.navigate(Screen.REVENUE, {
              startDate: monday,
              endDate: now,
            });
          }}>
          <View style={styles.mainCardHeader}>
            <Calendar size={20} color="#FFFFFF" variant="Bold" />
            <DynamicText style={styles.mainCardTitle}>
              Doanh thu tuần này
            </DynamicText>
          </View>
          <DynamicText style={styles.dateRange}>
            {getWeekDateRange()}
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
        {/* Biểu đồ nâng cao với trục y và tooltip */}
        <View style={styles.chartContainer}>
          <DynamicText style={styles.chartTitle}>
            Doanh thu trong tuần
          </DynamicText>

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
              {weekDays.map((day, index) => {
                // Tính chiều cao phần trăm dựa vào doanh thu tối đa
                const heightPercentage =
                  maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
                const today = new Date().getDay();
                const isToday = today === day.dayOfWeek;

                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.chartBar}
                    onPress={() => handleBarPress(day)}
                    activeOpacity={0.7}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height:
                            heightPercentage > 0 ? `${heightPercentage}%` : 4,
                          backgroundColor: isToday
                            ? color.primaryColor
                            : day.revenue > 0
                            ? '#4CD964'
                            : 'rgba(0, 0, 0, 0.1)',
                        },
                      ]}
                    />
                    <DynamicText style={styles.barLabel}>
                      {day.name}
                    </DynamicText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Quick Access Container */}
        <View style={styles.quickAccessContainer}>
          <View style={styles.chartHeader}>
            <DynamicText style={styles.chartTitle}>Truy cập nhanh</DynamicText>
          </View>
          <View style={[styles.quickAccessContent]}>
            <QuickAccessItem
              backgroundColor={color.primaryColor}
              icon={
                <DocumentText
                  size={scaledSize(34)}
                  variant="Bold"
                  color={color.accentColor.whiteColor}
                />
              }
              title="Hóa đơn"
              onPress={() => {}}
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
              onPress={() => {}}
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
              onPress={() => {}}
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
              onPress={() => {}}
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
              onPress={() => {}}
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

      {/* Order Summary Section */}
      <View style={styles.resultContainer}>
        <DynamicText style={styles.resultTitle}>Tóm tắt Hóa đơn</DynamicText>

        <TouchableOpacity 
          style={styles.resultItem}
          onPress={() => {
            // Get date range for current week
            const now = new Date();
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1);
            
            const startOfWeek = new Date(now);
            startOfWeek.setDate(diff);
            startOfWeek.setHours(0, 0, 0, 0);
            
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);
            
            // Navigate to all orders for this week
            navigation.navigate(Screen.ORDERLIST, {
              filter: {
                startDate: startOfWeek.toISOString(),
                endDate: endOfWeek.toISOString()
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
            // Get date range for current week
            const now = new Date();
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1);
            
            const startOfWeek = new Date(now);
            startOfWeek.setDate(diff);
            startOfWeek.setHours(0, 0, 0, 0);
            
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);
            
            // Navigate to unpaid orders for this week
            navigation.navigate(Screen.ORDERLIST, {
              filter: {
                startDate: startOfWeek.toISOString(),
                endDate: endOfWeek.toISOString(),
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
            // Get date range for current week
            const now = new Date();
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1);
            
            const startOfWeek = new Date(now);
            startOfWeek.setDate(diff);
            startOfWeek.setHours(0, 0, 0, 0);
            
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);
            
            // Navigate to partially paid orders for this week
            navigation.navigate(Screen.ORDERLIST, {
              filter: {
                startDate: startOfWeek.toISOString(),
                endDate: endOfWeek.toISOString(),
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
            // Get date range for current week
            const now = new Date();
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1);
            
            const startOfWeek = new Date(now);
            startOfWeek.setDate(diff);
            startOfWeek.setHours(0, 0, 0, 0);
            
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);
            
            // Navigate to canceled orders for this week
            navigation.navigate(Screen.ORDERLIST, {
              status: "canceled",
              filter: {
                startDate: startOfWeek.toISOString(),
                endDate: endOfWeek.toISOString()
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
      {modalVisible && selectedDay && (
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
                      selectedDay.dayOfWeek === new Date().getDay()
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
                        {formatCurrency(selectedDay.revenue)}
                      </DynamicText>
                    </View>
                    <View style={styles.modalHeaderRight}>
                      <DynamicText style={styles.modalOrderCount}>
                        Số Hóa đơn: {selectedDay.orderCount}
                      </DynamicText>
                    </View>
                  </View>
                  <DynamicText style={styles.modalDate}>
                    {selectedDay.date.toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </DynamicText>
                </View>
                <View
                  style={[
                    styles.bubbleArrow,
                    {
                      borderTopColor:
                        selectedDay.dayOfWeek === new Date().getDay()
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

export default WeekScreen;

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
  dateRange: {
    fontSize: moderateScale(11),
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: moderateScale(10),
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
    flex: 0.85,
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
    marginBottom: moderateScale(16),
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
    width: moderateScale(24),
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
    borderTopColor: '#4CD964', // Will be dynamically set based on day
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
  bottomPadding: {
    height: moderateScale(100),
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
