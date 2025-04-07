import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleProp,
  StyleSheet,
  useColorScheme,
  View,
  ViewStyle,
} from 'react-native';
import {useThemeColor} from '../../hooks';
import {scaleWidth} from '../../utils';

export type BaseLayoutProps = React.PropsWithChildren & {
  style?: StyleProp<ViewStyle>;
  scrollable?: boolean; // Thêm prop để xác định có scroll hay không
  scrollViewStyle?: StyleProp<ViewStyle>; // Style cho ScrollView
  contentContainerStyle?: StyleProp<ViewStyle>; // Style cho content container của ScrollView
};

export const BaseLayout = React.memo(
  ({
    children,
    style,
    scrollable = false,
    contentContainerStyle,
  }: BaseLayoutProps) => {
    const colorScheme = useColorScheme();
    const backgroundColor = useThemeColor();
    const statusBarStyle =
      colorScheme === 'dark' ? 'light-content' : 'dark-content';

    return (
      <SafeAreaView style={[styles.safeAreaStyle, {backgroundColor}, style]}>
        <StatusBar
          barStyle={statusBarStyle}
          backgroundColor={backgroundColor}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{flex: 1}}>
          {scrollable ? (
            <ScrollView
              style={[styles.contentContainer, contentContainerStyle]}
              showsVerticalScrollIndicator={false}
              scrollEnabled={scrollable}>
              <View>{children}</View>
            </ScrollView>
          ) : (
            <View>{children}</View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  },
);

const styles = StyleSheet.create({
  safeAreaStyle: {
    flex: 1,
    paddingHorizontal: scaleWidth(20),
  },
  contentContainer: {
    flexGrow: 1,
  },
});
