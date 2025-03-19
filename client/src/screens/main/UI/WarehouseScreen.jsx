import React, { useState } from 'react';
import { View, FlatList, Image, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { BaseLayout, Input, Button, Header, DynamicText } from '../../../components';
import { scaledSize, scaleHeight } from '../../../utils';

const WarehouseScreen = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('Tất cả'); // Trạng thái lọc: 'Tất cả' hoặc 'Còn hàng'

  // Dữ liệu fix cứng cho danh sách sản phẩm
  const products = [
    { id: '1', code: '#SH5832', name: 'MacBook Pro 2023 14 inch', status: 'Hết hàng' },
    { id: '2', code: '#SH5832', name: 'MacBook Pro 2023 14 inch', status: 'Hết hàng' },
    { id: '3', code: '#SH5832', name: 'MacBook Pro 2023 14 inch', status: 'Hết hàng' },
    { id: '4', code: '#SH5832', name: 'MacBook Pro 2023 14 inch', status: 'Hết hàng' },
    { id: '5', code: '#SH5832', name: 'MacBook Pro 2023 14 inch', status: 'Hết hàng' },
  ];

  // Lọc danh sách sản phẩm dựa trên searchQuery và filter
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'Tất cả' || (filter === 'Còn hàng' && product.status !== 'Hết hàng');
    return matchesSearch && matchesFilter;
  });

  return (
    <BaseLayout>
      {/* Header */}
      <Header
        title="Quản lý kho"
        showBackIcon={true}
        onPressBack={() => navigation.goBack()}
      />

      {/* Tìm kiếm và bộ lọc */}
      <View style={styles.searchContainer}>
        <Input
          placeholderText="Nhập tên/mã sản phẩm"
          onChangeText={setSearchQuery}
          value={searchQuery}
          iconType="clear" // Hiển thị nút xóa khi có nội dung
          inputContainerStyle={styles.searchInput}
        />
        <View style={styles.filterButtons}>
          <Button
            title="Tất cả"
            onPress={() => setFilter('Tất cả')}
            buttonContainerStyle={[styles.filterButton, filter === 'Tất cả' && styles.activeFilter]}
            titleStyle={[styles.filterButtonText, filter === 'Tất cả' && styles.activeFilterText]}
          />
          <Button
            title="Còn hàng"
            onPress={() => setFilter('Còn hàng')}
            buttonContainerStyle={[styles.filterButton, filter === 'Còn hàng' && styles.activeFilter]}
            titleStyle={[styles.filterButtonText, filter === 'Còn hàng' && styles.activeFilterText]}
          />
        </View>
      </View>

      {/* Danh sách sản phẩm */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.productItem}>
            <Image
              source={{ uri: 'https://via.placeholder.com/50' }}
              style={styles.productImage}
            />
            <View style={styles.productDetails}>
              <DynamicText style={styles.productCode}>{item.code}</DynamicText>
              <DynamicText style={styles.productName}>{item.name}</DynamicText>
              <DynamicText style={styles.productStatus}>BO</DynamicText>
            </View>
          </View>
        )}
        contentContainerStyle={styles.listContainer}
      />
    </BaseLayout>
  );
};

// Styles
const styles = StyleSheet.create({
  searchContainer: {
    marginBottom: scaleHeight(16),
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: scaledSize(12),
    marginBottom: scaleHeight(12),
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterButton: {
    flex: 1,
    backgroundColor: '#e0e0e0',
    paddingVertical: scaledSize(10),
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: scaledSize(4),
  },
  activeFilter: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: scaledSize(16),
    color: '#000',
  },
  activeFilterText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  listContainer: {
    paddingBottom: scaleHeight(16),
  },
  productItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: scaledSize(12),
    marginBottom: scaleHeight(12),
    alignItems: 'center',
  },
  productImage: {
    width: scaledSize(50),
    height: scaledSize(50),
    borderRadius: 8,
    marginRight: scaledSize(12),
  },
  productDetails: {
    flex: 1,
  },
  productCode: {
    fontSize: scaledSize(14),
    color: '#666',
  },
  productName: {
    fontSize: scaledSize(16),
    fontWeight: 'bold',
    color: '#000',
  },
  productStatus: {
    fontSize: scaledSize(14),
    color: '#ff4444',
  },
});

export default WarehouseScreen;