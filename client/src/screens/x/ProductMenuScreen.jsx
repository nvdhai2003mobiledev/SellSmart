import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons'; // Sử dụng icon từ react-native-vector-icons

const ProductMenuScreen = () => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <Icon name="chevron-back-outline" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sản phẩm</Text>
        <View style={{ width: 24 }} /> {/* Placeholder để cân đối */}
      </View>

      {/* Nút Thêm sản phẩm */}
      <TouchableOpacity style={styles.addButton}>
        <Icon name="add-outline" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Các tùy chọn menu */}
      <View style={styles.menuContainer}>
        <TouchableOpacity style={styles.menuItem}>
          <Icon name="cube-outline" size={24} color="#007AFF" />
          <Text style={styles.menuItemText}>Sản phẩm</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Icon name="home-outline" size={24} color="#007AFF" />
          <Text style={styles.menuItemText}>Tồn kho</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Icon name="log-in-outline" size={24} color="#007AFF" />
          <Text style={styles.menuItemText}>Nhập hàng</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Icon name="build-outline" size={24} color="#007AFF" />
          <Text style={styles.menuItemText}>Chuẩn hóa</Text>
        </TouchableOpacity>
      </View>
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
  addButton: {
    backgroundColor: '#007AFF',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginVertical: 16,
    elevation: 4, // Shadow cho Android
    shadowColor: '#000', // Shadow cho iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  menuContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: '#000',
    marginLeft: 12,
  },
});

export default ProductMenuScreen;