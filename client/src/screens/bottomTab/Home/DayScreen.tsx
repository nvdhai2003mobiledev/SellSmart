import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { DynamicText } from '../../../components';
import { color, moderateScale } from '../../../utils';
import { observer } from 'mobx-react-lite';
import {
  getDailyRevenueStats,
  setupRevenueTracking,
  formatCurrency,
  RevenueStats
} from '../../../services/revenueService';
import { rootStore } from '../../../models/root-store';
import { 
  DocumentText,
  Chart1, 
  ShoppingBag,
  Calendar,
  Clock,
  CloseCircle,
  ArrowRight2
} from 'iconsax-react-native';

const DayScreen = observer(() => {
  const [revenueStats, setRevenueStats] = useState<RevenueStats>({
    totalRevenue: 0,
    averageOrderValue: 0,
    totalProductsSold: 0,
    orderCount: 0
  });
  
  // Format today's date
  const getToday = (): string => {
    const now = new Date();
    return now.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
    <ScrollView style={styles.container}>
      {/* Row for revenue and stats */}
      <View style={styles.statsRow}>
        {/* Main revenue card - 65% width */}
        <View style={styles.mainCard}>
          <View style={styles.mainCardHeader}>
            <Calendar size={20} color="#FFFFFF" variant="Bold" />
            <DynamicText style={styles.mainCardTitle}>Doanh thu hôm nay</DynamicText>
          </View>
          <DynamicText style={styles.dateText}>{getToday()}</DynamicText>
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
      
      {/* Phần biểu đồ */}
      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <Chart1 size={20} color={color.accentColor.darkColor} />
          <DynamicText style={styles.chartTitle}>Thống kê doanh thu</DynamicText>
        </View>
        <View style={styles.chartContent}>
          {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day, index) => (
            <View key={index} style={styles.chartBar}>
              <View 
                style={[
                  styles.bar, 
                  { 
                    height: moderateScale(40 + Math.random() * 100),
                    backgroundColor: index === new Date().getDay() - 1 ? color.primaryColor : 'rgba(0, 0, 0, 0.1)',
                  }
                ]} 
              />
              <DynamicText style={styles.barLabel}>{day}</DynamicText>
            </View>
          ))}
        </View>
      </View>
      
      {/* Kết quả kinh doanh */}
      <View style={styles.resultContainer}>
        <DynamicText style={styles.resultTitle}>
          Tóm tắt đơn hàng
        </DynamicText>
        
        <TouchableOpacity style={styles.resultItem}>
          <View style={styles.resultItemContent}>
            <View style={[styles.iconContainer, styles.primaryIconBg]}>
              <DocumentText size={20} color="#FFFFFF" variant="Bold" />
            </View>
            <View style={styles.resultLeft}>
              <DynamicText style={styles.resultItemTitle}>
                Tổng đơn
              </DynamicText>
              <DynamicText style={styles.resultItemValue}>
                {revenueStats.orderCount}
              </DynamicText>
            </View>
          </View>
          <ArrowRight2 size={18} color={color.accentColor.grayColor} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.resultItem}>
          <View style={styles.resultItemContent}>
            <View style={[styles.iconContainer, styles.secondaryIconBg]}>
              <Clock size={20} color="#FFFFFF" variant="Bold" />
            </View>
            <View style={styles.resultLeft}>
              <DynamicText style={styles.resultItemTitle}>
                Sản phẩm bán ra
              </DynamicText>
              <DynamicText style={styles.resultItemValue}>
                {revenueStats.totalProductsSold}
              </DynamicText>
            </View>
          </View>
          <ArrowRight2 size={18} color={color.accentColor.grayColor} />
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.resultItem, styles.lastItem]}>
          <View style={styles.resultItemContent}>
            <View style={[styles.iconContainer, styles.dangerIconBg]}>
              <CloseCircle size={20} color="#FFFFFF" variant="Bold" />
            </View>
            <View style={styles.resultLeft}>
              <DynamicText style={styles.resultItemTitle}>
                Đơn hủy
              </DynamicText>
              <DynamicText style={styles.resultItemValue}>
                {rootStore.orders.canceledOrders.length}
              </DynamicText>
            </View>
          </View>
          <ArrowRight2 size={18} color={color.accentColor.grayColor} />
        </TouchableOpacity>
      </View>
      
      {/* Thêm padding bottom để không che phần cuối cùng khi cuộn */}
      <View style={styles.bottomPadding} />
    </ScrollView>
  );
});

export default DayScreen;

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
  dateText: {
    fontSize: moderateScale(11),
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: moderateScale(10),
    textTransform: 'capitalize',
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
  chartContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: moderateScale(150),
  },
  chartBar: {
    alignItems: 'center',
  },
  bar: {
    width: moderateScale(28),
    borderRadius: moderateScale(14),
    marginBottom: moderateScale(6),
  },
  barLabel: {
    fontSize: moderateScale(11),
    color: color.accentColor.grayColor,
  },
  resultContainer: {
    backgroundColor: 'white',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
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
});
