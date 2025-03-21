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
import {useTextColor} from '../../hooks';
import {
  color,
  moderateScale,
  scaledSize,
  scaleHeight,
  scaleWidth,
} from '../../utils';
import {Fonts} from '../../assets';
import {CloseCircle, Eye, EyeSlash} from 'iconsax-react-native';
import {DynamicText} from '../DynamicText/DynamicText.tsx';

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
  showClearIcon?: boolean;
  showPasswordIcon?: boolean;
  onTogglePassword?: () => void;
  error?: string;
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
    showClearIcon = false,
    showPasswordIcon = false,
    onTogglePassword,
    error,
  } = props;

  const textColor = useTextColor();

  const clearInput = () => {
    onChangeText?.('');
  };

  return (
    <View>
      <View
        style={[
          styles.inputContainer,
          error ? styles.inputContainerError : {},
          inputContainerStyle,
        ]}>
        <TextInput
          style={[styles.input, {color: textColor}]}
          placeholder={placeholderText}
          placeholderTextColor={color.accentColor.grayColor}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          autoFocus={autoFocus || false}
          keyboardType={keyboardType}
          onSubmitEditing={Keyboard.dismiss}
        />
        <View style={styles.rightContainer}>
          {showClearIcon && value.length > 0 && (
            <TouchableOpacity onPress={clearInput}>
              <CloseCircle
                color={color.accentColor.closeColor}
                size={scaledSize(18)}
                variant="Bulk"
              />
            </TouchableOpacity>
          )}

          {showPasswordIcon && (
            <TouchableOpacity onPress={onTogglePassword}>
              {secureTextEntry ? (
                <Eye
                  color={color.accentColor.grayColor}
                  size={scaledSize(18)}
                  variant="Linear"
                />
              ) : (
                <EyeSlash
                  color={color.accentColor.grayColor}
                  size={scaledSize(18)}
                  variant="Linear"
                />
              )}
            </TouchableOpacity>
          )}

          {EndIcon && (
            <TouchableOpacity onPress={onIconPress}>{EndIcon}</TouchableOpacity>
          )}
        </View>
      </View>
      {error && <DynamicText style={styles.errorText}>{error}</DynamicText>}
    </View>
  );
});

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    width: '100%',
    height: scaleHeight(50),
    borderRadius: moderateScale(14),
    borderWidth: 0.5,
    backgroundColor: color.inputColor,
    borderColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: scaleWidth(16),
    alignItems: 'center',
  },
  // Add error style with red border
  inputContainerError: {
    borderColor: color.accentColor.errorColor,
    borderWidth: 0.5,
  },
  input: {
    flex: 1,
    fontSize: scaledSize(14),
    fontFamily: Fonts.Inter_Regular,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  errorText: {
    color: color.accentColor.errorColor,
    fontSize: scaledSize(12),
    marginHorizontal: scaleWidth(6),
    marginTop: scaleHeight(4),
  },
});
