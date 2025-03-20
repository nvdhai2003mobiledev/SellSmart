import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { useNavigation } from '@react-navigation/native';
import { BaseLayout, Button, Header, Input, DynamicText } from '../../components'; // Thêm DynamicText
import { color, moderateScale, scaledSize, scaleHeight, scaleWidth } from '../../utils';
import { Picker } from '@react-native-picker/picker';
import { contents } from '../../context';
import { RegexPatterns } from '../../constants';

const AddSupplierScreen = () => {
  const navigation = useNavigation();

  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      supplierId: '',
      name: '',
      phone_number: '',
      email: '',
      supplier_address: '',
      status: 'Active', // Giá trị mặc định
    },
  });

  const onSubmit = (data: any) => {
    console.log('Dữ liệu nhà cung cấp:', data);
    // Thêm logic lưu dữ liệu vào đây (ví dụ: gửi API)
  };

  return (
    <BaseLayout style={styles.container}>
      <Header
        title={contents.addsupplier?.title || 'Thêm nhà cung cấp'}
        showBackIcon={true}
        onPressBack={() => navigation.goBack()}
        showRightIcon={true}
        RightIcon={false}
      />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.card}>
          <DynamicText style={styles.label}>
            {contents.addsupplier?.show || 'Sửa nhà cung cấp'}
          </DynamicText>

          {/* ID nhà cung cấp */}
          <View style={styles.inputContainer}>
            <Controller
              control={control}
              name="supplierId"
              rules={{ required: contents.addsupplier?.id_required || 'Mã nhà cung cấp là bắt buộc' }}
              render={({ field: { onChange, value } }) => (
                <Input
                  placeholderText={contents.addsupplier?.id_supplier || 'Mã nhà cung cấp'}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.supplierId && (
              <DynamicText style={styles.errorText}>{errors.supplierId.message}</DynamicText>
            )}
          </View>

          {/* Tên nhà cung cấp */}
          <View style={styles.inputContainer}>
            <Controller
              control={control}
              name="name"
              rules={{
                required: contents.addsupplier?.name_required || 'Tên nhà cung cấp là bắt buộc',
                pattern: {
                  value: RegexPatterns.USERNAME,
                  message: contents.addsupplier?.name_length || 'Tên không hợp lệ',
                },
              }}
              render={({ field: { onChange, value } }) => (
                <Input
                  placeholderText={contents.addsupplier?.name || 'Tên nhà cung cấp'}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.name && (
              <DynamicText style={styles.errorText}>{errors.name.message}</DynamicText>
            )}
          </View>

          {/* Số điện thoại */}
          <View style={styles.inputContainer}>
            <Controller
              control={control}
              name="phone_number"
              rules={{
                required: contents.addsupplier?.phone_required || 'Số điện thoại là bắt buộc',
                pattern: {
                  value: RegexPatterns.PHONE_NUMBER,
                  message: contents.addsupplier?.phone_length || 'Số điện thoại không hợp lệ',
                },
              }}
              render={({ field: { onChange, value } }) => (
                <Input
                  placeholderText={contents.addsupplier?.phone || 'Số điện thoại'}
                  keyboardType="phone-pad"
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.phone_number && (
              <DynamicText style={styles.errorText}>{errors.phone_number.message}</DynamicText>
            )}
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <Controller
              control={control}
              name="email"
              rules={{
                required: contents.addsupplier?.email_required || 'Email là bắt buộc',
                pattern: {
                  value: RegexPatterns.EMAIL,
                  message: contents.addsupplier?.email_length || 'Email không hợp lệ',
                },
              }}
              render={({ field: { onChange, value } }) => (
                <Input
                  placeholderText={contents.addsupplier?.email || 'Email'}
                  keyboardType="email-address"
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.email && (
              <DynamicText style={styles.errorText}>{errors.email.message}</DynamicText>
            )}
          </View>

          {/* Địa chỉ */}
          <View style={styles.inputContainer}>
            <Controller
              control={control}
              name="supplier_address"
              rules={{ required: contents.addsupplier?.address_required || 'Địa chỉ là bắt buộc' }}
              render={({ field: { onChange, value } }) => (
                <Input
                  placeholderText={contents.addsupplier?.address || 'Địa chỉ'}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.supplier_address && (
              <DynamicText style={styles.errorText}>{errors.supplier_address.message}</DynamicText>
            )}
          </View>

          {/* Trạng thái */}
          <View style={styles.inputContainer}>
            <Controller
              control={control}
              name="status"
              render={({ field: { onChange, value } }) => (
                <View style={styles.pickerContainer}>
                  <Picker selectedValue={value} onValueChange={onChange} style={styles.picker}>
                    <Picker.Item label={contents.addsupplier?.status || 'Trạng thái'} value="" />
                    <Picker.Item label="Active" value="Active" />
                    <Picker.Item label="Inactive" value="Inactive" />
                  </Picker>
                </View>
              )}
            />
            {errors.status && (
              <DynamicText style={styles.errorText}>{errors.status.message}</DynamicText>
            )}
          </View>
        </View>
        <Button
          title={contents.addsupplier?.button_title || 'Lưu'}
          onPress={handleSubmit(onSubmit)}
          buttonContainerStyle={styles.buttonContainer}
        />
      </ScrollView>
    </BaseLayout>
  );
};

export default AddSupplierScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F7', padding: scaledSize(1) },
  scrollContainer: {
    flexGrow: 1,
    padding: scaledSize(2),
  },
  card: { backgroundColor: '#FFF', borderRadius: 10, padding: scaledSize(2) },
  label: { fontSize: scaledSize(14), color: '#888', marginBottom: scaleHeight(-19) },
  inputContainer: { marginBottom: scaleHeight(15) },
  pickerContainer: { backgroundColor: '#F0F0F0', borderRadius: moderateScale(8), marginBottom: scaleHeight(15) },
  picker: { height: scaleHeight(50), width: '100%' },
  buttonContainer: {
    marginTop: scaleHeight(10),
  },
  errorText: { color: color.accentColor.errorColor },
});