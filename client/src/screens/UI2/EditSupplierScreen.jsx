import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BaseLayout, Button, Header, Input } from '../../components';
import { color, moderateScale, scaledSize, scaleHeight, scaleWidth } from '../../utils';
import { Picker } from '@react-native-picker/picker';
import { contents } from '../../context';

const EditSupplierScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { supplier } = route.params || {}; // Nhận dữ liệu nhà cung cấp từ params, nếu có

  const { control, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: {
      id: '',
      name: '',
      phone_number: '',
      email: '',
      supplier_address: '',
      status: 'Active', // Giá trị mặc định
    },
  });

  // Cập nhật form với dữ liệu ban đầu khi component mount
  useEffect(() => {
    if (supplier) {
      try {
        reset({
          id: supplier.id || '',
          name: supplier.name || '',
          phone_number: supplier.phone_number || '',
          email: supplier.email || '',
          supplier_address: supplier.supplier_address || '',
          status: supplier.status || 'Active',
        });
      } catch (error) {
        Alert.alert('Lỗi', 'Không thể tải dữ liệu nhà cung cấp');
        console.error('Lỗi reset form:', error);
      }
    }
  }, [supplier, reset]);

  const onSubmit = (data: any) => {
    console.log('Dữ liệu nhà cung cấp đã chỉnh sửa:', data);
    // Thêm logic cập nhật dữ liệu vào đây (ví dụ: gửi API)
    navigation.goBack(); // Quay lại sau khi lưu
  };

  return (
    <BaseLayout style={styles.container}>
      <Header
        title={contents.editsupplier?.title || 'Sửa nhà cung cấp'}
        showBackIcon={true}
        onPressBack={() => navigation.goBack()}
        showRightIcon={true}
        RightIcon={false}
      />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.card}>
          <Text style={styles.label}>{contents.editsupplier?.show || 'Thông tin nhà cung cấp'}</Text>

          {/* ID nhà cung cấp (chỉ đọc) */}
          <View style={styles.inputContainer}>
            <Controller
              control={control}
              name="id"
              rules={{ required: contents.editsupplier?.id_required || 'Mã nhà cung cấp là bắt buộc' }}
              render={({ field: { onChange, value } }) => (
                <Input
                  placeholderText={contents.editsupplier?.id || 'Mã nhà cung cấp'}
                  onChangeText={onChange}
                  value={value}
                  editable={false} // Không cho phép chỉnh sửa ID
                />
              )}
            />
            {errors.id && <Text style={styles.errorText}>{errors.id.message}</Text>}
          </View>

          {/* Tên nhà cung cấp */}
          <View style={styles.inputContainer}>
            <Controller
              control={control}
              name="name"
              rules={{ required: contents.editsupplier?.name_required || 'Tên nhà cung cấp là bắt buộc' }}
              render={({ field: { onChange, value } }) => (
                <Input
                  placeholderText={contents.editsupplier?.name || 'Tên nhà cung cấp'}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}
          </View>

          {/* Số điện thoại */}
          <View style={styles.inputContainer}>
            <Controller
              control={control}
              name="phone_number"
              rules={{ required: contents.editsupplier?.phone_required || 'Số điện thoại là bắt buộc' }}
              render={({ field: { onChange, value } }) => (
                <Input
                  placeholderText={contents.editsupplier?.phone || 'Số điện thoại'}
                  onChangeText={onChange}
                  value={value}
                  keyboardType="phone-pad"
                />
              )}
            />
            {errors.phone_number && <Text style={styles.errorText}>{errors.phone_number.message}</Text>}
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <Controller
              control={control}
              name="email"
              rules={{ required: contents.editsupplier?.email_required || 'Email là bắt buộc' }}
              render={({ field: { onChange, value } }) => (
                <Input
                  placeholderText={contents.editsupplier?.email || 'Email'}
                  onChangeText={onChange}
                  value={value}
                  keyboardType="email-address"
                />
              )}
            />
            {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
          </View>

          {/* Địa chỉ */}
          <View style={styles.inputContainer}>
            <Controller
              control={control}
              name="supplier_address"
              rules={{ required: contents.editsupplier?.address_required || 'Địa chỉ là bắt buộc' }}
              render={({ field: { onChange, value } }) => (
                <Input
                  placeholderText={contents.editsupplier?.address || 'Địa chỉ'}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.supplier_address && <Text style={styles.errorText}>{errors.supplier_address.message}</Text>}
          </View>

          {/* Trạng thái */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{contents.editsupplier?.status || 'Trạng thái'}</Text>
            <Controller
              control={control}
              name="status"
              render={({ field: { onChange, value } }) => (
                <View style={styles.pickerContainer}>
                  <Picker selectedValue={value} onValueChange={onChange} style={styles.picker}>
                    <Picker.Item label="Chọn trạng thái" value="" />
                    <Picker.Item label="Active" value="Active" />
                    <Picker.Item label="Inactive" value="Inactive" />
                  </Picker>
                </View>
              )}
            />
            {errors.status && <Text style={styles.errorText}>{errors.status.message}</Text>}
          </View>
        </View>
        <Button
          title={contents.editsupplier?.button_title || 'Lưu'}
          onPress={handleSubmit(onSubmit)}
          buttonContainerStyle={styles.buttonContainer}
        />
      </ScrollView>
    </BaseLayout>
  );
};

export default EditSupplierScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F7', padding: scaledSize(1) },
  scrollContainer: {
    flexGrow: 1,
    padding: scaledSize(2),
  },
  card: { backgroundColor: '#FFF', borderRadius: 10, padding: scaledSize(2) },
  label: { fontSize: scaledSize(14), color: '#888', marginBottom: scaleHeight(5) },
  inputContainer: { marginBottom: scaleHeight(15) },
  pickerContainer: { backgroundColor: '#F0F0F0', borderRadius: moderateScale(8), marginBottom: scaleHeight(15) },
  picker: { height: scaleHeight(50), width: '100%' },
  buttonContainer: {
    marginTop: scaleHeight(10),
  },
  errorText: { color: color.accentColor.errorColor || '#ff0000' },
});