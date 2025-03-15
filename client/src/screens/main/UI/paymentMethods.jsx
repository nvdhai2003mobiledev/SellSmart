import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { BaseLayout, Button } from '../../../components';

const PaymentScreen = () => {
  const [selectedMethod, setSelectedMethod] = useState('Thanh toán bằng tiền mặt');

  const paymentMethods = [
    'Thanh toán bằng tiền mặt',
    'Chuyển khoản ngân hàng',
    'Ví điện tử',
  ];

  return (
    <BaseLayout>
      {/* Nội dung chính trong card trắng với bo góc */}
      <View style={styles.card}>
        {/* Tiêu đề */}
        <View style={styles.header}>
          {/* <Button
            Icon={<Ionicons name="arrow-back" size={24} color="#333" />}
            buttonContainerStyle={styles.backButton}
          /> */}
          <Text style={styles.headerText}>Thanh toán</Text>
        </View>

        {/* Thông tin sản phẩm */}
        <View style={styles.productCard}>
          <Image
            source={{ uri: 'https://via.placeholder.com/50' }}
            style={styles.productImage}
          />
          <View style={styles.productInfo}>
            <Text style={styles.productName}>MacBook Pro 2023 14 inch</Text>
            <Text style={styles.productDetails}>Màu: Đen, 16GB RAM, 512GB SSD</Text>
            <Text style={styles.productPrice}>30,000,000 đ</Text>
          </View>
        </View>

        {/* Phương thức thanh toán */}
        <View style={styles.paymentMethods}>
          <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
          {paymentMethods.map((method) => (
            <Button
              key={method}
              title={method}
              buttonContainerStyle={[styles.methodOption, styles.whiteButton]}
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
            <Text style={styles.totalLabel}>Tổng tiền</Text>
            <Text style={styles.totalPrice}>30,000,000 đ</Text>
          </View>
          <Button
            title="Tiếp tục"
            buttonContainerStyle={[styles.continueButton, styles.whiteButton, styles.continueButtonPosition]}
            titleStyle={[styles.buttonText, styles.whiteButtonText]}
          />
        </View>
      </View>
    </BaseLayout>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 10,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
  },
  backButton: {
    padding: 5,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  headerText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  productImage: {
    width: 50,
    height: 50,
    marginRight: 15,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 16,
    color: '#333',
  },
  productDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  productPrice: {
    fontSize: 16,
    color: '#ff0000',
    marginTop: 5,
  },
  paymentMethods: {
    backgroundColor: '#fff',
    padding: 15,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  methodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  whiteButton: {
    backgroundColor: '#fff', // Đổi màu nền thành trắng
    borderWidth: 1, // Thêm viền
    borderColor: '#007bff', // Viền màu xanh dương
  },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#007bff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  selectedRadio: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007bff',
  },
  methodText: {
    fontSize: 16,
    color: '#333',
  },
  footer: {
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  totalLabel: {
    fontSize: 16,
    color: '#333',
  },
  totalPrice: {
    fontSize: 16,
    color: '#ff0000',
  },
  continueButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  continueButtonPosition: {
    alignSelf: 'flex-end',
    width: '40%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  whiteButtonText: {
    color: '#007bff', // Đổi màu chữ thành xanh dương trên nền trắng
  },
});

export default PaymentScreen;