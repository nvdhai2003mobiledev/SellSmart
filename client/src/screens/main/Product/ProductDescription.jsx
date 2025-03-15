import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { BaseLayout, Input, Button } from '../../../components';

const ProductDescription = () => {
  return (
    <BaseLayout>
      {/* Tiêu đề */}
      <View style={styles.header}>
        <Text style={styles.headerText}>MÔ TẢ SẢN PHẨM</Text>
      </View>

      {/* Thanh công cụ định dạng */}
      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="arrow-forward" size={24} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="text" size={24} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="list" size={24} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="link" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Ô nhập liệu */}
      <Input
        placeholderText="Nhập nội dung"
        inputContainerStyle={styles.textInput}
        multiline
      />

      {/* Nút Lưu */}
      <Button
        title="LƯU"
        buttonContainerStyle={styles.saveButton}
        titleStyle={styles.saveButtonText}
      />
    </BaseLayout>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#333',
    padding: 15,
    alignItems: 'center',
  },
  headerText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  toolbar: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    padding: 10,
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  iconButton: {
    padding: 5,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#007bff',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProductDescription;