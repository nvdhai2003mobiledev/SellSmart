import React, { useState, useEffect } from 'react';
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
import { observer } from 'mobx-react-lite';
import { RootStackParamList } from '../../../navigation/navigation.type';
import { Screen } from '../../../navigation/navigation.type';
import customerAPI, { BASE_URL } from '../../../models/customerAPI';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'apisauce';

// Hàm định dạng ngày tháng cho hiển thị
const formatDateForDisplay = (isoDate: string | null) => {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1)
    .toString()
    .padStart(2, '0')}/${date.getFullYear()}`;
};

const UpdateCustomerScreen = observer(() => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const customerStore = rootStore.customers;
  const customer = customerStore.selectedCustomer;

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    defaultValues: {
      fullName: '',
      phoneNumber: '',
      email: '',
      birthDate: '',
      address: '',
      avatar: '',
    },
  });

  // Load customer data when component mounts
  useEffect(() => {
    if (customer) {
      setValue('fullName', customer.fullName);
      setValue('phoneNumber', customer.phoneNumber);
      setValue('email', customer.email);
      setValue('birthDate', customer.birthDate ? formatDateForDisplay(customer.birthDate) : '');
      setValue('address', customer.address);
      setValue('avatar', customer.avatar || '');
    }
  }, [customer, setValue]);

  // Handle form submission
  const onSubmit = async (data: any) => {
    if (!customer) return;

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
      
      console.log('Đang cập nhật khách hàng:', formattedData);

      try {
        // Đảm bảo customer._id là một MongoDB ObjectId hợp lệ
        if (!customer._id || customer._id.length < 24) {
          console.error('ID khách hàng không hợp lệ:', customer._id);
          Alert.alert('Lỗi', 'ID khách hàng không hợp lệ hoặc bị thiếu.');
          setIsSubmitting(false);
          return;
        }

        // Tạo API client chỉ với header Content-Type, không cần token
        const apiClient = create({
          baseURL: BASE_URL,
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000
        });

        // Sử dụng endpoint đặc biệt cho mobile app - đảm bảo không kiểm tra xác thực
        const customerId = customer._id.trim();
        
        console.log('=============== DEBUG INFO ===============');
        console.log('Customer ID:', customerId);
        console.log('ID length:', customerId.length);
        console.log('Full API URL:', `${BASE_URL}/customers/mobile/customers/update/${customerId}`);
        console.log('Request data:', JSON.stringify(formattedData, null, 2));
        console.log('=========================================');
        
        // Thêm log chi tiết các trường dữ liệu quan trọng để debug
        console.log('CHECK: Customer ID valid:', customerId && customerId.length > 0);
        console.log('CHECK: fullName valid:', formattedData.fullName && formattedData.fullName.length >= 3);
        console.log('CHECK: phoneNumber valid:', /^[0-9]{10}$/.test(formattedData.phoneNumber));
        console.log('CHECK: email valid:', RegexPatterns.EMAIL.test(formattedData.email));
        
        // Thực hiện PUT request với đường dẫn API đặc biệt cho mobile app
        const response = await apiClient.put(`/customers/mobile/customers/update/${customerId}`, formattedData);
        
        console.log('=============== RESPONSE INFO ===============');
        console.log('Response status:', response.status);
        console.log('Response problem:', response.problem);
        console.log('Response data:', JSON.stringify(response.data, null, 2));
        console.log('Response config:', response.config);
        console.log('Response URL:', response.config?.url);
        console.log('=============================================');

        if (response.ok) {
          Alert.alert(
            'Thành công',
            'Cập nhật khách hàng thành công!',
            [
              {
                text: 'OK',
                onPress: () => {
                  // Refresh danh sách khách hàng và chuyển về màn hình danh sách khách hàng
                  customerStore.fetchCustomers();
                  navigation.navigate(Screen.CUSTOMERS);
                },
              },
            ]
          );
        } else {
          // Xử lý lỗi API dựa trên response.problem
          let errorMessage = 'Có lỗi xảy ra khi cập nhật khách hàng.';
          
          if (response.data && typeof response.data === 'object') {
            // Cố gắng trích xuất thông báo lỗi từ dữ liệu phản hồi
            const responseData = response.data as any;
            errorMessage = responseData.message || 
                          (responseData.error ? `Lỗi: ${responseData.error}` : errorMessage);
          } else if (response.problem === 'NETWORK_ERROR') {
            errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và đảm bảo server đang chạy.';
          } else if (response.problem === 'TIMEOUT_ERROR') {
            errorMessage = 'Yêu cầu tới máy chủ mất quá nhiều thời gian. Vui lòng thử lại sau.';
          } else if (response.problem === 'CLIENT_ERROR') {
            if (response.status === 400) {
              errorMessage = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại các thông tin đã nhập.';
            } else if (response.status === 404) {
              errorMessage = 'Không tìm thấy khách hàng hoặc đường dẫn API không đúng.';
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
      } finally {
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Lỗi xử lý form:', error);
      Alert.alert(
        'Lỗi',
        'Có lỗi xảy ra khi xử lý dữ liệu. Vui lòng thử lại sau.'
      );
      setIsSubmitting(false);
    }
  };

  if (!customer) {
    return (
      <View style={styles.loadingContainer}>
        <DynamicText>Không tìm thấy thông tin khách hàng</DynamicText>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <DynamicText style={styles.backLink}>Quay lại</DynamicText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <BaseLayout style={styles.container}>
      <Header
        title="Cập nhật khách hàng"
        showBackIcon={true}
        onPressBack={() => navigation.goBack()}
        showRightIcon={false}
      />
      <ScrollView>
        <View style={styles.card}>
          <View style={styles.avatarContainer}>
            <Image
              source={
                customer.avatar && typeof customer.avatar === 'string' && customer.avatar.trim() !== ''
                  ? { uri: customer.avatar }
                  : require('../../../assets/images/shop.png')
              }
              style={{
                width: scaleWidth(70),
                height: scaleHeight(70),
                borderRadius: 35,
              }}
            />
          </View>

          <Text style={styles.formTitle}>Thông tin khách hàng: {customer.fullName}</Text>
          
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
            <Text style={styles.label}>Địa chỉ</Text>
            <Controller
              control={control}
              name="address"
              rules={{
                minLength: {
                  value: 5,
                  message: 'Nếu nhập địa chỉ, phải có ít nhất 5 ký tự',
                },
              }}
              render={({field: {onChange, value}}) => (
                <Input
                  placeholderText="Nhập địa chỉ (không bắt buộc)"
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
          title="Cập nhật thông tin"
          onPress={handleSubmit(onSubmit)}
          buttonContainerStyle={styles.buttonContainer}
          loading={isSubmitting}
          disabled={isSubmitting}
        />
      </ScrollView>
    </BaseLayout>
  );
});

export default UpdateCustomerScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.backgroundColor,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backLink: {
    color: color.primaryColor,
    fontSize: scaledSize(16),
    marginTop: scaleHeight(10),
  },
  avatarContainer: {
    alignItems: 'center', 
    marginVertical: scaledSize(20),
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
    width: '100%',
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
