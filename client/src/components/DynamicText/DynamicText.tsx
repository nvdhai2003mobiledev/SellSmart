import React from 'react';
import {StyleProp, StyleSheet, Text, TextStyle, TextProps} from 'react-native';
import {useTextColor} from '../../hooks';
import {Fonts} from '../../assets';

export type DynamicTextProps = React.PropsWithChildren &
  TextProps & {
    style?: StyleProp<TextStyle>;
  };

export const DynamicText = ({
  style,
  children,
  ...restProps
}: DynamicTextProps) => {
  const textColor = useTextColor();

  return (
    <Text style={[styles.text, {color: textColor}, style]} {...restProps}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  text: {
    fontFamily: Fonts.Inter_Regular,
  },
});
