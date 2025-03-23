import React from 'react';
import { View, Text, Image, TouchableOpacity ,StyleSheet } from 'react-native';

import Icon from 'react-native-vector-icons/Ionicons';
import { BaseLayout, Button, Input,Header } from '../../../components';
import {useNavigation} from '@react-navigation/native';

const CreateOrderScreen = () => {
  const navigation = useNavigation();
  
  return (
    <BaseLayout>
      {/* Header */}
      <Header
              title="Tạo đơn hàng"
              showBackIcon
              onPressBack={() => navigation.goBack()}
            />

      {/* Product Info */}
      <View style={styles.productContainer}>
        <Image
          source={{ uri: 'https://via.placeholder.com/80' }}
          style={styles.productImage}
        />
        <View style={styles.productDetails}>
          <Text style={styles.productName}>MacBook Pro 2023 14 inch</Text>
          <Text style={styles.productConfig}>38.000.000đ</Text>
          <Text style={styles.productQuantity}>Số lượng: 1</Text>
        </View>
        <TouchableOpacity>
          <Icon name="close-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Order Details */}
      <View style={styles.orderDetails}>
        {/* Số lượng */}
        <View style={styles.inputRow}>
          <Text style={styles.label}>Số lượng</Text>
          <Text style={styles.value}>1</Text>
        </View>

        {/* Tình trạng */}
        <View style={styles.inputRow}>
          <Text style={styles.label}>Tình trạng</Text>
          <Text style={styles.value}>38.000.000đ</Text>
        </View>

        {/* Ghi chú */}
        <View style={styles.inputRow}>
          <Text style={styles.label}>Ghi chú</Text>
          <Input
            placeholderText="Nhập ghi chú"
            multiline
            numberOfLines={3}
            inputContainerStyle={styles.textArea}
          />
        </View>
      </View>

      {/* Total */}
      <View style={styles.totalContainer}>
        <Text style={styles.totalLabel}>Tổng số dư nợ</Text>
        <Text style={styles.totalValue}>38.000.000đ</Text>
      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <Button
          title="Lưu nháp"
          buttonContainerStyle={styles.draftButton}
          titleStyle={styles.draftButtonText}
        />
        <Button
          title="Tạo đơn"
          buttonContainerStyle={styles.createButton}
          titleStyle={styles.createButtonText}
        />
      </View>
    </BaseLayout>
  );
};

// Styles
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
  productContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  productConfig: {
    fontSize: 14,
    color: '#000',
    marginVertical: 4,
  },
  productQuantity: {
    fontSize: 14,
    color: '#666',
  },
  orderDetails: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  inputRow: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  value: {
    fontSize: 16,
    color: '#000',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  draftButton: {
    flex: 1,
    backgroundColor: '#ddd',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  draftButtonText: {
    fontSize: 16,
    color: '#000',
  },
  createButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  createButtonText: {
    fontSize: 16,
    color: '#fff',
  },
});

export default CreateOrderScreen;