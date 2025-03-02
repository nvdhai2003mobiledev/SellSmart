import { Image, StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { BaseLayout, Button, DynamicText, Input } from '../../../components';
import { color, scaledSize, scaleHeight } from '../../../utils';
import { Fonts, Images } from '../../../assets';
import { Controller, useForm } from 'react-hook-form';
import { contents } from '../../../context';
import { CloseCircle } from 'iconsax-react-native';
import { RegexPatterns } from '../../../constants';

const LoginScreen = () => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = (data: any) => {
    console.log(data);
  };
  return (
    <BaseLayout style={styles.container}>
      <Image source={Images.LOGO} style={styles.logoImage} />
      <View style={styles.form}>
        {/* Tai khoan */}
        <Controller
          control={control}
          name="username"
          rules={{
            required: contents.login.username_required,
          }}
          render={({ field: { onChange, value } }) => (
            <View>
              <Input
                placeholderText={contents.login.username_placeholder}
                onChangeText={onChange}
                value={value}
                iconType="clear"

              />
              {errors.username && (
                <DynamicText style={styles.errorText}>
                  {errors.username.message}
                </DynamicText>
              )}
            </View>
          )}
        />
        {/* Mat khau */}
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
              value:
                RegexPatterns.PASSWORD,
              message:
                contents.login.password_pattern,
            },
          }}
          render={({ field: { onChange, value } }) => (
            <View>
              <Input
                placeholderText={contents.login.password_placeholder}
                onChangeText={onChange}
                value={value}
                iconType="clear"
                secureTextEntry={true}
              />
              {errors.password && (
                <DynamicText style={styles.errorText}>
                  {errors.password.message}
                </DynamicText>
              )}
            </View>
          )}
        />
        {/* Button */}
        <Button
          title={contents.login.button_title}
          onPress={handleSubmit(onSubmit)}
          buttonContainerStyle={styles.buttonContainer}
        />
      </View>
      {/* Forgot password */}
      <DynamicText style={styles.forgotPassword}>{contents.login.forgot_password}</DynamicText>
    </BaseLayout>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  logoImage: {
    width: scaledSize(120),
    height: scaledSize(120),
    resizeMode: 'contain',
    alignSelf: 'center',
    marginTop: scaleHeight(80),
  },
  form: {
    gap: scaleHeight(20),
    marginTop: scaleHeight(80),
    padding:scaleHeight(10)
  },
  errorText: {
    color: color.accentColor.errorColor,
  },
  buttonContainer: {
    marginTop: scaleHeight(10)
  },
  forgotPassword: {
    alignSelf: 'center',
    fontSize: scaledSize(14),
    fontFamily: Fonts.Inter_SemiBold,
    color: color.primaryColor,
    marginTop: scaleHeight(25)
  },
});
