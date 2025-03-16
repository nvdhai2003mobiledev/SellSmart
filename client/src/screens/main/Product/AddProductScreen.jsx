import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { BaseLayout, Button, DynamicText, Header, Input } from '../../../components';

const AddProductScreen = () => {
  return (
    <BaseLayout>
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
        <Input placeholderText="Tên sản phẩm" />
        <Input placeholderText="Mã sản phẩm" />
        <Input placeholderText="barcode" />

        <Input
          placeholderText="Đơn vị tính"
          iconType="custom"
          EndIcon={<Icon name="chevron-down-outline" size={20} color="#666" style={styles.inputIcon} />}
          onIconPress={() => {}}
        />
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
        <Input placeholderText="Giá bán" />
        <Input placeholderText="Giá vốn" />
        {/* <TextInput
          style={styles.input}
          placeholder="Lợi nhuận"
          placeholderColor="#666"
          value="0đ"
          editable={false}
        /> */}
      </View>

      {/* Thuộc tính */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thuộc tính</Text>
        <Input placeholderText="Tính chất" />
        <Input placeholderText="Giá trị" />
      </View>

      {/* Nút Lưu */}
      <Button title="Lưu" />
    </BaseLayout>
  );
};

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
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000',
    marginBottom: 12,
  },
  profitText: {
    color: '#ff4444',
  },
});

export default AddProductScreen;