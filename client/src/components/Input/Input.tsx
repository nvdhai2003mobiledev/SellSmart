import {
  Keyboard,
  KeyboardType,
  StyleProp,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import React from 'react';
import { useTextColor } from '../../hooks';
import { color, moderateScale, scaled, scaledSize, scaleHeight, scaleWidth } from '../../utils';
import { Fonts } from '../../assets';
import { CloseCircle } from 'iconsax-react-native';

interface InputProps {
  inputContainerStyle?: StyleProp<ViewStyle>;
  placeholderText?: string;
  onChangeText?: (value: string) => void;
  value?: string; // Đảm bảo value là string
  secureTextEntry?: boolean;
  autoFocus?: boolean;
  keyboardType?: KeyboardType;
  EndIcon?: React.ReactNode;
  onIconPress?: () => void;
  iconType?: 'clear' | 'password' | 'custom';
}

export const Input = React.memo((props: InputProps) => {
  const {
    inputContainerStyle,
    placeholderText,
    onChangeText,
    value = '',
    secureTextEntry,
    autoFocus,
    keyboardType,
    EndIcon,
    onIconPress,
    iconType,
  } = props;
  const textColor = useTextColor();
  const clearIcon = () => {
    onChangeText?.('');
  };
  return (
    <View style={[styles.inputContainer, inputContainerStyle]}>
      <TextInput
        style={[styles.input, { color: textColor }]}
        placeholder={placeholderText}
        placeholderTextColor={color.accentColor.grayColor}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        autoFocus={autoFocus || false}
        keyboardType={keyboardType}
        onSubmitEditing={Keyboard.dismiss}
      />
      {iconType === 'clear' && value.length > 0 && (
        <TouchableOpacity onPress={clearIcon}>
          <CloseCircle color={color.accentColor.closeColor} size={scaledSize(18)} variant='Bulk' />
        </TouchableOpacity>
      )}
      {iconType === 'password' && EndIcon && (
        <TouchableOpacity onPress={onIconPress}>
          <View>{EndIcon}</View>
        </TouchableOpacity>
      )}
      {iconType === 'custom' && EndIcon && (
        <TouchableOpacity onPress={onIconPress}>
          <View>{EndIcon}</View>
        </TouchableOpacity>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    width: '100%',
    height: scaleHeight(45),
    borderRadius: moderateScale(14),
    borderWidth: 0.5,
    backgroundColor: color.inputColor,
    borderColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: scaleWidth(20),
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: scaledSize(14),
    fontFamily: Fonts.Inter_Regular,
  },
});
