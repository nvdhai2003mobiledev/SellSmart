import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { DynamicText } from '../../../components';
import { color, moderateScale } from '../../../utils';
import { observer } from 'mobx-react-lite';
import {
  getWeeklyRevenueStats,
  setupRevenueTracking,
  formatCurrency,
  RevenueStats
} from '../../../services/revenueService';
import { rootStore } from '../../../models/root-store';
import { Calendar, DocumentText, ShoppingBag } from 'iconsax-react-native';

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

const WeekScreen = observer(() => {
  const [revenueStats, setRevenueStats] = useState<RevenueStats>({
    totalRevenue: 0,
    averageOrderValue: 0,
    totalProductsSold: 0,
    orderCount: 0
  });
  const [weekDays, setWeekDays] = useState<DayData[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [maxRevenue, setMaxRevenue] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Format date range for display (Monday to Today)
  const getWeekDateRange = (): string => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    const monday = new Date(now);
    monday.setDate(diff);
    
    return `${monday.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit'
    })} - ${now.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit'
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
      
      // Tính doanh thu cho ngày cụ thể từ dữ liệu đơn hàng
      const dayRevenue = calculateDayRevenue(date);
      
      if (dayRevenue > highestRevenue) {
        highestRevenue = dayRevenue;
      }
      
      // Đếm số đơn hàng trong ngày
      const dayOrderCount = countOrdersForDay(date);
      
      // Chuyển đổi index của ngày sang tên hiển thị
      const dayName = i === 6 ? 'CN' : `T${i + 2}`;
      
      days.push({
        name: dayName,
        dayOfWeek: i === 6 ? 0 : i + 1, // 0 = Sunday, 1 = Monday, ...
        revenue: dayRevenue,
        orderCount: dayOrderCount,
        date
      });
    }
    
    // Đảm bảo biểu đồ vẫn vẽ được ngay cả khi doanh thu = 0
    const maxRevenueWithBuffer = highestRevenue > 0 ? highestRevenue * 1.2 : 400000;
    setMaxRevenue(maxRevenueWithBuffer);
    
    return days;
  };
  
  // Tính doanh thu cho một ngày cụ thể
  const calculateDayRevenue = (date: Date): number => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Lọc đơn hàng trong ngày và đã thanh toán
    const dayOrders = rootStore.orders.orders.filter((order: any) => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= startOfDay && 
             orderDate <= endOfDay && 
             order.status !== 'canceled' &&
             (order.paymentStatus === 'paid' || order.paymentStatus === 'partpaid');
    });
    
    // Tính tổng doanh thu
    return dayOrders.reduce((sum: number, order: any) => {
      // Nếu thanh toán một phần, chỉ tính số tiền đã thanh toán
      return sum + (order.paymentStatus === 'partpaid' ? (order.paidAmount || 0) : order.totalAmount);
    }, 0);
  };
  
  // Đếm số đơn hàng trong ngày
  const countOrdersForDay = (date: Date): number => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Đếm đơn hàng không bị hủy
    return rootStore.orders.orders.filter((order: any) => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= startOfDay && 
             orderDate <= endOfDay && 
             order.status !== 'canceled';
    }).length;
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
  }, []);  // Bỏ qua warning về dependency để tránh re-render liên tục
  
  // Xử lý khi nhấn vào một cột trong biểu đồ
  const handleBarPress = (day: DayData) => {
    console.log("Pressed bar for day:", day.name, "with revenue:", day.revenue);
    
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
      '0đ'
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
    <ScrollView 
      style={styles.container}
      ref={scrollViewRef}
      nestedScrollEnabled
    >
      {/* Row for revenue and stats */}
      <View style={styles.statsRow}>
        {/* Main revenue card - 65% width */}
        <View style={styles.mainCard}>
          <View style={styles.mainCardHeader}>
            <Calendar size={20} color="#FFFFFF" variant="Bold" />
            <DynamicText style={styles.mainCardTitle}>Doanh thu tuần này</DynamicText>
          </View>
          <DynamicText style={styles.dateRange}>{getWeekDateRange()}</DynamicText>
          <DynamicText style={styles.mainAmount}>{formatCurrency(revenueStats.totalRevenue)}</DynamicText>
          <View style={styles.orderInfoRow}>
            <DynamicText style={styles.orderInfoText}>
              {revenueStats.orderCount} đơn hàng
            </DynamicText>
          </View>
        </View>

        {/* Right column for smaller stats - 35% width */}
        <View style={styles.statsColumn}>
          <View style={[styles.statCard, styles.blueCard]}>
            <View style={styles.statIconContainer}>
              <DocumentText size={16} color="#FFFFFF" variant="Bold" />
            </View>
            <DynamicText style={styles.statTitle}>
              Giá trị đơn TB
            </DynamicText>
            <DynamicText style={styles.statValue}>
              {formatCurrency(revenueStats.averageOrderValue)}
            </DynamicText>
          </View>
          <View style={[styles.statCard, styles.orangeCard]}>
            <View style={styles.statIconContainer}>
              <ShoppingBag size={16} color="#FFFFFF" variant="Bold" />
            </View>
            <DynamicText style={styles.statTitle}>
              Sản phẩm bán ra
            </DynamicText>
            <DynamicText style={styles.statValue}>
              {revenueStats.totalProductsSold}
            </DynamicText>
          </View>
        </View>
      </View>
      
      {/* Biểu đồ nâng cao với trục y và tooltip */}
      <View style={styles.chartContainer}>
        <DynamicText style={styles.chartTitle}>Doanh thu trong tuần</DynamicText>
        
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
            <View style={[styles.referenceLine, { top: '0%' }]} />
            <View style={[styles.referenceLine, { top: '25%' }]} />
            <View style={[styles.referenceLine, { top: '50%' }]} />
            <View style={[styles.referenceLine, { top: '75%' }]} />
            <View style={[styles.referenceLine, { top: '100%' }]} />
            
            {/* Các cột dữ liệu */}
            {weekDays.map((day, index) => {
              // Tính chiều cao phần trăm dựa vào doanh thu tối đa
              const heightPercentage = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
              const today = new Date().getDay();
              const isToday = today === day.dayOfWeek;
              
              return (
                <TouchableOpacity 
                  key={index} 
                  style={styles.chartBar}
                  onPress={() => handleBarPress(day)}
                  activeOpacity={0.7}
                >
                  <View 
                    style={[
                      styles.bar, 
                      { 
                        height: heightPercentage > 0 ? `${heightPercentage}%` : 4,
                        backgroundColor: isToday ? color.primaryColor : 
                          day.revenue > 0 ? '#4CD964' : 'rgba(0, 0, 0, 0.1)',
                      }
                    ]} 
                  />
                  <DynamicText style={styles.barLabel}>{day.name}</DynamicText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
      
      {/* Thêm padding bottom để không che phần cuối cùng khi cuộn */}
      <View style={styles.bottomPadding} />
      
      {/* Modal hiển thị thông tin chi tiết khi nhấn vào cột */}
      {modalVisible && selectedDay && (
        <Modal
          transparent={true}
          visible={modalVisible}
          onRequestClose={hideModal}
          animationType="fade"
        >
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1}
            onPress={hideModal}
          >
            <View style={styles.modalContainer}>
              <View 
                style={[
                  styles.modalBubble,
                  {backgroundColor: selectedDay.dayOfWeek === new Date().getDay() ? 
                    color.primaryColor : '#4CD964'}
                ]}
              >
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <View style={styles.modalHeaderLeft}>
                      <DynamicText style={styles.modalTitle}>Doanh thu:</DynamicText>
                      <DynamicText style={styles.modalAmount}>
                        {formatCurrency(selectedDay.revenue)}
                      </DynamicText>
                    </View>
                    <View style={styles.modalHeaderRight}>
                      <DynamicText style={styles.modalOrderCount}>
                        Số đơn hàng: {selectedDay.orderCount}
                      </DynamicText>
                    </View>
                  </View>
                  <DynamicText style={styles.modalDate}>
                    {selectedDay.date.toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </DynamicText>
                </View>
                <View 
                  style={[
                    styles.bubbleArrow,
                    {borderTopColor: selectedDay.dayOfWeek === new Date().getDay() ? 
                      color.primaryColor : '#4CD964'}
                  ]} 
                />
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </ScrollView>
  );
});

export default WeekScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: moderateScale(16),
    backgroundColor: color.backgroundColor,
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
    shadowOffset: { width: 0, height: 8 },
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
    fontWeight: 'bold',
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
    fontWeight: 'bold',
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
    shadowOffset: { width: 0, height: 4 },
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
    fontWeight: 'bold',
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginBottom: moderateScale(16),
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
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
    borderRadius: moderateScale(12),
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
    shadowOffset: { width: 0, height: 2 },
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
});
