import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { theme } from "../constants/theme";
import { useRouter } from "expo-router";
import BackButton from "./BackButton";
import { hp } from "../helpers/common";

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

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
    gap: 10,
  },
  title: {
    fontSize: hp(2.7),
    fontWeight: theme.fontWeight.semiBold,
    color: theme.colors.textDark,
    marginTop: 7,
  },
  backButton: {
    position: "absolute",
    left: 0,
  },
});
