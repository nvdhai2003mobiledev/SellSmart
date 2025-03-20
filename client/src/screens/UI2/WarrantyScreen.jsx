import React, { useState } from 'react';
import { View, FlatList, Image, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { BaseLayout, Input, Header, DynamicText } from '../../components';
import { useNavigation } from '@react-navigation/native';

const WarrantyScreen = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');

  // Dữ liệu mẫu từ bảng Warranty
  const warranties = [
    { id: '1', product_id: 'PROD001', invoice_id: 'INV001', status: 'Active', start_date: '2023-01-15', end_date: '2024-01-15', name: 'MacBook Pro 2023 14 inch' },
    { id: '2', product_id: 'PROD002', invoice_id: 'INV002', status: 'Expired', start_date: '2022-06-10', end_date: '2023-06-10', name: 'MacBook Pro 2023 14 inch' },
    { id: '3', product_id: 'PROD003', invoice_id: 'INV003', status: 'Active', start_date: '2023-03-20', end_date: '2024-03-20', name: 'MacBook Pro 2023 14 inch' },
    { id: '4', product_id: 'PROD004', invoice_id: 'INV004', status: 'Active', start_date: '2023-05-01', end_date: '2024-05-01', name: 'MacBook Pro 2023 14 inch' },
  ];

  // Lọc danh sách bảo hành dựa trên searchQuery
  const filteredWarranties = warranties.filter(
    (warranty) =>
      warranty.product_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      warranty.invoice_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <BaseLayout>
      {/* Header sử dụng component Header */}
      <Header
        title="Bảo hành"
        showBackIcon={true}
        onPressBack={() => navigation.goBack()}
      />

      {/* Thanh tìm kiếm */}
      <View style={styles.searchContainer}>
        <Input
          placeholderText="Nhập ID sản phẩm hoặc hóa đơn"
          onChangeText={setSearchQuery}
          value={searchQuery}
          iconType="clear" // Hiển thị nút xóa khi có nội dung
          inputContainerStyle={styles.searchInput}
        />
      </View>

      {/* Danh sách bảo hành */}
      <FlatList
        data={filteredWarranties}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.productItem}>
            <Image
              source={{ uri: 'https://via.placeholder.com/50' }}
              style={styles.productImage}
            />
            <View style={styles.productDetails}>
              <DynamicText style={styles.productCode}>Product ID: {item.product_id}</DynamicText>
              <DynamicText style={styles.productName}>{item.name}</DynamicText>
              <DynamicText style={styles.productDate}>Từ: {item.start_date} - Đến: {item.end_date}</DynamicText>
              <DynamicText style={styles.productStatus}>Trạng thái: {item.status}</DynamicText>
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
    marginBottom: 16,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
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
  productDate: {
    fontSize: 14,
    color: '#666',
  },
  productStatus: {
    fontSize: 14,
    color: '#ff4444',
  },
});

export default WarrantyScreen;