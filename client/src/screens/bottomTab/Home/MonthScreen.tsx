import React, {useState, useEffect} from 'react';
import {StyleSheet, View, ScrollView, TouchableOpacity} from 'react-native';
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
} from 'iconsax-react-native';
import {Fonts} from '../../../assets';

const MonthScreen = observer(() => {
  const [revenueStats, setRevenueStats] = useState<RevenueStats>({
    totalRevenue: 0,
    averageOrderValue: 0,
    totalProductsSold: 0,
    orderCount: 0,
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

  useEffect(() => {
    // Fetch orders if not already loaded
    if (rootStore.orders.orders.length === 0) {
      rootStore.orders.fetchOrders();
    }

    // Update revenue stats
    const updateStats = () => {
      const stats = getMonthlyRevenueStats();
      setRevenueStats(stats);
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

  return (
    <BaseLayout
      style={styles.container}
      scrollable
      contentContainerStyle={styles.contentContainer}>
      {/* Row for revenue and stats */}
      <View style={styles.statsRow}>
        {/* Main revenue card - 65% width */}
        <View style={styles.mainCard}>
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
              {revenueStats.orderCount} đơn hàng
            </DynamicText>
          </View>
        </View>

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
        {/* Biểu đồ mini theo tuần trong tháng */}
        <View style={styles.chartContainer}>
          <View style={styles.chartHeader}>
            <Calendar size={20} color={color.accentColor.darkColor} />
            <DynamicText style={styles.chartTitle}>
              Doanh thu theo tuần
            </DynamicText>
          </View>
          <View style={styles.chartContent}>
            {['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4', 'Tuần 5'].map(
              (week, index) => {
                const currentWeek = Math.floor(new Date().getDate() / 7) + 1;
                return (
                  <View key={index} style={styles.chartBar}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: moderateScale(20 + Math.random() * 120),
                          backgroundColor:
                            index + 1 === currentWeek
                              ? color.primaryColor
                              : 'rgba(0, 0, 0, 0.1)',
                        },
                      ]}
                    />
                    <DynamicText style={styles.barLabel}>{week}</DynamicText>
                  </View>
                );
              },
            )}
          </View>
        </View>

        {/* Quick Access Container */}
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

      {/* Thêm padding bottom để không che phần cuối cùng khi cuộn */}
      <View style={styles.bottomPadding} />
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
    marginLeft: moderateScale(8),
  },
  chartContent: {
    flexDirection: 'row',
    height: moderateScale(150),
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  chartBar: {
    alignItems: 'center',
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
});
