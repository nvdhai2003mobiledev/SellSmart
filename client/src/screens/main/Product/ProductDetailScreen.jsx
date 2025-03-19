import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { BaseLayout, Button, DynamicText, Header } from '../../../components';
import { scaleHeight } from '../../../utils';

const ProductDetailScreen = () => {
  const navigation = useNavigation();

  const onSubmit = () => {
    console.log('Lưu chi tiết sản phẩm');
    // Thêm logic lưu dữ liệu vào đây (ví dụ: gửi API)
  };

  return (
    <BaseLayout>
      {/* Header */}
      <Header
        title="Chi tiết sản phẩm"
        showBackIcon={true}
        onPressBack={() => navigation.goBack()}
      />

      {/* Thông tin cơ bản */}
      <View style={styles.basicInfoContainer}>
        <DynamicText style={styles.productName}>MacBook Pro 14 2023</DynamicText>
        <View style={styles.codeContainer}>
          <DynamicText style={styles.productCode}>ST245</DynamicText>
          <TouchableOpacity>
            <Icon name="pencil-outline" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Ảnh sản phẩm */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: 'https://via.placeholder.com/200' }}
          style={styles.productImage}
        />
        <TouchableOpacity style={styles.addButton}>
          <Icon name="add-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Giá tiền */}
      <View style={styles.priceContainer}>
        <View style={styles.priceItem}>
          <DynamicText style={styles.priceLabel}>Giá bán</DynamicText>
          <DynamicText style={styles.priceValue}>30.900.000đ</DynamicText>
        </View>
        <View style={styles.priceItem}>
          <DynamicText style={styles.priceLabel}>Lợi nhuận</DynamicText>
          <DynamicText style={styles.priceValue}>2.000.000đ</DynamicText>
        </View>
        <View style={styles.priceItem}>
          <DynamicText style={styles.priceLabel}>Giá nhập</DynamicText>
          <DynamicText style={styles.priceValue}>28.900.000đ</DynamicText>
        </View>
      </View>

      {/* Thông tin cấu hình */}
      <View style={styles.configContainer}>
        <View style={styles.configItem}>
          <Image
            source={{ uri: 'https://via.placeholder.com/50' }}
            style={styles.configIcon}
          />
          <DynamicText style={styles.configText}>16GB RAM</DynamicText>
          <DynamicText style={styles.configPrice}>30.900.000đ</DynamicText>
        </View>
        <View style={styles.configItem}>
          <Image
            source={{ uri: 'https://via.placeholder.com/50' }}
            style={styles.configIcon}
          />
          <DynamicText style={styles.configText}>32GB RAM</DynamicText>
          <DynamicText style={styles.configPrice}>38.900.000đ</DynamicText>
        </View>
        <View style={styles.configItem}>
          <Image
            source={{ uri: 'https://via.placeholder.com/50' }}
            style={styles.configIcon}
          />
          <DynamicText style={styles.configText}>1TB</DynamicText>
          <DynamicText style={styles.configPrice}>Còn hàng: 10</DynamicText>
        </View>
        <View style={styles.configItem}>
          <Image
            source={{ uri: 'https://via.placeholder.com/50' }}
            style={styles.configIcon}
          />
          <DynamicText style={styles.configText}>512GB</DynamicText>
          <DynamicText style={styles.configPrice}>Còn hàng: 8</DynamicText>
        </View>
      </View>

      {/* Nút Lưu */}
      <Button
        title="Lưu"
        onPress={onSubmit}
        buttonContainerStyle={styles.saveButton}
        titleStyle={styles.saveButtonText}
      />
    </BaseLayout>
  );
};

// Styles
const styles = StyleSheet.create({
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
    marginBottom: scaleHeight(20),
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ProductDetailScreen;