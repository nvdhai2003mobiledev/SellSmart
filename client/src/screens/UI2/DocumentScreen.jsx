import React, { useState } from 'react';
import { View, FlatList, Image, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { BaseLayout, Input, Header, DynamicText } from '../../components';
import { scaledSize, scaleHeight } from '../../utils';

const DocumentScreen = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');

  // Dữ liệu mẫu cho danh sách tài liệu
  const documents = [
    { id: '1', title: 'Hướng dẫn sử dụng MacBook Pro 2023', description: 'Tài liệu chi tiết về cách sử dụng MacBook Pro 2023', date: '2023-01-15' },
    { id: '2', title: 'Thông số kỹ thuật MacBook Pro 2023', description: 'Thông số kỹ thuật chi tiết của MacBook Pro 2023', date: '2023-02-10' },
    { id: '3', title: 'Bảo hành MacBook Pro 2023', description: 'Chính sách bảo hành cho MacBook Pro 2023', date: '2023-03-20' },
    { id: '4', title: 'Cập nhật phần mềm MacBook Pro 2023', description: 'Hướng dẫn cập nhật phần mềm cho MacBook Pro 2023', date: '2023-05-01' },
  ];

  // Lọc danh sách tài liệu dựa trên searchQuery
  const filteredDocuments = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <BaseLayout>
      {/* Header */}
      <Header
        title="Tất cả tài liệu"
        showBackIcon={true}
        onPressBack={() => navigation.goBack()}
      />

      {/* Thanh tìm kiếm */}
      <View style={styles.searchContainer}>
        <Input
          placeholderText="Nhập tên/mã tài liệu"
          onChangeText={setSearchQuery}
          value={searchQuery}
          iconType="clear" // Hiển thị nút xóa khi có nội dung
          inputContainerStyle={styles.searchInput}
        />
      </View>

      {/* Danh sách tài liệu */}
      <FlatList
        data={filteredDocuments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.documentItem}>
            <Image
              source={{ uri: 'https://via.placeholder.com/50' }} // Thay bằng đường dẫn thực tế từ trường `media`
              style={styles.documentImage}
            />
            <View style={styles.documentDetails}>
              <DynamicText style={styles.documentTitle}>{item.title}</DynamicText>
              <DynamicText style={styles.documentDescription}>{item.description}</DynamicText>
              <DynamicText style={styles.documentDate}>Ngày: {item.date}</DynamicText>
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
    marginBottom: scaleHeight(16),
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: scaledSize(12),
  },
  listContainer: {
    paddingBottom: scaleHeight(16),
  },
  documentItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: scaledSize(12),
    marginBottom: scaleHeight(12),
    alignItems: 'center',
  },
  documentImage: {
    width: scaledSize(50),
    height: scaledSize(50),
    borderRadius: 8,
    marginRight: scaledSize(12),
  },
  documentDetails: {
    flex: 1,
  },
  documentTitle: {
    fontSize: scaledSize(16),
    fontWeight: 'bold',
    color: '#000',
  },
  documentDescription: {
    fontSize: scaledSize(14),
    color: '#666',
  },
  documentDate: {
    fontSize: scaledSize(14),
    color: '#666',
  },
});

export default DocumentScreen;