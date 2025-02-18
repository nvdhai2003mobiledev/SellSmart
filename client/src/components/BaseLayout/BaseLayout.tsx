import React from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleProp,
  StyleSheet,
  useColorScheme,
  ViewStyle,
} from 'react-native';
import { useThemeColor } from '../../hooks';
import { scaleWidth } from '../../utils';

export type BaseLayoutProps = React.PropsWithChildren & {
  style?: StyleProp<ViewStyle>;
};

export const BaseLayout = React.memo(({ children, style }: BaseLayoutProps) => {
  const colorScheme = useColorScheme();
  const backgroundColor = useThemeColor();
  const statusBarStyle =
    colorScheme === 'dark' ? 'light-content' : 'dark-content';

  return (
    <SafeAreaView style={[styles.safeAreaStyle, { backgroundColor }, style]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={backgroundColor} />
      {children}
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  safeAreaStyle: {
    flex: 1,
    paddingHorizontal: scaleWidth(30),
  },
});
