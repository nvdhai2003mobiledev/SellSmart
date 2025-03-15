import React from 'react';
import { View, Text,StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { BaseLayout, Button } from '../../../components';

const StatisticsScreen = () => {
  return (
    <BaseLayout>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Thống kê</Text>
        {/* <Button
          title="30 ngày qua"
          buttonContainerStyle={styles.filterButton}
          titleStyle={styles.filterText}
        /> */}
      </View>

      {/* Tổng quan */}
      <View style={styles.overviewContainer}>
        <Text style={styles.overviewLabel}>Tổng quan</Text>
        <Text style={styles.overviewValue}>100.000.000đ</Text>
      </View>

      {/* Tiền đã nộp */}
      <View style={styles.paidContainer}>
        <Text style={styles.paidLabel}>Tiền đã nộp</Text>
        <Text style={styles.paidValue}>100.000.000đ</Text>
      </View>

      {/* Tiền còn nợ */}
      <View style={styles.debtContainer}>
        <Text style={styles.debtLabel}>Tiền còn nợ</Text>
        <Text style={styles.debtValue}>200.000.000đ</Text>
      </View>

      {/* Biểu đồ */}
      <View style={styles.chartContainer}>
        <Svg height="200" width="300">
          {/* Cột Jan */}
          <Rect x="20" y="150" width="30" height="50" fill="#ddd" />
          {/* Cột Feb */}
          <Rect x="70" y="100" width="30" height="100" fill="#ddd" />
          {/* Cột Mar (tô màu xanh đậm) */}
          <Rect x="120" y="50" width="30" height="150" fill="#007AFF" />
          {/* Cột Apr */}
          <Rect x="170" y="130" width="30" height="70" fill="#ddd" />
          {/* Cột May */}
          <Rect x="220" y="140" width="30" height="60" fill="#ddd" />
          {/* Cột Jun */}
          <Rect x="270" y="120" width="30" height="80" fill="#ddd" />
        </Svg>
        <View style={styles.monthLabels}>
          <Text style={styles.monthLabel}>Jan</Text>
          <Text style={styles.monthLabel}>Feb</Text>
          <Text style={styles.monthLabel}>Mar</Text>
          <Text style={styles.monthLabel}>Apr</Text>
          <Text style={styles.monthLabel}>May</Text>
          <Text style={styles.monthLabel}>Jun</Text>
        </View>
      </View>
    </BaseLayout>
  );
};

// Styles
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  filterButton: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  filterText: {
    fontSize: 14,
    color: '#000',
  },
  overviewContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  overviewLabel: {
    fontSize: 16,
    color: '#666',
  },
  overviewValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 8,
  },
  paidContainer: {
    backgroundColor: '#e6f3ff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  paidLabel: {
    fontSize: 16,
    color: '#666',
  },
  paidValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 8,
  },
  debtContainer: {
    backgroundColor: '#cce5ff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  debtLabel: {
    fontSize: 16,
    color: '#666',
  },
  debtValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 8,
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  monthLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginTop: 10,
  },
  monthLabel: {
    fontSize: 14,
    color: '#666',
  },
});

export default StatisticsScreen;