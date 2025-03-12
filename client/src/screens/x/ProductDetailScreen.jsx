import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons'; // Sử dụng icon từ react-native-vector-icons

const ProductDetailScreen = () => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <Icon name="chevron-back-outline" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết sản phẩm</Text>
        <View style={{ width: 24 }} /> {/* Placeholder để cân đối */}
      </View>

      {/* Thông tin cơ bản */}
      <View style={styles.basicInfoContainer}>
        <Text style={styles.productName}>MacBook Pro 14 2023</Text>
        <View style={styles.codeContainer}>
          <Text style={styles.productCode}>ST245</Text>
          <TouchableOpacity>
            <Icon name="pencil-outline" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Ảnh sản phẩm */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: 'https://via.placeholder.com/200' }} // Thay thế bằng URL hình ảnh MacBook nếu có
          style={styles.productImage}
        />
        <TouchableOpacity style={styles.addButton}>
          <Icon name="add-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Giá tiền */}
      <View style={styles.priceContainer}>
        <View style={styles.priceItem}>
          <Text style={styles.priceLabel}>Giá bán</Text>
          <Text style={styles.priceValue}>30.900.000đ</Text>
        </View>
        <View style={styles.priceItem}>
          <Text style={styles.priceLabel}>Lợi nhuận</Text>
          <Text style={styles.priceValue}>2.000.000đ</Text>
        </View>
        <View style={styles.priceItem}>
          <Text style={styles.priceLabel}>Giá nhập</Text>
          <Text style={styles.priceValue}>28.900.000đ</Text>
        </View>
      </View>

      {/* Thông tin cấu hình */}
      <View style={styles.configContainer}>
        <View style={styles.configItem}>
          <Image
            source={{ uri: 'https://via.placeholder.com/50' }} // Thay thế bằng icon RAM
            style={styles.configIcon}
          />
          <Text style={styles.configText}>16GB RAM</Text>
          <Text style={styles.configPrice}>30.900.000đ</Text>
        </View>
        <View style={styles.configItem}>
          <Image
            source={{ uri: 'https://via.placeholder.com/50' }} // Thay thế bằng icon RAM
            style={styles.configIcon}
          />
          <Text style={styles.configText}>32GB RAM</Text>
          <Text style={styles.configPrice}>38.900.000đ</Text>
        </View>
        <View style={styles.configItem}>
          <Image
            source={{ uri: 'https://via.placeholder.com/50' }} // Thay thế bằng icon Storage
            style={styles.configIcon}
          />
          <Text style={styles.configText}>1TB</Text>
          <Text style={styles.configPrice}>Còn hàng: 10</Text>
        </View>
        <View style={styles.configItem}>
          <Image
            source={{ uri: 'https://via.placeholder.com/50' }} // Thay thế bằng icon Storage
            style={styles.configIcon}
          />
          <Text style={styles.configText}>512GB</Text>
          <Text style={styles.configPrice}>Còn hàng: 8</Text>
        </View>
      </View>

      {/* Nút Lưu */}
      <TouchableOpacity style={styles.saveButton}>
        <Text style={styles.saveButtonText}>Lưu</Text>
      </TouchableOpacity>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
  },
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
  basicInfoContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  productCode: {
    fontSize: 16,
    color: '#666',
  },
  imageContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    position: 'relative',
  },
  productImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
  },
  addButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#007AFF',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  priceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 16,
    color: '#666',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  configContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  configItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  configIcon: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  configText: {
    fontSize: 16,
    color: '#000',
    flex: 1,
    marginLeft: 12,
  },
  configPrice: {
    fontSize: 16,
    color: '#000',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ProductDetailScreen;