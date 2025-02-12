import {View, Text, ActivityIndicator, StyleSheet} from "react-native";
import React from "react";
import {theme} from "@src/utils";


export const Loading = ({ size = "large", color = theme.colors.primary }) => {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
};

const styles = StyleSheet.create({
  loading: {
    justifyContent: "center",
    alignItems: "center"
  }
})
