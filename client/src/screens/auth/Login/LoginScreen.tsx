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
import {Platform} from 'react-native';

interface LoginForm {
  usernameOrEmail: string;
  password: string;
}

interface MobileLoginResponse {
  status: boolean;
  message?: string;
  data?: any;
  token?: string;
  refreshToken?: string;
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
      usernameOrEmail: '',
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

      console.log('Đang đăng nhập với:', data.usernameOrEmail);

      // Hiển thị API endpoint theo platform
      const apiUrl =
        Platform.OS === 'android'
          ? 'http://10.0.2.2:8000'
          : 'http://localhost:8000';

      console.log(
        'Gửi request đăng nhập tới:',
        `${apiUrl}${ApiEndpoint.MOBILE_LOGIN}`,
      );

      const response = await Api.post<MobileLoginResponse>(
        ApiEndpoint.MOBILE_LOGIN,
        {
          usernameOrEmail: data.usernameOrEmail,
          password: data.password,
        },
      );

      console.log('Trạng thái phản hồi:', response.status);
      console.log('Vấn đề API:', response.problem || 'Không có vấn đề');
      console.log('Dữ liệu nhận về:', response.data);

      if (response.ok && response.data?.status) {
        const userData = response.data.data;
        const authData = {
          userId: userData._id,
          role: userData.role,
          fullName: userData.fullName,
          email: userData.email,
          accessToken: response.data.token,
          refreshToken: response.data.refreshToken,
          expiresIn: 3600, // Mặc định 1 giờ
          avatar: userData.avatar,
          phoneNumber: userData.phoneNumber,
          address: userData.address,
          gender: userData.gender,
          dob: userData.dob,
        };

        console.log('Đăng nhập thành công với vai trò:', userData.role);
        await rootStore.auth.setAuth(authData);
      } else {
        // Xử lý các loại lỗi khác nhau
        let errorMsg = 'Đăng nhập thất bại. Vui lòng thử lại.';

        if (response.problem === 'NETWORK_ERROR') {
          errorMsg =
            'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và đảm bảo server đang chạy.';
        } else if (response.problem === 'TIMEOUT_ERROR') {
          errorMsg =
            'Yêu cầu đăng nhập mất quá nhiều thời gian. Vui lòng thử lại.';
        } else if (response.problem === 'SERVER_ERROR') {
          errorMsg = 'Máy chủ gặp lỗi. Vui lòng liên hệ quản trị viên.';
        } else if (response.data?.message) {
          errorMsg = response.data.message;
        }

        setError(errorMsg);
        console.log('Lỗi đăng nhập:', errorMsg);
      }
    } catch (err) {
      const error = err as Error;
      setError('Đã có lỗi xảy ra khi đăng nhập');
      console.error('Lỗi ngoại lệ khi đăng nhập:', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseLayout style={styles.container}>
      <Image source={Images.LOGO_TEXT} style={styles.logoImage} />
      <DynamicText style={styles.welcomeText}>Chào mừng trở lại!</DynamicText>
      <DynamicText style={styles.descriptionText}>
        Đăng nhập để tiếp tục sử dụng ứng dụng
      </DynamicText>
      <View style={styles.form}>
        {/* Tài khoản hoặc Email */}
        <Controller
          control={control}
          name="usernameOrEmail"
          rules={{
            required: contents.login.username_required,
          }}
          render={({field: {onChange, value}}) => (
            <View>
              <Input
                inputType="username"
                placeholderText={contents.login.username_placeholder}
                onChangeText={onChange}
                value={value}
                showClearIcon={true}
                error={errors.usernameOrEmail?.message}
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
              value: 6,
              message: contents.login.password_min_length,
            },
            pattern: {
              value: RegexPatterns.PASSWORD,
              message: contents.login.password_pattern,
            },
          }}
          render={({field: {onChange, value}}) => (
            <Input
              inputType="password"
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
    width: scaledSize(400),
    height: scaledSize(300),
    resizeMode: 'contain',
    alignSelf: 'center',
  },
  welcomeText: {
    fontSize: scaledSize(32),
    fontFamily: Fonts.Inter_SemiBold,
    color: color.primaryColor,
    textAlign: 'center',
    marginBottom: scaleHeight(10),
  },
  descriptionText: {
    fontSize: scaledSize(20),
    fontFamily: Fonts.Inter_Regular,
    color: color.accentColor.grayColor,
    textAlign: 'center',
    marginBottom: scaleHeight(20),
  },
  form: {
    width: '100%',
    gap: scaleHeight(26),
    marginTop: scaleHeight(10),
    padding: scaleHeight(20),
    maxWidth: scaleWidth(500),
    maxHeight: scaleHeight(700),
    alignSelf: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: color.accentColor.errorColor,
    textAlign: 'center',
    marginBottom: scaleHeight(10),
  },
  buttonContainer: {
    marginTop: scaleHeight(20),
    width: '100%',
    alignSelf: 'center',
    justifyContent: 'center',
  },
  forgotPassword: {
    alignSelf: 'center',
    fontSize: scaledSize(22),
    fontFamily: Fonts.Inter_SemiBold,
    color: color.primaryColor,
  },
});
