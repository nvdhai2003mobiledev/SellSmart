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
import {
  CloseCircle,
  Eye,
  EyeSlash,
  User,
  Message,
  Lock,
} from 'iconsax-react-native';
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
  StartIcon?: React.ReactNode;
  inputType?: 'default' | 'username' | 'email' | 'password';
  onIconPress?: () => void;
  showClearIcon?: boolean;
  showPasswordIcon?: boolean;
  onTogglePassword?: () => void;
  error?: string;
  editable?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  textAlignVertical?: 'auto' | 'top' | 'bottom' | 'center';
  inputStyle?: StyleProp<ViewStyle>;
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
    StartIcon,
    inputType = 'default',
    onIconPress,
    showClearIcon = false,
    showPasswordIcon = false,
    onTogglePassword,
    error,
    editable = true,
    multiline = false,
    numberOfLines,
    textAlignVertical,
    inputStyle,
  } = props;

  const textColor = useTextColor();

  const clearInput = () => {
    onChangeText?.('');
  };

  // Render icon theo inputType
  const renderStartIcon = () => {
    if (StartIcon) return StartIcon;

    switch (inputType) {
      case 'username':
        return (
          <User
            size={scaledSize(24)}
            color={color.accentColor.grayColor}
            variant="Linear"
          />
        );
      case 'email':
        return (
          <Message
            size={scaledSize(24)}
            color={color.accentColor.grayColor}
            variant="Linear"
          />
        );
      case 'password':
        return (
          <Lock
            size={scaledSize(24)}
            color={color.accentColor.grayColor}
            variant="Linear"
          />
        );
      default:
        return null;
    }
  };

  const startIcon = renderStartIcon();

  return (
    <View>
      <View
        style={[
          styles.inputContainer,
          error ? styles.inputContainerError : {},
          !editable && styles.inputContainerDisabled,
          inputContainerStyle,
        ]}>
        {startIcon && (
          <View style={styles.startIconContainer}>{startIcon}</View>
        )}
        <TextInput
          style={[
            styles.input,
            {color: textColor},
            multiline && styles.multilineInput,
            multiline && textAlignVertical && {textAlignVertical},
            startIcon && styles.inputWithStartIcon,
            inputStyle,
          ]}
          placeholder={placeholderText}
          placeholderTextColor={color.accentColor.grayColor}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          autoFocus={autoFocus || false}
          keyboardType={keyboardType}
          onSubmitEditing={!multiline ? Keyboard.dismiss : undefined}
          editable={editable}
          multiline={multiline}
          numberOfLines={numberOfLines}
        />
        <View style={styles.rightContainer}>
          {showClearIcon && value.length > 0 && editable && (
            <TouchableOpacity onPress={clearInput}>
              <CloseCircle
                color={color.accentColor.closeColor}
                size={scaledSize(24)}
                variant="Bulk"
              />
            </TouchableOpacity>
          )}

          {showPasswordIcon && (
            <TouchableOpacity onPress={onTogglePassword}>
              {secureTextEntry ? (
                <Eye
                  color={color.accentColor.grayColor}
                  size={scaledSize(24)}
                  variant="Linear"
                />
              ) : (
                <EyeSlash
                  color={color.accentColor.grayColor}
                  size={scaledSize(24)}
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
    height: scaleHeight(80),
    borderRadius: moderateScale(10),
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
  inputContainerDisabled: {
    backgroundColor: color.accentColor.grayColor + '20',
    borderColor: color.accentColor.grayColor + '30',
  },
  input: {
    flex: 1,
    fontSize: scaledSize(22),
    fontFamily: Fonts.Inter_Regular,
    paddingVertical: scaleHeight(8),
    textAlignVertical: 'center',
    includeFontPadding: false,
    padding: 0,
  },
  inputWithStartIcon: {
    marginLeft: scaleWidth(10),
  },
  multilineInput: {
    height: 'auto',
    paddingTop: scaleHeight(12),
    paddingBottom: scaleHeight(12),
    minHeight: scaleHeight(100),
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  startIconContainer: {
    marginRight: scaleWidth(8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: color.accentColor.errorColor,
    fontSize: scaledSize(18),
    marginHorizontal: scaleWidth(6),
    marginTop: scaleHeight(4),
  },
});
