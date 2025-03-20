import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BaseLayout, Button, Header, DynamicText } from '../../../components';
import { scaledSize, scaleHeight } from '../../../utils';

const OrderConfirmationScreen = () => {
  const navigation = useNavigation();

  const handleExit = () => {
    navigation.goBack(); // Quay lại màn hình trước đó
  };

  const handlePrintBill = () => {
    console.log('In bill cho đơn hàng: #20250314-0004');
    // Thêm logic in bill tại đây (ví dụ: gọi API hoặc mở modal in)
  };

  return (
    <BaseLayout>
      {/* Header */}
      <Header
        title="Xác nhận đơn hàng"
        showBackIcon={false} // Không cần nút quay lại vì có nút "Thoát"
      />

      {/* Thông báo thành công */}
      <View style={styles.header}>
        <DynamicText style={styles.successText}>✓ Thanh toán thành công</DynamicText>
      </View>

      {/* Thông tin đơn hàng */}
      <View style={styles.orderCard}>
        <DynamicText style={styles.orderId}>Đơn hàng: #20250314-0004</DynamicText>
        <View style={styles.productInfo}>
          <DynamicText style={styles.productName}>MacBook Pro 2023 14 inch</DynamicText>
          <DynamicText style={styles.productPrice}>30,000,000 đ</DynamicText>
        </View>
        <View style={styles.details}>
          <DynamicText style={styles.detailText}>Mã đơn: #ICM901</DynamicText>
          <DynamicText style={styles.detailText}>Thời gian: 14/03/2025 09:41</DynamicText>
          <DynamicText style={styles.detailText}>Mô tả: Thanh toán qua thẻ</DynamicText>
          <DynamicText style={styles.detailText}>Khách hàng: Nguyễn Văn A</DynamicText>
          <DynamicText style={styles.detailText}>Số điện thoại: 0909123456</DynamicText>
          <DynamicText style={styles.detailText}>Địa chỉ: 123 Đường ABC, TP.HCM</DynamicText>
        </View>
      </View>

      {/* Nút Thoát và In Bill */}
      <View style={styles.buttonContainer}>
        <Button
          title="Thoát"
          onPress={handleExit}
          buttonContainerStyle={styles.button}
          titleStyle={styles.buttonText}
        />
        <Button
          title="In Bill"
          onPress={handlePrintBill}
          buttonContainerStyle={styles.button}
          titleStyle={styles.buttonText}
        />
      </View>
    </BaseLayout>
  );
};

// Styles
const styles = StyleSheet.create({
  header: {
    backgroundColor: '#e5e5e5',
    padding: scaledSize(20),
    alignItems: 'center',
  },
  successText: {
    color: '#28a745',
    fontSize: scaledSize(20),
    fontWeight: 'bold',
  },
  orderCard: {
    backgroundColor: '#fff',
    width: '90%',
    padding: scaledSize(15),
    borderRadius: 10,
    marginTop: scaleHeight(20),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderId: {
    fontSize: scaledSize(16),
    color: '#333',
    marginBottom: scaleHeight(10),
  },
  productInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scaleHeight(10),
  },
  productName: {
    fontSize: scaledSize(16),
    color: '#333',
  },
  productPrice: {
    fontSize: scaledSize(16),
    color: '#28a745',
    fontWeight: 'bold',
  },
  details: {
    marginTop: scaleHeight(10),
  },
  detailText: {
    fontSize: scaledSize(14),
    color: '#666',
    marginVertical: scaleHeight(2),
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '90%',
    marginTop: scaleHeight(20),
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: scaledSize(10),
    paddingHorizontal: scaledSize(20),
    borderRadius: 10,
    alignItems: 'center',
    width: '45%',
  },
  buttonText: {
    color: '#fff',
    fontSize: scaledSize(16),
    fontWeight: 'bold',
  },
});

export default OrderConfirmationScreen;