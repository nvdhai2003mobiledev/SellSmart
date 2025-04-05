import React, {useState} from 'react';
import {View, StyleSheet, Alert, ScrollView, Image} from 'react-native';
import {BaseLayout, Header, Input, DynamicText, Button} from '../../../components';
import {
  color,
  moderateScale,
  scaledSize,
  scaleHeight,
  scaleWidth,
} from '../../../utils';
import {observer} from 'mobx-react-lite';
import {rootStore} from '../../../models/root-store';
import {useNavigation} from '@react-navigation/native';
import {NavigationProp} from '@react-navigation/native';
import {RootStackParamList} from '../../../navigation/navigation.type';
import {Controller, useForm} from 'react-hook-form';
import {RegexPatterns} from '../../../constants';
import {Images} from '../../../assets';
import {Fonts} from '../../../assets';
import {Picker} from '@react-native-picker/picker';

const AddProviderScreen = observer(() => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {providers} = rootStore;

  const {
    control,
    handleSubmit,
    formState: {errors},
    reset,
  } = useForm({
    defaultValues: {
      fullName: '',
      email: '',
      phoneNumber: '',
      address: '',
      status: 'cung cấp',
    },
  });

  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);

      // Kiểm tra và validate dữ liệu trước khi gửi
      if (!data.fullName || data.fullName.trim().length < 3) {
        Alert.alert('Lỗi', 'Tên nhà cung cấp phải có ít nhất 3 ký tự');
        return;
      }

      if (!data.phoneNumber || !/^[0-9]{10,11}$/.test(data.phoneNumber)) {
        Alert.alert('Lỗi', 'Số điện thoại không hợp lệ. Phải có 10-11 chữ số');
        return;
      }

      if (!data.email || !RegexPatterns.EMAIL.test(data.email)) {
        Alert.alert('Lỗi', 'Email không hợp lệ');
        return;
      }

      if (!data.address || data.address.trim() === '') {
        Alert.alert('Lỗi', 'Địa chỉ không được để trống');
        return;
      }

      // Gọi API thêm nhà cung cấp
      const response = await fetch('http://10.0.2.2:5000/api/providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${rootStore.auth.accessToken}`,
        },
        body: JSON.stringify({
          fullName: data.fullName,
          email: data.email,
          phoneNumber: data.phoneNumber,
          address: data.address,
          status: data.status,
        }),
      });

      const result = await response.json();

      if (response.ok && result.status === 'Ok') {
        // Cập nhật lại danh sách nhà cung cấp
        await providers.fetchProviders();
        
        Alert.alert('Thành công', 'Thêm nhà cung cấp thành công', [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
            },
          },
        ]);
        reset();
      } else {
        Alert.alert(
          'Lỗi',
          result.message || 'Không thể thêm nhà cung cấp. Vui lòng thử lại sau.',
        );
      }
    } catch (error) {
      console.error('Lỗi khi thêm nhà cung cấp:', error);
      Alert.alert(
        'Lỗi',
        'Đã xảy ra lỗi khi thêm nhà cung cấp. Vui lòng thử lại sau.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseLayout style={styles.container}>
      <Header
        title="Thêm nhà cung cấp mới"
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

          <DynamicText style={styles.formTitle}>Thông tin nhà cung cấp</DynamicText>

          {/* Tên nhà cung cấp */}
          <View style={styles.inputContainer}>
            <DynamicText style={styles.label}>Tên nhà cung cấp *</DynamicText>
            <Controller
              control={control}
              name="fullName"
              rules={{
                required: 'Tên không được để trống',
                minLength: {
                  value: 3,
                  message: 'Tên phải có ít nhất 3 ký tự',
                },
              }}
              render={({field: {onChange, value}}) => (
                <Input
                  placeholderText="Nhập tên nhà cung cấp"
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

          {/* Email */}
          <View style={styles.inputContainer}>
            <DynamicText style={styles.label}>Email *</DynamicText>
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

          {/* Số điện thoại */}
          <View style={styles.inputContainer}>
            <DynamicText style={styles.label}>Số điện thoại *</DynamicText>
            <Controller
              control={control}
              name="phoneNumber"
              rules={{
                required: 'Số điện thoại không được để trống',
                pattern: {
                  value: /^[0-9]{10,11}$/,
                  message: 'Số điện thoại không hợp lệ, phải có 10-11 chữ số',
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

          {/* Địa chỉ */}
          <View style={styles.inputContainer}>
            <DynamicText style={styles.label}>Địa chỉ *</DynamicText>
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

          {/* Trạng thái */}
          <View style={styles.inputContainer}>
            <DynamicText style={styles.label}>Trạng thái *</DynamicText>
            <Controller
              control={control}
              name="status"
              defaultValue="cung cấp"
              render={({field: {onChange, value}}) => (
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={value}
                    onValueChange={onChange}
                    style={styles.picker}>
                    <Picker.Item label="Đang cung cấp" value="cung cấp" />
                    <Picker.Item label="Dừng cung cấp" value="dừng cung cấp" />
                  </Picker>
                </View>
              )}
            />
          </View>
        </View>

        <Button
          title="Thêm nhà cung cấp"
          onPress={handleSubmit(onSubmit)}
          buttonContainerStyle={styles.buttonContainer}
          loading={isSubmitting}
          disabled={isSubmitting}
        />
      </ScrollView>
    </BaseLayout>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.backgroundColor,
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
    fontSize: scaledSize(20),
    fontWeight: 'bold',
    color: color.primaryColor,
    marginBottom: scaleHeight(15),
    textAlign: 'center',
  },
  label: {
    fontSize: scaledSize(20),
    color: color.accentColor.grayColor,
    marginBottom: scaleHeight(5),
  },
  inputContainer: {
    marginBottom: scaleHeight(15),
  },
  buttonContainer: {
    marginHorizontal: scaleWidth(16),
    marginTop: scaleHeight(10),
    marginBottom: scaleHeight(20),
  },
  errorText: {
    color: color.accentColor.errorColor,
    fontSize: scaledSize(20),
    marginTop: scaleHeight(5),
  },
  pickerContainer: {
    backgroundColor: color.accentColor.whiteColor,
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: color.accentColor.grayColor + '50',
  },
  picker: {
    height: scaleHeight(50),
  },
});

export default AddProviderScreen;
