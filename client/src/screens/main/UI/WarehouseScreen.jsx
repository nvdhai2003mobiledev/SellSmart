import React from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { BaseLayout, Input, Button } from '../../../components';

const WarehouseScreen = () => {
  // Dữ liệu fix cứng cho danh sách sản phẩm
  const products = [
    { id: '1', code: '#SH5832', name: 'MacBook Pro 2023 14 inch', status: 'Hết hàng' },
    { id: '2', code: '#SH5832', name: 'MacBook Pro 2023 14 inch', status: 'Hết hàng' },
    { id: '3', code: '#SH5832', name: 'MacBook Pro 2023 14 inch', status: 'Hết hàng' },
    { id: '4', code: '#SH5832', name: 'MacBook Pro 2023 14 inch', status: 'Hết hàng' },
    { id: '5', code: '#SH5832', name: 'MacBook Pro 2023 14 inch', status: 'Hết hàng' },
  ];

  return (
    <BaseLayout>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <Icon name="chevron-back-outline" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý kho</Text>
        <View style={{ width: 24 }} /> {/* Placeholder để cân đối */}
      </View>

      {/* Tìm kiếm và bộ lọc */}
      <View style={styles.searchContainer}>
        <Input
          placeholderText="Nhập tên/mã sản phẩm"
          iconType="custom"
          EndIcon={<Icon name="search-outline" size={20} color="#666" style={styles.searchIcon} />}
          inputContainerStyle={styles.searchInput}
        />
        <View style={styles.filterButtons}>
          <Button
            title="Tất cả"
            buttonContainerStyle={styles.allButton}
            titleStyle={styles.allButtonText}
          />
          <Button
            title="Còn hàng"
            buttonContainerStyle={styles.availableButton}
            titleStyle={styles.availableButtonText}
          />
        </View>
      </View>

      {/* Danh sách sản phẩm */}
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.productItem}>
            <Image
              source={{ uri: 'https://via.placeholder.com/50' }}
              style={styles.productImage}
            />
            <View style={styles.productDetails}>
              <Text style={styles.productCode}>{item.code}</Text>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productStatus}>BO</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  allButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  allButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  availableButton: {
    flex: 1,
    backgroundColor: '#e0e0e0',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  availableButtonText: {
    fontSize: 16,
    color: '#000',
  },
  listContainer: {
    paddingBottom: 16,
  },
  productItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  productImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  productDetails: {
    flex: 1,
  },
  productCode: {
    fontSize: 14,
    color: '#666',
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  productStatus: {
    fontSize: 14,
    color: '#ff4444',
  },
});

export default WarehouseScreen;