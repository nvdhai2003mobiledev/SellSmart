import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons'; // Sử dụng icon từ react-native-vector-icons

const AddProductScreen = () => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <Icon name="chevron-back-outline" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thêm sản phẩm</Text>
        <View style={{ width: 24 }} /> {/* Placeholder để cân đối */}
      </View>

      {/* Thông tin sản phẩm */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông tin sản phẩm</Text>
        <TextInput
          style={styles.input}
          placeholder="Tên sản phẩm"
          placeholderTextColor="#666"
        />
        <TextInput
          style={styles.input}
          placeholder="Mã sản phẩm"
          placeholderTextColor="#666"
        />
        <View style={styles.inputWithIcon}>
          <TextInput
            style={styles.input}
            placeholder="Đơn vị tính"
            placeholderTextColor="#666"
          />
          <Icon name="chevron-down-outline" size={20} color="#666" style={styles.inputIcon} />
        </View>
      </View>

      {/* Ảnh sản phẩm */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ảnh sản phẩm</Text>
        <View style={styles.imageButtons}>
          <TouchableOpacity style={styles.imageButton}>
            <Icon name="camera-outline" size={24} color="#007AFF" />
            <Text style={styles.imageButtonText}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.imageButton}>
            <Icon name="image-outline" size={24} color="#007AFF" />
            <Text style={styles.imageButtonText}>Tải hình liên quan</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Thông tin giá */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Giá sản phẩm</Text>
        <TextInput
          style={styles.input}
          placeholder="Giá bán"
          placeholderTextColor="#666"
        />
        <TextInput
          style={styles.input}
          placeholder="Giá vốn"
          placeholderTextColor="#666"
        />
        <TextInput
          style={styles.input}
          placeholder="Lợi nhuận"
          placeholderTextColor="#666"
          value="0đ"
          editable={false}
          placeholderStyle={styles.profitText}
        />
      </View>

      {/* Thuộc tính */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thuộc tính</Text>
        <TextInput
          style={styles.input}
          placeholder="Tính chất"
          placeholderTextColor="#666"
        />
        <TextInput
          style={styles.input}
          placeholder="Giá trị"
          placeholderTextColor="#666"
        />
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
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000',
    marginBottom: 12,
  },
  inputWithIcon: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    right: 12,
  },
  imageButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  imageButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  imageButtonText: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 8,
  },
  profitText: {
    color: '#ff4444', // Màu đỏ cho "Lợi nhuận"
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

export default AddProductScreen;