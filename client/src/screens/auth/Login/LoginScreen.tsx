import {Image, StyleSheet, TouchableOpacity, View} from 'react-native';
import React, {useState} from 'react';
import {NavigationProp, useNavigation} from '@react-navigation/native'; // Import useNavigation and NavigationProp
import {BaseLayout, Button, DynamicText, Input} from '../../../components';
import {color, scaledSize, scaleHeight, scaleWidth} from '../../../utils';
import {Fonts, Images} from '../../../assets';
import {Controller, useForm} from 'react-hook-form';
import {contents} from '../../../context';
import {RegexPatterns} from '../../../constants';
import {RootStackParamList, Screen} from '../../../navigation/navigation.type';

const LoginScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const {
    control,
    handleSubmit,
    formState: {errors},
    watch,
  } = useForm({
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('vi'); // Mặc định tiếng Việt

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const onSubmit = (data: any) => {
    console.log(data);
  };

  return (
    <BaseLayout style={styles.container}>
      <Image source={Images.LOGO_TEXT} style={styles.logoImage} />
      <View style={styles.form}>
        {/* Tài khoản */}
        <Controller
          control={control}
          name="username"
          rules={{
            required: contents.login.username_required,
          }}
          render={({field: {onChange, value}}) => (
            <View>
              <Input
                placeholderText={contents.login.username_placeholder}
                onChangeText={onChange}
                value={value}
                showClearIcon={true}
                error={errors.username?.message}
              />
            </View>
          )}
        />
        {/* Mật khẩu */}
        <Controller
          control={control}
          name="password"
          rules={{
            required: contents.login.password_required,
            minLength: {
              value: 8,
              message: contents.login.password_min_length,
            },
            pattern: {
              value: RegexPatterns.PASSWORD,
              message: contents.login.password_pattern,
            },
          }}
          render={({field: {onChange, value}}) => (
            <Input
              placeholderText={contents.login.password_placeholder}
              onChangeText={onChange}
              value={value}
              showClearIcon={true}
              showPasswordIcon={true}
              onTogglePassword={togglePasswordVisibility}
              secureTextEntry={!isPasswordVisible}
              error={errors.password?.message}
            />
          )}
        />
        {/* Button Đăng nhập */}
        <Button
          title={contents.login.button_title}
          onPress={handleSubmit(onSubmit)}
          buttonContainerStyle={styles.buttonContainer}
        />
        {/* Forgot password */}
        <TouchableOpacity
          onPress={() => navigation.navigate(Screen.FORGOT_PASSWORD)}>
          <DynamicText style={styles.forgotPassword}>
            {contents.login.forgot_password}
          </DynamicText>
        </TouchableOpacity>
      </View>

      {/* Dropdown chọn ngôn ngữ */}
      {/* <View style={styles.languagePickerContainer}>
        <View>
          <RNPickerSelect
            onValueChange={value => setSelectedLanguage(value)}
            items={[
              {label: '🇻🇳 Tiếng Việt', value: 'vi'},
              {label: '🇬🇧 English', value: 'en'},
            ]}
            style={pickerSelectStyles}
            value={selectedLanguage}
          />
        </View>
      </View> */}
    </BaseLayout>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  logoImage: {
    width: scaledSize(330),
    height: scaledSize(130),
    resizeMode: 'contain',
    alignSelf: 'center',
    marginLeft: scaleWidth(30),
    marginTop: scaleHeight(100),
  },
  form: {
    gap: scaleHeight(20),
    marginTop: scaleHeight(80),
    padding: scaleHeight(10),
  },
  errorText: {
    color: color.accentColor.errorColor,
  },
  buttonContainer: {
    marginTop: scaleHeight(10),
  },
  forgotPassword: {
    alignSelf: 'center',
    fontSize: scaledSize(15),
    fontFamily: Fonts.Inter_SemiBold,
    color: color.primaryColor,
  },
  languagePickerContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
});

// Style cho dropdown
const pickerSelectStyles = {
  inputIOS: {
    fontSize: 16,
    padding: 10,
    borderRadius: 5,
    color: color.accentColor.darkColor,
  },
  inputAndroid: {
    fontSize: 16,
    padding: 10,
    borderRadius: 5,
    color: color.accentColor.darkColor,
  },
};
