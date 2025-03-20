import React, { useState } from 'react';
import { View, FlatList, Image, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { BaseLayout, Input, Header, DynamicText } from '../../../components';

const ProductListScreen = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');

  // Dữ liệu fix cứng cho danh sách sản phẩm
  const products = [
    { id: '1', code: '#SH5832', name: 'MacBook Pro 2023 14 inch', status: 'Hết hàng' },
    { id: '2', code: '#SH5832', name: 'MacBook Pro 2023 14 inch', status: 'Hết hàng' },
    { id: '3', code: '#SH5832', name: 'MacBook Pro 2023 14 inch', status: 'Hết hàng' },
    { id: '4', code: '#SH5832', name: 'MacBook Pro 2023 14 inch', status: 'Hết hàng' },
  ];

  // Lọc danh sách sản phẩm dựa trên searchQuery
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <BaseLayout>
      {/* Header */}
      <Header
        title="Tất cả sản phẩm"
        showBackIcon={true}
        onPressBack={() => navigation.goBack()}
      />

      {/* Tìm kiếm */}
      <View style={styles.searchContainer}>
        <Input
          placeholderText="Nhập tên/mã sản phẩm"
          onChangeText={setSearchQuery}
          value={searchQuery}
          iconType="clear" // Hiển thị nút xóa khi có nội dung
          inputContainerStyle={styles.searchInput}
        />
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
  productStatus: {
    fontSize: 14,
    color: '#ff4444',
  },
});

export default ProductListScreen;