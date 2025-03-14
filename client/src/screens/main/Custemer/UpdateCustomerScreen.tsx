import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { useNavigation } from '@react-navigation/native';
import { BaseLayout, Button, DynamicText, Header, Input } from '../../../components';
import { color, moderateScale, scaledSize, scaleHeight, scaleWidth } from '../../../utils';
import { Picker } from '@react-native-picker/picker';
import { contents } from '../../../context';
import { RegexPatterns } from '../../../constants';
import { Images } from '../../../assets';

const UpdateCustomerScreen = () => {
  const navigation = useNavigation();
  const [avatar, setAvatar] = useState<string>('https://via.placeholder.com/100');

  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      employeeId: '',
      fullName: '',
      gender: '',
      phone: '',
      email: '',
      birthDate: '',
      address: '',
      position: '',
    },
  });

  const onSubmit = (data: any) => {
    console.log(data);
  };

  return (
    <BaseLayout style={styles.container}>
      <Header
              title={contents.updatecustomer.title}
              showBackIcon={true}
              onPressBack={() => navigation.goBack()}
              showRightIcon={true}
              RightIcon={false}
            />
            <View style={styles.card}>
             <DynamicText >{contents.updatecustomer.show}</DynamicText>
      <View style={styles.avatarContainer}>
  <Image source={Images.SHOP} style={{ width: scaleWidth(50), height: scaleHeight(50), borderRadius: 50 }} />
</View>
      
     
        <Text style={styles.label}>{contents.updatecustomer.text}</Text>

        {/* Họ và tên */}
        <View style={styles.inputContainer}>
          <Controller
            control={control}
            name="fullName"
            rules={{ required: contents.updatecustomer.username_required, pattern: { value: RegexPatterns.USERNAME, message:contents.updatecustomer.username_length } }}
            render={({ field: { onChange, value } }) => (
              <Input placeholderText={contents.updatecustomer.username} onChangeText={onChange} value={value} />
            )}
          />
          {errors.fullName && <DynamicText style={styles.errorText}>{errors.fullName.message}</DynamicText>}
        </View>

        {/* Giới tính */}
        <View style={styles.inputContainer}>
          <Controller
            control={control}
            name="gender"
            render={({ field: { onChange, value } }) => (
              <View style={styles.pickerContainer}>
                <Picker selectedValue={value} onValueChange={onChange} style={styles.picker}>
                  <Picker.Item label={contents.updatecustomer.gender} value="" />
                  <Picker.Item label="Nam" value="male" />
                  <Picker.Item label="Nữ" value="female" />
                </Picker>
              </View>
            )}
          />
          {errors.gender && <DynamicText style={styles.errorText}>{errors.gender.message}</DynamicText>}
        </View>

        {/* Số điện thoại */}
        <View style={styles.inputContainer}>
          <Controller
            control={control}
            name="phone"
            rules={{ required: contents.updatecustomer.phone_required, pattern: { value: RegexPatterns.PHONE_NUMBER, message: contents.updatecustomer.phone_length } }}
            render={({ field: { onChange, value } }) => (
              <Input placeholderText={contents.updatecustomer.phone} keyboardType="phone-pad" onChangeText={onChange} value={value} />
            )}
          />
          {errors.phone && <DynamicText style={styles.errorText}>{errors.phone.message}</DynamicText>}
        </View>

        {/* Email */}
        <View style={styles.inputContainer}>
          <Controller
            control={control}
            name="email"
            rules={{ required: contents.updatecustomer.email_required, pattern: { value: RegexPatterns.EMAIL, message: contents.updatecustomer.email_length } }}
            render={({ field: { onChange, value } }) => (
              <Input placeholderText={contents.updatecustomer.email} keyboardType="email-address" onChangeText={onChange} value={value} />
            )}
          />
          {errors.email && <DynamicText style={styles.errorText}>{errors.email.message}</DynamicText>}
        </View>

        {/* Ngày sinh */}
        <View style={styles.inputContainer}>
          <Controller
            control={control}
            name="birthDate"
            rules={{ required: contents.updatecustomer.day_required }}
            render={({ field: { onChange, value } }) => (
              <Input placeholderText={contents.updatecustomer.day} onChangeText={onChange} value={value} />
            )}
          />
          {errors.birthDate && <DynamicText style={styles.errorText}>{errors.birthDate.message}</DynamicText>}
        </View>

        {/* Địa chỉ */}
        <View style={styles.inputContainer}>
          <Controller
            control={control}
            name="address"
            rules={{ required: contents.updatecustomer.adress_required }}
            render={({ field: { onChange, value } }) => (
              <Input placeholderText={contents.updatecustomer.address} onChangeText={onChange} value={value} />
            )}
          />
          {errors.address && <DynamicText style={styles.errorText}>{errors.address.message}</DynamicText>}
        </View>
      </View>
<Button
          title={contents.updatestaff.button_title}
          onPress={handleSubmit(onSubmit)}
          buttonContainerStyle={styles.buttonContainer}
        />
    </BaseLayout>
  );
};

export default UpdateCustomerScreen;
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F7', padding: scaledSize(1) },
  avatarContainer: { alignItems: 'center', marginVertical: scaledSize(20) }, 
  avatar: {
    width: scaleWidth(50),
    height: scaleHeight(50),
    borderRadius: scaledSize(20),
    marginRight: scaleWidth(12),
    justifyContent: 'center'
  },
  card: { backgroundColor: '#FFF', borderRadius: 10, padding: scaledSize(2) },
  label: { fontSize: scaledSize(14), color: '#888', marginBottom: scaleHeight(-19) },
  inputContainer: { marginBottom: scaleHeight(15) },
  pickerContainer: { backgroundColor: '#F0F0F0', borderRadius: moderateScale(8), marginBottom: scaleHeight(15) },
  picker: { height: scaleHeight(50), width: '100%' },
  buttonContainer: {
    marginTop: scaleHeight(10)
  },
  errorText: { color: color.accentColor.errorColor },
});
