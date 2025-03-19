import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Controller, useForm } from 'react-hook-form';
import { useNavigation } from '@react-navigation/native';
import { BaseLayout, Button, Input, Header, DynamicText } from '../../../components';
import { color, scaleHeight, scaledSize } from '../../../utils';

const CreateOrderScreen = () => {
  const navigation = useNavigation();

  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      quantity: '1',
      condition: '38.000.000đ',
      note: '',
    },
  });

  const onSaveDraft = (data: any) => {
    console.log('Lưu nháp:', data);
    // Thêm logic lưu nháp vào đây (ví dụ: gửi API)
  };

  const onCreateOrder = (data: any) => {
    console.log('Tạo đơn:', data);
    // Thêm logic tạo đơn hàng vào đây (ví dụ: gửi API)
  };

  return (
    <BaseLayout>
      {/* Header */}
      <Header
        title="Tạo đơn hàng"
        showBackIcon={true}
        onPressBack={() => navigation.goBack()}
      />

      {/* Product Info */}
      <View style={styles.productContainer}>
        <Image
          source={{ uri: 'https://via.placeholder.com/80' }}
          style={styles.productImage}
        />
        <View style={styles.productDetails}>
          <DynamicText style={styles.productName}>MacBook Pro 2023 14 inch</DynamicText>
          <DynamicText style={styles.productConfig}>38.000.000đ</DynamicText>
          <DynamicText style={styles.productQuantity}>Số lượng: 1</DynamicText>
        </View>
        <TouchableOpacity>
          <Icon name="close-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Order Details */}
      <View style={styles.orderDetails}>
        {/* Số lượng */}
        <View style={styles.inputRow}>
          <DynamicText style={styles.label}>Số lượng</DynamicText>
          <Controller
            control={control}
            name="quantity"
            rules={{ required: 'Số lượng là bắt buộc' }}
            render={({ field: { onChange, value } }) => (
              <Input
                placeholderText="Nhập số lượng"
                keyboardType="numeric"
                onChangeText={onChange}
                value={value}
                inputContainerStyle={styles.inputField}
              />
            )}
          />
          {errors.quantity && (
            <DynamicText style={styles.errorText}>{errors.quantity.message}</DynamicText>
          )}
        </View>

        {/* Tình trạng */}
        <View style={styles.inputRow}>
          <DynamicText style={styles.label}>Tình trạng</DynamicText>
          <Controller
            control={control}
            name="condition"
            rules={{ required: 'Tình trạng là bắt buộc' }}
            render={({ field: { onChange, value } }) => (
              <Input
                placeholderText="Nhập tình trạng"
                onChangeText={onChange}
                value={value}
                inputContainerStyle={styles.inputField}
              />
            )}
          />
          {errors.condition && (
            <DynamicText style={styles.errorText}>{errors.condition.message}</DynamicText>
          )}
        </View>

        {/* Ghi chú */}
        <View style={styles.inputRow}>
          <DynamicText style={styles.label}>Ghi chú</DynamicText>
          <Controller
            control={control}
            name="note"
            render={({ field: { onChange, value } }) => (
              <Input
                placeholderText="Nhập ghi chú"
                multiline
                numberOfLines={3}
                onChangeText={onChange}
                value={value}
                inputContainerStyle={styles.textArea}
              />
            )}
          />
        </View>
      </View>

      {/* Total */}
      <View style={styles.totalContainer}>
        <DynamicText style={styles.totalLabel}>Tổng số dư nợ</DynamicText>
        <DynamicText style={styles.totalValue}>38.000.000đ</DynamicText>
      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <Button
          title="Lưu nháp"
          onPress={handleSubmit(onSaveDraft)}
          buttonContainerStyle={styles.draftButton}
          titleStyle={styles.draftButtonText}
        />
        <Button
          title="Tạo đơn"
          onPress={handleSubmit(onCreateOrder)}
          buttonContainerStyle={styles.createButton}
          titleStyle={styles.createButtonText}
        />
      </View>
    </BaseLayout>
  );
};

// Styles
const styles = StyleSheet.create({
  productContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: scaledSize(12),
    marginBottom: scaleHeight(16),
    alignItems: 'center',
  },
  productImage: {
    width: scaledSize(80),
    height: scaledSize(80),
    borderRadius: 8,
    marginRight: scaledSize(12),
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: scaledSize(16),
    fontWeight: 'bold',
    color: '#000',
  },
  productConfig: {
    fontSize: scaledSize(14),
    color: '#000',
    marginVertical: scaleHeight(4),
  },
  productQuantity: {
    fontSize: scaledSize(14),
    color: '#666',
  },
  orderDetails: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: scaledSize(16),
    marginBottom: scaleHeight(16),
  },
  inputRow: {
    marginBottom: scaleHeight(16),
  },
  label: {
    fontSize: scaledSize(16),
    fontWeight: 'bold',
    color: '#000',
    marginBottom: scaleHeight(8),
  },
  inputField: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: scaledSize(8),
    fontSize: scaledSize(16),
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: scaledSize(8),
    fontSize: scaledSize(16),
    textAlignVertical: 'top',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: scaledSize(16),
    marginBottom: scaleHeight(16),
  },
  totalLabel: {
    fontSize: scaledSize(16),
    fontWeight: 'bold',
    color: '#000',
  },
  totalValue: {
    fontSize: scaledSize(16),
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
    paddingVertical: scaledSize(12),
    borderRadius: 8,
    alignItems: 'center',
    marginRight: scaledSize(8),
  },
  draftButtonText: {
    fontSize: scaledSize(16),
    color: '#000',
  },
  createButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: scaledSize(12),
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: scaledSize(8),
  },
  createButtonText: {
    fontSize: scaledSize(16),
    color: '#fff',
  },
  errorText: {
    color: color.accentColor.errorColor,
    marginTop: scaleHeight(5),
  },
});

export default CreateOrderScreen;