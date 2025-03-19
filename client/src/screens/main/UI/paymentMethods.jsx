import React, { useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { BaseLayout, Button, Header, DynamicText } from '../../../components';
import { scaledSize, scaleHeight } from '../../../utils';

const PaymentScreen = () => {
  const navigation = useNavigation();
  const [selectedMethod, setSelectedMethod] = useState('Thanh toán bằng tiền mặt');

  const paymentMethods = [
    'Thanh toán bằng tiền mặt',
    'Chuyển khoản ngân hàng',
    'Ví điện tử',
  ];

  const handleContinue = () => {
    console.log('Phương thức thanh toán đã chọn:', selectedMethod);
    // Thêm logic điều hướng hoặc xử lý thanh toán tại đây
    // Ví dụ: navigation.navigate('NextScreen', { paymentMethod: selectedMethod });
  };

  return (
    <BaseLayout>
      {/* Header */}
      <Header
        title="Thanh toán"
        showBackIcon={true}
        onPressBack={() => navigation.goBack()}
      />

      {/* Nội dung chính */}
      <View style={styles.card}>
        {/* Thông tin sản phẩm */}
        <View style={styles.productCard}>
          <Image
            source={{ uri: 'https://via.placeholder.com/50' }}
            style={styles.productImage}
          />
          <View style={styles.productInfo}>
            <DynamicText style={styles.productName}>MacBook Pro 2023 14 inch</DynamicText>
            <DynamicText style={styles.productDetails}>Màu: Đen, 16GB RAM, 512GB SSD</DynamicText>
            <DynamicText style={styles.productPrice}>30,000,000 đ</DynamicText>
          </View>
        </View>

        {/* Phương thức thanh toán */}
        <View style={styles.paymentMethods}>
          <DynamicText style={styles.sectionTitle}>Phương thức thanh toán</DynamicText>
          {paymentMethods.map((method) => (
            <Button
              key={method}
              title={method}
              buttonContainerStyle={styles.methodOption}
              titleStyle={styles.methodText}
              Icon={
                <View style={styles.radioCircle}>
                  {selectedMethod === method && <View style={styles.selectedRadio} />}
                </View>
              }
              onPress={() => setSelectedMethod(method)}
            />
          ))}
        </View>

        {/* Tổng tiền và nút Tiếp tục */}
        <View style={styles.footer}>
          <View style={styles.totalContainer}>
            <DynamicText style={styles.totalLabel}>Tổng tiền</DynamicText>
            <DynamicText style={styles.totalPrice}>30,000,000 đ</DynamicText>
          </View>
          <Button
            title="Tiếp tục"
            onPress={handleContinue}
            buttonContainerStyle={styles.continueButton}
            titleStyle={styles.buttonText}
          />
        </View>
      </View>
    </BaseLayout>
  );
};

// Styles
const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: scaledSize(20),
    borderTopRightRadius: scaledSize(20),
    marginTop: scaleHeight(10),
    overflow: 'hidden',
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: scaledSize(15),
    marginTop: scaleHeight(10),
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  productImage: {
    width: scaledSize(50),
    height: scaledSize(50),
    marginRight: scaledSize(15),
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: scaledSize(16),
    color: '#333',
  },
  productDetails: {
    fontSize: scaledSize(14),
    color: '#666',
    marginTop: scaleHeight(5),
  },
  productPrice: {
    fontSize: scaledSize(16),
    color: '#ff0000',
    marginTop: scaleHeight(5),
  },
  paymentMethods: {
    backgroundColor: '#fff',
    padding: scaledSize(15),
    marginTop: scaleHeight(10),
  },
  sectionTitle: {
    fontSize: scaledSize(16),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: scaleHeight(15),
  },
  methodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scaledSize(10),
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  radioCircle: {
    height: scaledSize(20),
    width: scaledSize(20),
    borderRadius: scaledSize(10),
    borderWidth: 2,
    borderColor: '#007bff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scaledSize(10),
  },
  selectedRadio: {
    width: scaledSize(10),
    height: scaledSize(10),
    borderRadius: scaledSize(5),
    backgroundColor: '#007bff',
  },
  methodText: {
    fontSize: scaledSize(16),
    color: '#333',
  },
  footer: {
    padding: scaledSize(15),
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scaleHeight(15),
  },
  totalLabel: {
    fontSize: scaledSize(16),
    color: '#333',
  },
  totalPrice: {
    fontSize: scaledSize(16),
    color: '#ff0000',
  },
  continueButton: {
    paddingVertical: scaledSize(12),
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#007bff',
  },
  buttonText: {
    color: '#fff',
    fontSize: scaledSize(16),
    fontWeight: 'bold',
  },
});

export default PaymentScreen;