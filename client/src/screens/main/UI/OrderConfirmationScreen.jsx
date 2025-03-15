import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BaseLayout, Button } from '../../../components';

const OrderConfirmationScreen = () => {
  return (
    <BaseLayout>
      {/* Tiêu đề */}
      <View style={styles.header}>
        <Text style={styles.successText}>✓ Thanh toán thành công</Text>
      </View>

      {/* Thông tin đơn hàng */}
      <View style={styles.orderCard}>
        <Text style={styles.orderId}>Đơn hàng: #20250314-0004</Text>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>MacBook Pro 2023 14 inch</Text>
          <Text style={styles.productPrice}>30,000,000 đ</Text>
        </View>
        <View style={styles.details}>
          <Text style={styles.detailText}>Mã đơn: #ICM901</Text>
          <Text style={styles.detailText}>Thời gian: 14/03/2025 09:41</Text>
          <Text style={styles.detailText}>Mô tả: Thanh toán qua thẻ</Text>
          <Text style={styles.detailText}>Khách hàng: Nguyễn Văn A</Text>
          <Text style={styles.detailText}>Số điện thoại: 0909123456</Text>
          <Text style={styles.detailText}>Địa chỉ: 123 Đường ABC, TP.HCM</Text>
        </View>
      </View>

      {/* Nút Thoát và In Bill */}
      <View style={styles.buttonContainer}>
        <Button
          title="Thoát"
          buttonContainerStyle={styles.button}
          titleStyle={styles.buttonText}
        />
        <Button
          title="In Bill"
          buttonContainerStyle={styles.button}
          titleStyle={styles.buttonText}
        />
      </View>
    </BaseLayout>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#e5e5e5',
    padding: 20,
    alignItems: 'center',
  },
  successText: {
    color: '#28a745',
    fontSize: 20,
    fontWeight: 'bold',
  },
  orderCard: {
    backgroundColor: '#fff',
    width: '90%',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderId: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  productInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  productName: {
    fontSize: 16,
    color: '#333',
  },
  productPrice: {
    fontSize: 16,
    color: '#28a745',
    fontWeight: 'bold',
  },
  details: {
    marginTop: 10,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginVertical: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '90%',
    marginTop: 20,
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: '45%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default OrderConfirmationScreen;