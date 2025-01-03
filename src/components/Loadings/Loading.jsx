import { View, Text, ActivityIndicator } from "react-native";
import React from "react";
import { theme } from "../../constants/theme";
import {styles} from "./styles";

const Loading = ({ size = "large", color = theme.colors.primary }) => {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
};

export default Loading;
