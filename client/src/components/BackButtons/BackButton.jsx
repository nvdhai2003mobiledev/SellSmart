import { Pressable, StyleSheet, Text, View } from "react-native";
import React from "react";
import { theme } from "../../constants/theme";
import Icon from "../../assets/icons";
import {styles} from "./styles";

const BackButton = ({ size = 26, router }) => {
  return (
    <Pressable onPress={() => router.back()} style={styles.button}>
      <Icon
        name="arrowLeft"
        strokeWidth={2.5}
        size={size}
        color={theme.colors.text}
      />
    </Pressable>
  );
};

export default BackButton;


