import {
  StyleProp,
  StyleSheet,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import React from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTextColor} from '../../hooks';
import {scaledSize, scaleHeight} from '../../utils';
import {DynamicText} from '../DynamicText/DynamicText';
import {Fonts} from '../../assets';
import {ArrowLeft, ArrowLeft2, ArrowLeft3} from 'iconsax-react-native';

interface HeaderProps {
  headerStyle?: StyleProp<ViewStyle>;
  title: React.ReactNode;
  titleStyle?: StyleProp<TextStyle>;
  showBackIcon?: boolean;
  onPressBack?: () => void;
  showRightIcon?: boolean;
  onPressRight?: () => void;
  RightIcon?: React.ReactNode;
}

export const Header = (props: HeaderProps) => {
  const {
    headerStyle,
    title,
    titleStyle,
    showBackIcon,
    showRightIcon,
    onPressBack,
    onPressRight,
    RightIcon,
  } = props;
  const textColor = useTextColor();
  return (
    <View style={[styles.container, headerStyle]}>
      <View style={styles.leftContainer}>
        {showBackIcon && (
          <ArrowLeft2
            size={scaledSize(28)}
            color={textColor}
            variant="Linear"
            onPress={onPressBack}
          />
        )}
      </View>
      <View style={styles.titleContainer}>
        <DynamicText style={[styles.title, titleStyle]}>{title}</DynamicText>
      </View>
      <View style={styles.rightContainer}>
        {showRightIcon && (
          <TouchableOpacity onPress={onPressRight}>
            <View>{RightIcon}</View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scaleHeight(15),
    marginBottom: scaleHeight(20),
    paddingHorizontal: scaledSize(16),
  },
  leftContainer: {
    width: scaledSize(28),
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightContainer: {
    width: scaledSize(28),
    alignItems: 'flex-end',
  },
  title: {
    fontSize: scaledSize(30),
    fontFamily: Fonts.Inter_SemiBold,
  },
});
