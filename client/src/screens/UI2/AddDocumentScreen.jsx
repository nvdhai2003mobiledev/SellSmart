import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { useNavigation } from '@react-navigation/native';
import { BaseLayout, Button, Header, Input } from '../../components';
import { color, moderateScale, scaledSize, scaleHeight, scaleWidth } from '../../utils';
import { contents } from '../../context';
import { RegexPatterns } from '../../constants';

const AddDocumentScreen = () => {
  const navigation = useNavigation();

  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      id: '',
      product_id: '',
      user_id: '',
      title: '',
      description: '',
      date: '',
      media: '', // Thêm media vào form để quản lý trực tiếp
    },
  });

  const onSubmit = (data: any) => {
    console.log('Dữ liệu tài liệu:', data);
    // Thêm logic lưu dữ liệu vào đây (ví dụ: gửi API)
  };

  return (
    <BaseLayout style={styles.container}>
      <Header
        title={contents.adddocument?.title || 'Thêm tài liệu'}
        showBackIcon={true}
        onPressBack={() => navigation.goBack()}
        showRightIcon={true}
        RightIcon={false}
      />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.card}>
          <Text style={styles.label}>{contents.adddocument?.show || 'Thông tin tài liệu'}</Text>

          {/* ID tài liệu */}
          <View style={styles.inputContainer}>
            <Controller
              control={control}
              name="id"
              rules={{ required: contents.adddocument?.id_required || 'Mã tài liệu là bắt buộc' }}
              render={({ field: { onChange, value } }) => (
                <Input placeholderText={contents.adddocument?.id || 'Mã tài liệu'} onChangeText={onChange} value={value} />
              )}
            />
            {errors.id && <Text style={styles.errorText}>{errors.id.message}</Text>}
          </View>

          {/* Product ID */}
          <View style={styles.inputContainer}>
            <Controller
              control={control}
              name="product_id"
              rules={{ required: contents.adddocument?.product_id_required || 'Mã sản phẩm là bắt buộc' }}
              render={({ field: { onChange, value } }) => (
                <Input placeholderText={contents.adddocument?.product_id || 'Mã sản phẩm'} onChangeText={onChange} value={value} />
              )}
            />
            {errors.product_id && <Text style={styles.errorText}>{errors.product_id.message}</Text>}
          </View>

          {/* User ID */}
          <View style={styles.inputContainer}>
            <Controller
              control={control}
              name="user_id"
              rules={{ required: contents.adddocument?.user_id_required || 'Mã người dùng là bắt buộc' }}
              render={({ field: { onChange, value } }) => (
                <Input placeholderText={contents.adddocument?.user_id || 'Mã người dùng'} onChangeText={onChange} value={value} />
              )}
            />
            {errors.user_id && <Text style={styles.errorText}>{errors.user_id.message}</Text>}
          </View>

          {/* Tiêu đề */}
          <View style={styles.inputContainer}>
            <Controller
              control={control}
              name="title"
              rules={{ required: contents.adddocument?.title_required || 'Tiêu đề là bắt buộc' }}
              render={({ field: { onChange, value } }) => (
                <Input placeholderText={contents.adddocument?.title || 'Tiêu đề'} onChangeText={onChange} value={value} />
              )}
            />
            {errors.title && <Text style={styles.errorText}>{errors.title.message}</Text>}
          </View>

          {/* Mô tả */}
          <View style={styles.inputContainer}>
            <Controller
              control={control}
              name="description"
              rules={{ required: contents.adddocument?.description_required || 'Mô tả là bắt buộc' }}
              render={({ field: { onChange, value } }) => (
                <Input placeholderText={contents.adddocument?.description || 'Mô tả'} onChangeText={onChange} value={value} multiline={true} numberOfLines={4} />
              )}
            />
            {errors.description && <Text style={styles.errorText}>{errors.description.message}</Text>}
          </View>

          {/* Ngày */}
          <View style={styles.inputContainer}>
            <Controller
              control={control}
              name="date"
              rules={{ required: contents.adddocument?.date_required || 'Ngày là bắt buộc' }}
              render={({ field: { onChange, value } }) => (
                <Input placeholderText={contents.adddocument?.date || 'Ngày'} onChangeText={onChange} value={value} />
              )}
            />
            {errors.date && <Text style={styles.errorText}>{errors.date.message}</Text>}
          </View>

          {/* Media (vị trí cuối, trước nút Lưu) */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{contents.adddocument?.media || 'Media (Nhập thông tin)'}</Text>
            <Controller
              control={control}
              name="media"
              render={({ field: { onChange, value } }) => (
                <Input
                  placeholderText="Nhập thông tin media"
                  onChangeText={onChange}
                  value={value}
                  inputContainerStyle={styles.input}
                />
              )}
            />
            {errors.media && <Text style={styles.errorText}>{errors.media.message}</Text>}
          </View>
        </View>
        <Button
          title={contents.adddocument?.button_title || 'Lưu'}
          onPress={handleSubmit(onSubmit)}
          buttonContainerStyle={styles.buttonContainer}
        />
      </ScrollView>
    </BaseLayout>
  );
};

export default AddDocumentScreen;

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
  errorText: { color: color.accentColor.errorColor },
});