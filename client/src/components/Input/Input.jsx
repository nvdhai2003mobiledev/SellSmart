import { StyleSheet, Text, TextInput, View } from "react-native";
import React from "react";
import {hp, theme} from "@src/utils";

export const Input = (props) => {
  return (
    <View
      style={[styles.container, props.containerStyle && props.containerStyle]}
    >
      {props.icon && props.icon}
      <TextInput
        style={{ flex: 1, fontSize: hp(1.8) }}
        placeholderTextColor={theme.colors.grayColor}
        ref={props.inputRef}
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    height: hp(6),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.4,
    borderColor: theme.colors.text,
    borderRadius: theme.radius.xl,
    borderCurve: "continuous",
    paddingHorizontal: 18,
    gap: 12,
  },
});


