import {Image, StyleSheet, TouchableOpacity, View} from 'react-native';
import React, {useState} from 'react';
import {useNavigation} from '@react-navigation/native'; // Import useNavigation
import {
  BaseLayout,
  Button,
  DynamicText,
  Header,
  Input,
} from '../../../components';
import {color, scaledSize, scaleHeight} from '../../../utils';
import {Fonts, Images} from '../../../assets';
import {Controller, useForm} from 'react-hook-form';
import {contents} from '../../../context';
import {RegexPatterns} from '../../../constants';
import Icon from 'react-native-vector-icons/Ionicons';
import RNPickerSelect from 'react-native-picker-select';

const CreatePasswordScreen = () => {
  const navigation = useNavigation(); // Khai báo navigation

  const {
    control,
    handleSubmit,
    formState: {errors},
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
      <Header title="Đặt lại mật khẩu" showBackIcon onPressBack={() => {}} />
      <Image source={Images.LOCK} style={styles.logoImage} />
      <View style={styles.form}>
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
            <View style={styles.passwordContainer}>
              <Input
                placeholderText={contents.login.password_placeholder1}
                onChangeText={onChange}
                value={value}
                secureTextEntry={!isPasswordVisible}
              />
              <TouchableOpacity
                onPress={togglePasswordVisibility}
                style={styles.eyeIcon}>
                <Icon
                  name={isPasswordVisible ? 'eye' : 'eye-off'}
                  size={20}
                  color="gray"
                />
              </TouchableOpacity>
              {errors.password && (
                <DynamicText style={styles.errorText}>
                  {errors.password.message}
                </DynamicText>
              )}
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
            <View style={styles.passwordContainer}>
              <Input
                placeholderText={contents.login.password_placeholder2}
                onChangeText={onChange}
                value={value}
                secureTextEntry={!isPasswordVisible}
              />
              <TouchableOpacity
                onPress={togglePasswordVisibility}
                style={styles.eyeIcon}>
                <Icon
                  name={isPasswordVisible ? 'eye' : 'eye-off'}
                  size={20}
                  color="gray"
                />
              </TouchableOpacity>
              {errors.password && (
                <DynamicText style={styles.errorText}>
                  {errors.password.message}
                </DynamicText>
              )}
            </View>
          )}
        />

        {/* Button Đăng nhập */}
        <Button
          title={contents.login.next}
          onPress={handleSubmit(onSubmit)}
          buttonContainerStyle={styles.buttonContainer}
        />
      </View>

      {/* Dropdown chọn ngôn ngữ */}
      <View style={styles.languagePickerContainer}>
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
    </BaseLayout>
  );
};

export default CreatePasswordScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: scaleHeight(20),
  },
  logoImage: {
    width: scaledSize(320),
    height: scaledSize(120),
    resizeMode: 'contain',
    alignSelf: 'center',
    marginTop: scaleHeight(70),
  },
  form: {
    gap: scaleHeight(20),
    marginTop: scaleHeight(80),
  },
  errorText: {
    color: color.accentColor.errorColor,
  },
  buttonContainer: {
    marginTop: scaleHeight(10),
  },
  forgotPassword: {
    alignSelf: 'center',
    fontSize: scaledSize(14),
    fontFamily: Fonts.Inter_SemiBold,
    color: color.primaryColor,
    marginTop: scaleHeight(25),
  },
  passwordContainer: {
    position: 'relative',
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    top: 15,
  },
  languagePickerContainer: {
    marginTop: scaleHeight(90),
    alignSelf: 'center',
    width: '80%',
    paddingVertical: 8,
    paddingHorizontal: 50,
    marginLeft: 20,
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
