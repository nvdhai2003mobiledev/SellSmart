import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { BaseLayout, Button, Header, DynamicText } from '../../../components';
import { scaledSize, scaleHeight } from '../../../utils';

const StatisticsScreen = () => {
  const navigation = useNavigation();
  const [filter, setFilter] = useState('30 ngày qua'); // Trạng thái bộ lọc thời gian

  // Dữ liệu mẫu cho biểu đồ (có thể thay bằng dữ liệu động từ API)
  const chartData = [
    { month: 'Jan', value: 50 },
    { month: 'Feb', value: 100 },
    { month: 'Mar', value: 150 },
    { month: 'Apr', value: 70 },
    { month: 'May', value: 60 },
    { month: 'Jun', value: 80 },
  ];

  // Hàm xử lý khi nhấn nút lọc
  const handleFilterChange = () => {
    // Logic thay đổi bộ lọc (có thể mở rộng với modal hoặc picker)
    setFilter(filter === '30 ngày qua' ? '7 ngày qua' : '30 ngày qua');
    // Có thể thêm logic tải lại dữ liệu thống kê dựa trên filter
  };

  return (
    <BaseLayout>
      {/* Header */}
      <Header
        title="Thống kê"
        showBackIcon={true}
        onPressBack={() => navigation.goBack()}
      />

      {/* Bộ lọc */}
      <View style={styles.headerFilter}>
        <Button
          title={filter}
          onPress={handleFilterChange}
          buttonContainerStyle={styles.filterButton}
          titleStyle={styles.filterText}
        />
      </View>

      {/* Tổng quan */}
      <View style={styles.overviewContainer}>
        <DynamicText style={styles.overviewLabel}>Tổng quan</DynamicText>
        <DynamicText style={styles.overviewValue}>100.000.000đ</DynamicText>
      </View>

      {/* Tiền đã nộp */}
      <View style={styles.paidContainer}>
        <DynamicText style={styles.paidLabel}>Tiền đã nộp</DynamicText>
        <DynamicText style={styles.paidValue}>100.000.000đ</DynamicText>
      </View>

      {/* Tiền còn nợ */}
      <View style={styles.debtContainer}>
        <DynamicText style={styles.debtLabel}>Tiền còn nợ</DynamicText>
        <DynamicText style={styles.debtValue}>200.000.000đ</DynamicText>
      </View>

      {/* Biểu đồ */}
      <View style={styles.chartContainer}>
        <Svg height="200" width="300">
          {chartData.map((item, index) => (
            <Rect
              key={item.month}
              x={20 + index * 50}
              y={200 - item.value}
              width="30"
              height={item.value}
              fill={item.month === 'Mar' ? '#007AFF' : '#ddd'} // Tô màu nổi bật cho tháng Mar
            />
          ))}
        </Svg>
        <View style={styles.monthLabels}>
          {chartData.map((item) => (
            <DynamicText key={item.month} style={styles.monthLabel}>
              {item.month}
            </DynamicText>
          ))}
        </View>
      </View>
    </BaseLayout>
  );
};

// Styles
const styles = StyleSheet.create({
  headerFilter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingVertical: scaleHeight(10),
  },
  filterButton: {
    backgroundColor: '#e0e0e0',
    paddingVertical: scaledSize(6),
    paddingHorizontal: scaledSize(12),
    borderRadius: 12,
  },
  filterText: {
    fontSize: scaledSize(14),
    color: '#000',
  },
  overviewContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: scaledSize(16),
    marginBottom: scaleHeight(16),
  },
  overviewLabel: {
    fontSize: scaledSize(16),
    color: '#666',
  },
  overviewValue: {
    fontSize: scaledSize(20),
    fontWeight: 'bold',
    color: '#000',
    marginTop: scaleHeight(8),
  },
  paidContainer: {
    backgroundColor: '#e6f3ff',
    borderRadius: 8,
    padding: scaledSize(16),
    marginBottom: scaleHeight(16),
  },
  paidLabel: {
    fontSize: scaledSize(16),
    color: '#666',
  },
  paidValue: {
    fontSize: scaledSize(20),
    fontWeight: 'bold',
    color: '#000',
    marginTop: scaleHeight(8),
  },
  debtContainer: {
    backgroundColor: '#cce5ff',
    borderRadius: 8,
    padding: scaledSize(16),
    marginBottom: scaleHeight(16),
  },
  debtLabel: {
    fontSize: scaledSize(16),
    color: '#666',
  },
  debtValue: {
    fontSize: scaledSize(20),
    fontWeight: 'bold',
    color: '#000',
    marginTop: scaleHeight(8),
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: scaledSize(16),
    alignItems: 'center',
  },
  monthLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginTop: scaleHeight(10),
  },
  monthLabel: {
    fontSize: scaledSize(14),
    color: '#666',
  },
});

export default StatisticsScreen;