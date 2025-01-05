import { StyleSheet, Text, TextInput, View } from "react-native";
import React from "react";
import { hp } from "../../helpers/common";
import { theme } from "../../constants/theme";
import {styles} from "./styles";

const Input = (props) => {
  return (
    <View
      style={[styles.container, props.containerStyle && props.containerStyle]}
    >
      {props.icon && props.icon}
      <TextInput
        style={{ flex: 1, fontSize: hp(1.8) }}
        placeholderTextColor={theme.colors.textLight}
        ref={props.inputRef}
        {...props}
      />
    </View>
  );
};

export default Input;


