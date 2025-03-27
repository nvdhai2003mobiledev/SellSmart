import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Controller, useForm } from 'react-hook-form';
import { useNavigation } from '@react-navigation/native';
import { BaseLayout, Button, DynamicText, Header, Input } from '../../../components';
import { color, moderateScale, scaledSize, scaleHeight } from '../../../utils';

const AddProductScreen = () => {
  const navigation = useNavigation();

  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      productName: '',
      productCode: '',
      barcode: '',
      unit: '',
      sellingPrice: '',
      costPrice: '',
      property: '',
      propertyValue: '',
    },
  });

  const onSubmit = (data: any) => {
    console.log('Dữ liệu sản phẩm:', data);
    // Thêm logic lưu dữ liệu vào đây (ví dụ: gửi API)
  };

  return (
    <BaseLayout>
      {/* Header */}
      <Header
        title="Thêm sản phẩm"
        showBackIcon={true}
        onPressBack={() => navigation.goBack()}
      />

      {/* Thông tin sản phẩm */}
      <View style={styles.section}>
        <DynamicText style={styles.sectionTitle}>Thông tin sản phẩm</DynamicText>
        <View style={styles.inputContainer}>
          <Controller
            control={control}
            name="productName"
            rules={{ required: 'Tên sản phẩm là bắt buộc' }}
            render={({ field: { onChange, value } }) => (
              <Input placeholderText="Tên sản phẩm" onChangeText={onChange} value={value} />
            )}
          />
          {errors.productName && (
            <DynamicText style={styles.errorText}>{errors.productName.message}</DynamicText>
          )}
        </View>
        <View style={styles.inputContainer}>
          <Controller
            control={control}
            name="productCode"
            rules={{ required: 'Mã sản phẩm là bắt buộc' }}
            render={({ field: { onChange, value } }) => (
              <Input placeholderText="Mã sản phẩm" onChangeText={onChange} value={value} />
            )}
          />
          {errors.productCode && (
            <DynamicText style={styles.errorText}>{errors.productCode.message}</DynamicText>
          )}
        </View>
        <View style={styles.inputContainer}>
          <Controller
            control={control}
            name="barcode"
            render={({ field: { onChange, value } }) => (
              <Input placeholderText="Barcode" onChangeText={onChange} value={value} />
            )}
          />
        </View>
        <View style={styles.inputContainer}>
          <Controller
            control={control}
            name="unit"
            rules={{ required: 'Đơn vị tính là bắt buộc' }}
            render={({ field: { onChange, value } }) => (
              <Input
                placeholderText="Đơn vị tính"
                onChangeText={onChange}
                value={value}
                iconType="custom"
                EndIcon={<Icon name="chevron-down-outline" size={20} color="#666" />}
                onIconPress={() => {}}
              />
            )}
          />
          {errors.unit && (
            <DynamicText style={styles.errorText}>{errors.unit.message}</DynamicText>
          )}
        </View>
      </View>

      {/* Ảnh sản phẩm */}
      <View style={styles.section}>
        <DynamicText style={styles.sectionTitle}>Ảnh sản phẩm</DynamicText>
        <View style={styles.imageButtons}>
          <TouchableOpacity style={styles.imageButton}>
            <Icon name="camera-outline" size={24} color="#007AFF" />
            <DynamicText style={styles.imageButtonText}>Camera</DynamicText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.imageButton}>
            <Icon name="image-outline" size={24} color="#007AFF" />
            <DynamicText style={styles.imageButtonText}>Tải hình liên quan</DynamicText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Thông tin giá */}
      <View style={styles.section}>
        <DynamicText style={styles.sectionTitle}>Giá sản phẩm</DynamicText>
        <View style={styles.inputContainer}>
          <Controller
            control={control}
            name="sellingPrice"
            rules={{ required: 'Giá bán là bắt buộc' }}
            render={({ field: { onChange, value } }) => (
              <Input placeholderText="Giá bán" keyboardType="numeric" onChangeText={onChange} value={value} />
            )}
          />
          {errors.sellingPrice && (
            <DynamicText style={styles.errorText}>{errors.sellingPrice.message}</DynamicText>
          )}
        </View>
        <View style={styles.inputContainer}>
          <Controller
            control={control}
            name="costPrice"
            rules={{ required: 'Giá vốn là bắt buộc' }}
            render={({ field: { onChange, value } }) => (
              <Input placeholderText="Giá vốn" keyboardType="numeric" onChangeText={onChange} value={value} />
            )}
          />
          {errors.costPrice && (
            <DynamicText style={styles.errorText}>{errors.costPrice.message}</DynamicText>
          )}
        </View>
      </View>

      {/* Thuộc tính */}
      <View style={styles.section}>
        <DynamicText style={styles.sectionTitle}>Thuộc tính</DynamicText>
        <View style={styles.inputContainer}>
          <Controller
            control={control}
            name="property"
            render={({ field: { onChange, value } }) => (
              <Input placeholderText="Tính chất" onChangeText={onChange} value={value} />
            )}
          />
        </View>
        <View style={styles.inputContainer}>
          <Controller
            control={control}
            name="propertyValue"
            render={({ field: { onChange, value } }) => (
              <Input placeholderText="Giá trị" onChangeText={onChange} value={value} />
            )}
          />
        </View>
      </View>

      {/* Nút Lưu */}
      <Button title="Lưu" onPress={handleSubmit(onSubmit)} buttonContainerStyle={styles.buttonContainer} />
    </BaseLayout>
  );
};

const styles = StyleSheet.create({
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
  inputContainer: {
    marginBottom: scaleHeight(15),
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
  buttonContainer: {
    marginTop: scaleHeight(10),
  },
  errorText: {
    color: color.accentColor.errorColor,
  },
});

export default AddProductScreen;
