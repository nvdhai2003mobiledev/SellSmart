import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { BaseLayout, DynamicText } from '../../../components';
import { scaledSize } from '../../../utils';

const ProductMenuScreen = () => {
  const navigation = useNavigation();

  return (
    <BaseLayout style={styles.container}>
      <DynamicText style={styles.title}>Sản phẩm</DynamicText>

      <TouchableOpacity
        style={styles.addProductButton}
        onPress={() => navigation.navigate('AddProductScreen')} // Giả định có màn AddProductScreen
      >
        <Icon name="plus-circle" size={24} color="#007AFF" />
        <DynamicText style={styles.addProductText}>Thêm sản phẩm</DynamicText>
      </TouchableOpacity>

      <View style={styles.gridContainer}>
        <TouchableOpacity
          style={styles.gridItem}
          onPress={() => navigation.navigate('ProductListScreen')} // Giả định có màn ProductListScreen
        >
          <Icon name="package" size={24} color="#007AFF" />
          <DynamicText style={styles.gridText}>Sản phẩm</DynamicText>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.gridItem}
          onPress={() => navigation.navigate('InventoryScreen')} // Giả định có màn InventoryScreen
        >
          <Icon name="lock" size={24} color="#007AFF" />
          <DynamicText style={styles.gridText}>Tồn kho</DynamicText>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.gridItem}
          onPress={() => navigation.navigate('ImportScreen')} // Giả định có màn ImportScreen
        >
          <Icon name="truck" size={24} color="#007AFF" />
          <DynamicText style={styles.gridText}>Nhập hàng</DynamicText>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.gridItem}
          onPress={() => navigation.navigate('TransferScreen')} // Giả định có màn TransferScreen
        >
          <Icon name="shuffle" size={24} color="#007AFF" />
          <DynamicText style={styles.gridText}>Chuyển kho</DynamicText>
        </TouchableOpacity>
      </View>
    </BaseLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: scaledSize(20),
    alignItems: 'center',
  },
  title: {
    fontSize: scaledSize(18),
    fontWeight: '600',
    marginBottom: scaledSize(20),
  },
  addProductButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    padding: scaledSize(10),
    width: '80%',
    justifyContent: 'center',
    marginBottom: scaledSize(20),
  },
  addProductText: {
    marginLeft: scaledSize(10),
    color: '#007AFF',
    fontSize: scaledSize(16),
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  gridItem: {
    width: '40%',
    aspectRatio: 1,
    backgroundColor: '#F7F7F7',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  gridText: {
    marginTop: scaledSize(5),
    fontSize: scaledSize(14),
    color: '#007AFF',
    fontWeight: '500',
  },
});

export default ProductMenuScreen;
