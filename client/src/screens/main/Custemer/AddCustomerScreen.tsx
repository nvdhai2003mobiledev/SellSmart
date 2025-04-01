import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import {
  BaseLayout,
  Button,
  DynamicText,
  Header,
  Input,
} from '../../../components';
import {
  color,
  moderateScale,
  scaledSize,
  scaleHeight,
  scaleWidth,
} from '../../../utils';
import { Picker } from '@react-native-picker/picker';
import { contents } from '../../../context';
import { RegexPatterns } from '../../../constants';
import { Images } from '../../../assets';
import { Platform } from 'react-native';
import { rootStore } from '../../../models/root-store';
import { RootStackParamList } from '../../../navigation/navigation.type';
import customerAPI, { BASE_URL } from '../../../models/customerAPI';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'apisauce';

const AddCustomerScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const customerStore = rootStore.customers;

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      fullName: '',
      gender: '',
      phoneNumber: '',
      email: '',
      birthDate: '',
      address: '',
      avatar: '',
    },
  });

  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      
      // Format date correctly if provided
      let formattedData = { ...data };
      if (data.birthDate && data.birthDate.trim() !== '') {
        // Check if birthDate is in DD/MM/YYYY format and convert to YYYY-MM-DD for API
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(data.birthDate)) {
          const [day, month, year] = data.birthDate.split('/');
          formattedData.birthDate = `${year}-${month}-${day}`;
        }
      }
      
      console.log('Đang thêm khách hàng:', formattedData);

      // Kiểm tra và validate dữ liệu trước khi gửi
      if (!formattedData.fullName || formattedData.fullName.trim().length < 3) {
        Alert.alert('Lỗi', 'Họ tên phải có ít nhất 3 ký tự');
        setIsSubmitting(false);
        return;
      }

      if (!formattedData.phoneNumber || !/^[0-9]{10}$/.test(formattedData.phoneNumber)) {
        Alert.alert('Lỗi', 'Số điện thoại không hợp lệ. Phải có đúng 10 chữ số');
        setIsSubmitting(false);
        return;
      }

      if (!formattedData.email || !RegexPatterns.EMAIL.test(formattedData.email)) {
        Alert.alert('Lỗi', 'Email không hợp lệ');
        setIsSubmitting(false);
        return;
      }
      
      // Kiểm tra địa chỉ
      if (!formattedData.address || formattedData.address.trim() === '') {
        Alert.alert('Lỗi', 'Địa chỉ không được để trống');
        setIsSubmitting(false);
        return;
      }
      
      console.log('=============== DEBUG INFO ===============');
      console.log('Token hiện tại:', await AsyncStorage.getItem('userToken') ? 'Có token' : 'Không có token');
      console.log('Gửi request tới:', `${BASE_URL}/customers/mobile/customers/add`);
      console.log('Chi tiết dữ liệu gửi đi:', JSON.stringify(formattedData, null, 2));
      console.log('=========================================');
      
      try {
        // Tạo API client không cần token xác thực
        const apiClient = create({
          baseURL: BASE_URL,
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000
        });
        
        // Thực hiện POST request với đường dẫn API đặc biệt cho mobile app
        const response = await apiClient.post('/customers/mobile/customers/add', formattedData);
        
        console.log('=============== RESPONSE INFO ===============');
        console.log('API Response status:', response.status);
        console.log('API Response problem:', response.problem || 'No problem');
        console.log('API Response data:', response.data);
        console.log('API Response headers:', response.headers);
        console.log('API Response config:', response.config);
        console.log('API Response request URL:', response.config?.url);
        console.log('API Response full URL:', `${BASE_URL}${response.config?.url}`);
        console.log('============================================');

        if (response.ok) {
          Alert.alert(
            'Thành công',
            'Thêm khách hàng thành công!',
            [
              {
                text: 'OK',
                onPress: () => {
                  // Refresh danh sách khách hàng và quay lại màn hình danh sách
                  customerStore.fetchCustomers();
                  navigation.goBack();
                },
              },
            ]
          );
          reset(); // Reset form
        } else {
          // Xử lý lỗi API dựa trên response.problem
          let errorMessage = 'Có lỗi xảy ra khi thêm khách hàng.';
          
          if (response.data && typeof response.data === 'object' && 'message' in response.data) {
            errorMessage = (response.data as any).message;
          } else if (response.problem === 'NETWORK_ERROR') {
            errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và đảm bảo server đang chạy.';
          } else if (response.problem === 'TIMEOUT_ERROR') {
            errorMessage = 'Yêu cầu tới máy chủ mất quá nhiều thời gian. Vui lòng thử lại sau.';
          } else if (response.problem === 'CLIENT_ERROR') {
            if (response.status === 400) {
              errorMessage = (response.data as any)?.message || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.';
            } else if (response.status === 404) {
              errorMessage = 'Không tìm thấy API endpoint. Vui lòng kiểm tra lại đường dẫn API.';
            } else if (response.status === 401) {
              errorMessage = 'Bạn không có quyền thực hiện chức năng này. Vui lòng đăng nhập lại.';
            }
          } else if (response.problem === 'SERVER_ERROR') {
            errorMessage = 'Máy chủ gặp lỗi. Vui lòng liên hệ quản trị viên.';
          }
          
          Alert.alert('Lỗi', errorMessage);
          console.error('Chi tiết lỗi API:', { 
            problem: response.problem, 
            status: response.status, 
            data: response.data,
            url: response.config?.url
          });
        }
      } catch (error) {
        console.error('Lỗi ngoại lệ khi gọi API:', error);
        Alert.alert(
          'Lỗi kết nối',
          'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và đảm bảo server đang chạy.'
        );
      }
    } catch (error) {
      console.error('Lỗi xử lý form:', error);
      Alert.alert(
        'Lỗi',
        'Có lỗi xảy ra khi xử lý dữ liệu. Vui lòng thử lại sau.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseLayout style={styles.container}>
      <Header
        title="Thêm khách hàng mới"
        showBackIcon={true}
        onPressBack={() => navigation.goBack()}
        showRightIcon={false}
      />
      <ScrollView>
        <View style={styles.card}>
          <View style={styles.avatarContainer}>
            <Image
              source={require('../../../assets/images/shop.png')}
              style={{
                width: scaleWidth(50),
                height: scaleHeight(50),
                borderRadius: 50,
              }}
            />
          </View>

          <Text style={styles.formTitle}>Thông tin khách hàng</Text>
          
          {/* Họ và tên */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Họ và tên *</Text>
            <Controller
              control={control}
              name="fullName"
              rules={{
                required: 'Họ tên không được để trống',
                minLength: {
                  value: 3,
                  message: 'Họ tên phải có ít nhất 3 ký tự',
                },
              }}
              render={({field: {onChange, value}}) => (
                <Input
                  placeholderText="Nhập họ tên khách hàng"
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.fullName && (
              <DynamicText style={styles.errorText}>
                {errors.fullName.message}
              </DynamicText>
            )}
          </View>

          {/* Số điện thoại */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Số điện thoại *</Text>
            <Controller
              control={control}
              name="phoneNumber"
              rules={{
                required: 'Số điện thoại không được để trống',
                pattern: {
                  value: /^[0-9]{10}$/,
                  message: 'Số điện thoại không hợp lệ, phải có đúng 10 chữ số',
                },
              }}
              render={({field: {onChange, value}}) => (
                <Input
                  placeholderText="Nhập số điện thoại"
                  keyboardType="phone-pad"
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.phoneNumber && (
              <DynamicText style={styles.errorText}>
                {errors.phoneNumber.message}
              </DynamicText>
            )}
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email *</Text>
            <Controller
              control={control}
              name="email"
              rules={{
                required: 'Email không được để trống',
                pattern: {
                  value: RegexPatterns.EMAIL,
                  message: 'Email không hợp lệ',
                },
              }}
              render={({field: {onChange, value}}) => (
                <Input
                  placeholderText="Nhập email"
                  keyboardType="email-address"
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.email && (
              <DynamicText style={styles.errorText}>
                {errors.email.message}
              </DynamicText>
            )}
          </View>

          {/* Ngày sinh */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Ngày sinh (DD/MM/YYYY)</Text>
            <Controller
              control={control}
              name="birthDate"
              rules={{
                pattern: {
                  value: /^(\d{2}\/\d{2}\/\d{4})?$/,
                  message: 'Định dạng ngày sinh không hợp lệ (DD/MM/YYYY)',
                },
              }}
              render={({field: {onChange, value}}) => (
                <Input
                  placeholderText="DD/MM/YYYY"
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.birthDate && (
              <DynamicText style={styles.errorText}>
                {errors.birthDate.message}
              </DynamicText>
            )}
          </View>

          {/* Địa chỉ */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Địa chỉ *</Text>
            <Controller
              control={control}
              name="address"
              rules={{
                required: 'Địa chỉ không được để trống',
                minLength: {
                  value: 5,
                  message: 'Địa chỉ phải có ít nhất 5 ký tự',
                },
              }}
              render={({field: {onChange, value}}) => (
                <Input
                  placeholderText="Nhập địa chỉ"
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.address && (
              <DynamicText style={styles.errorText}>
                {errors.address.message}
              </DynamicText>
            )}
          </View>

          {/* URL Avatar (không bắt buộc) */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>URL Avatar (không bắt buộc)</Text>
            <Controller
              control={control}
              name="avatar"
              render={({field: {onChange, value}}) => (
                <Input
                  placeholderText="URL hình ảnh đại diện"
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
          </View>
        </View>
        <Button
          title="Thêm khách hàng"
          onPress={handleSubmit(onSubmit)}
          buttonContainerStyle={styles.buttonContainer}
          loading={isSubmitting}
          disabled={isSubmitting}
        />
      </ScrollView>
    </BaseLayout>
  );
};

export default AddCustomerScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: color.backgroundColor,
  },
  avatarContainer: {
    alignItems: 'center', 
    marginVertical: scaledSize(20)
  },
  avatar: {
    width: scaleWidth(50),
    height: scaleHeight(50),
    borderRadius: scaledSize(20),
    marginRight: scaleWidth(12),
    justifyContent: 'center',
  },
  card: {
    backgroundColor: color.accentColor.whiteColor,
    borderRadius: 10,
    padding: scaledSize(16),
    margin: scaledSize(16),
  },
  formTitle: {
    fontSize: scaledSize(18),
    fontWeight: 'bold',
    color: color.primaryColor,
    marginBottom: scaleHeight(15),
    textAlign: 'center',
  },
  label: {
    fontSize: scaledSize(14),
    color: color.accentColor.grayColor,
    marginBottom: scaleHeight(5),
  },
  inputContainer: {
    marginBottom: scaleHeight(15),
  },
  pickerContainer: {
    backgroundColor: color.accentColor.whiteColor,
    borderRadius: moderateScale(8),
    marginBottom: scaleHeight(15),
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  picker: {
    height: scaleHeight(50), 
    width: '100%'
  },
  buttonContainer: {
    marginHorizontal: scaleWidth(16),
    marginTop: scaleHeight(10),
    marginBottom: scaleHeight(20),
  },
  errorText: {
    color: color.accentColor.errorColor,
    fontSize: scaledSize(12),
    marginTop: scaleHeight(5),
  },
});
