import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
  ViewStyle,
} from 'react-native';

import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { color, moderateScale, scaledSize, scaleHeight } from '../../utils';
import { Fonts } from '../../assets';


const AnimatedButtonComponent =
  Animated.createAnimatedComponent(TouchableOpacity);

interface ExtraButtonProps {
  buttonContainerStyle?: StyleProp<ViewStyle>;
  titleContainerStyle?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  title?: React.ReactNode;
  hasShadow?: boolean;
}

const shadowStyle = {
  shadowColor: color.accentColor.darkColor,
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.2,
  shadowRadius: 8,
  elevation: 4,
};

export type AnimatedButtonProps = Omit<
  TouchableOpacityProps,
  'onPressIn' | 'onPressOut' | 'style'
> & {
  containerStyle?: StyleProp<ViewStyle>;
};

export type ButtonProps = AnimatedButtonProps & ExtraButtonProps;

export const AnimatedTouchableOpacity = React.memo(
  (props: AnimatedButtonProps) => {
    const { containerStyle } = props;
    const scaleValue = useSharedValue(1);

    const animatedButtonStyle = useAnimatedStyle(() => {
      return {
        transform: [{ scale: scaleValue.value }],
      };
    });

    return (
      <AnimatedButtonComponent
        style={[containerStyle, animatedButtonStyle]}
        onPressIn={() => (scaleValue.value = withSpring(0.9))}
        onPressOut={() => (scaleValue.value = withSpring(1))}
        activeOpacity={0.8}
        {...props}>
        {props.children}
      </AnimatedButtonComponent>
    );
  },
);

export const Button = React.memo((props: ButtonProps) => {
  const {
    buttonContainerStyle,
    title,
    titleContainerStyle,
    titleStyle,
    hasShadow = true,
  } = props;

  return (
    <AnimatedTouchableOpacity
      containerStyle={[
        styles.buttonContainer,
        buttonContainerStyle,
        hasShadow && shadowStyle,
      ]}
      {...props}>
      <View style={[styles.titleContainer, titleContainerStyle]}>
        <Text style={[styles.titleStyle, titleStyle]}>{title}</Text>
      </View>
    </AnimatedTouchableOpacity>
  );
});

const styles = StyleSheet.create({
  buttonContainer: {
    alignItems: 'center',
    backgroundColor: color.primaryColor,
    borderRadius: moderateScale(14),
    height: scaleHeight(50),
    width: '100%',
  },
  titleContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  titleStyle: {
    fontFamily: Fonts.Inter_SemiBold,
    fontSize: scaledSize(16),
    color: color.accentColor.whiteColor,
  },
});
