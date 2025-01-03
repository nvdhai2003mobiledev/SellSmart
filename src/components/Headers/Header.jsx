import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { theme } from "../../constants/theme";
import { useRouter } from "expo-router";
import BackButton from "../BackButtons/BackButton";
import { hp } from "../../helpers/common";
import {styles} from "./styles";

const Header = ({ title, showBackButton = false, mb = 10 }) => {
  const router = useRouter();
  return (
    <View style={[styles.container, { marginBottom: mb }]}>
      {showBackButton && (
        <View style={styles.backButton}>
          <BackButton router={router} />
        </View>
      )}
      <Text style={styles.title}>{title || ""}</Text>
    </View>
  );
};

export default Header;


