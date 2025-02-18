import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle } from 'react-native';
import { useTextColor } from '../../hooks';
import { Fonts } from '../../assets';

export type DynamicTextProps = React.PropsWithChildren & {
  style?: StyleProp<TextStyle>;
};
export const DynamicText = ({ style, children }: DynamicTextProps) => {
  const textColor = useTextColor();

  return (
    <Text style={[styles.text, { color: textColor }, style]}>{children}</Text>
  );
};

const styles = StyleSheet.create({
  text: {
    fontFamily: Fonts.Inter_Regular,
  },
});
