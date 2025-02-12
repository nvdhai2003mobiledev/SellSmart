import {View, Text, SafeAreaView, StyleSheet} from "react-native";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {StatusBar} from "expo-status-bar";
import {theme} from "@src/utils";

export const ScreenWrapper = ({ style, children }) => {
  return (
    <SafeAreaView style={[styles.container, style]}>
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundColor
  }
})

