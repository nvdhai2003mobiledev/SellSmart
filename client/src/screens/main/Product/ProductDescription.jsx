import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Controller, useForm } from 'react-hook-form';
import { useNavigation } from '@react-navigation/native';
import { BaseLayout, Input, Button, Header, DynamicText } from '../../../components';
import { color, scaleHeight } from '../../../utils';

const ProductDescription = () => {
  const navigation = useNavigation();

  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      description: '',
    },
  });

  const onSubmit = (data: any) => {
    console.log('Mô tả sản phẩm:', data);
    // Thêm logic lưu dữ liệu vào đây (ví dụ: gửi API)
  };

  return (
    <BaseLayout>
      {/* Tiêu đề */}
      <Header
        title="MÔ TẢ SẢN PHẨM"
        showBackIcon={true}
        onPressBack={() => navigation.goBack()}
      />

      {/* Thanh công cụ định dạng */}
      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="arrow-forward" size={24} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="text" size={24} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="list" size={24} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="link" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Ô nhập liệu */}
      <View style={styles.inputContainer}>
        <Controller
          control={control}
          name="description"
          rules={{ required: 'Mô tả sản phẩm là bắt buộc' }}
          render={({ field: { onChange, value } }) => (
            <Input
              placeholderText="Nhập nội dung"
              inputContainerStyle={styles.textInput}
              multiline
              onChangeText={onChange}
              value={value}
            />
          )}
        />
        {errors.description && (
          <DynamicText style={styles.errorText}>{errors.description.message}</DynamicText>
        )}
      </View>

      {/* Nút Lưu */}
      <Button
        title="LƯU"
        onPress={handleSubmit(onSubmit)}
        buttonContainerStyle={styles.saveButton}
        titleStyle={styles.saveButtonText}
      />
    </BaseLayout>
  );
};

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    padding: 10,
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  iconButton: {
    padding: 5,
  },
  inputContainer: {
    flex: 1,
    margin: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#007bff',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: color.accentColor.errorColor,
    marginTop: 5,
  },
});

export default ProductDescription;