import {Image, StyleSheet, TouchableOpacity, View} from 'react-native';
import React, {useState} from 'react';
import {NavigationProp, useNavigation} from '@react-navigation/native';
import {BaseLayout, Button, DynamicText, Input} from '../../../components';
import {color, scaledSize, scaleHeight, scaleWidth} from '../../../utils';
import {Fonts, Images} from '../../../assets';
import {Controller, useForm} from 'react-hook-form';
import {contents} from '../../../context';
import {RegexPatterns} from '../../../constants';
import {RootStackParamList, Screen} from '../../../navigation/navigation.type';
import {rootStore} from '../../../models/root-store';
import {Api} from '../../../services/api/api';
import {ApiEndpoint} from '../../../services/api/api-endpoint';
import {observer} from 'mobx-react-lite';

interface LoginForm {
  username: string;
  password: string;
}

interface MobileLoginResponse {
  success: boolean;
  message?: string;
  data?: {
    accessToken: string;
    tokenType: string;
    refreshToken: string;
    expiresIn: number;
    userId: string;
    role: 'admin' | 'employee';
    fullName: string;
    email: string;
  };
}

const LoginScreen = observer(() => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: {errors},
  } = useForm<LoginForm>({
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const onSubmit = async (data: LoginForm) => {
    try {
      setLoading(true);
      setError(null);
  
      const response = await Api.post<MobileLoginResponse>(
        ApiEndpoint.MOBILE_LOGIN,
        {
          email: data.username,
          password: data.password,
        },
      );
  
      if (response.ok && response.data?.success) {
        const authData = response.data.data!;
        rootStore.auth.setAuth(authData);
  
        // Log token để kiểm tra
        console.log('Access Token:', authData.accessToken);
        console.log('Refresh Token:', authData.refreshToken);
      } else {
        setError(response.data?.message || 'Đăng nhập thất bại');
        console.log('Login response:', response.data);
      }
    } catch (err) {
      setError('Đã có lỗi xảy ra khi đăng nhập');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
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
        {error && <DynamicText style={styles.errorText}>{error}</DynamicText>}
        {/* Button Đăng nhập */}
        <Button
          title={contents.login.button_title}
          onPress={handleSubmit(onSubmit)}
          buttonContainerStyle={styles.buttonContainer}
          loading={loading}
          disabled={loading}
        />
        {/* Forgot password */}
        <TouchableOpacity
          onPress={() => navigation.navigate(Screen.FORGOT_PASSWORD)}>
          <DynamicText style={styles.forgotPassword}>
            {contents.login.forgot_password}
          </DynamicText>
        </TouchableOpacity>
      </View>
    </BaseLayout>
  );
});

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
    textAlign: 'center',
    marginBottom: scaleHeight(10),
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
});
