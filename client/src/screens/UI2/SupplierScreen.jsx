import React, { useState } from 'react';
import { View, FlatList, Image, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { BaseLayout, Input, Header, DynamicText } from '../../components';
import { useNavigation } from '@react-navigation/native';

const SupplierScreen = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');

  // Dữ liệu mẫu cho danh sách nhà cung cấp
  const suppliers = [
    { id: '1', name: 'Công ty ABC', phone_number: '0901234567', email: 'abc@example.com', supplier_address: '123 Đường A, TP.HCM', status: 'Active' },
    { id: '2', name: 'Công ty XYZ', phone_number: '0912345678', email: 'xyz@example.com', supplier_address: '456 Đường B, Hà Nội', status: 'Inactive' },
    { id: '3', name: 'Công ty DEF', phone_number: '0923456789', email: 'def@example.com', supplier_address: '789 Đường C, Đà Nẵng', status: 'Active' },
    { id: '4', name: 'Công ty GHI', phone_number: '0934567890', email: 'ghi@example.com', supplier_address: '101 Đường D, Cần Thơ', status: 'Active' },
  ];

  // Lọc danh sách nhà cung cấp dựa trên searchQuery
  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.phone_number.includes(searchQuery)
  );

  return (
    <BaseLayout>
      {/* Header sử dụng component Header */}
      <Header
        title="Tất cả nhà cung cấp"
        showBackIcon={true}
        onPressBack={() => navigation.goBack()}
      />

      {/* Thanh tìm kiếm */}
      <View style={styles.searchContainer}>
        <Input
          placeholderText="Nhập tên/mã nhà cung cấp"
          onChangeText={setSearchQuery}
          value={searchQuery}
          iconType="clear" // Hiển thị nút xóa khi có nội dung
          inputContainerStyle={styles.searchInput}
        />
      </View>

      {/* Danh sách nhà cung cấp */}
      <FlatList
        data={filteredSuppliers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.supplierItem}>
            <Image
              source={{ uri: 'https://via.placeholder.com/50' }} // Thay bằng hình ảnh thực tế nếu có
              style={styles.supplierImage}
            />
            <View style={styles.supplierDetails}>
              <DynamicText style={styles.supplierName}>{item.name}</DynamicText>
              <DynamicText style={styles.supplierPhone}>SĐT: {item.phone_number}</DynamicText>
              <DynamicText style={styles.supplierEmail}>Email: {item.email}</DynamicText>
              <DynamicText style={styles.supplierAddress}>Địa chỉ: {item.supplier_address}</DynamicText>
              <DynamicText
                style={[
                  styles.supplierStatus,
                  { color: item.status === 'Active' ? '#00C853' : '#D32F2F' },
                ]}
              >
                Trạng thái: {item.status}
              </DynamicText>
            </View>
          </View>
        )}
        contentContainerStyle={styles.listContainer}
      />
    </BaseLayout>
  );
};

// Định nghĩa styles
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
  supplierItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  supplierImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  supplierDetails: {
    flex: 1,
  },
  supplierName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  supplierPhone: {
    fontSize: 14,
    color: '#666',
  },
  supplierEmail: {
    fontSize: 14,
    color: '#666',
  },
  supplierAddress: {
    fontSize: 14,
    color: '#666',
  },
  supplierStatus: {
    fontSize: 14,
  },
});

export default SupplierScreen;