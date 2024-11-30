import { Image, StyleSheet, Text, View } from "react-native";
import React from "react";
import ScreenWrapper from "../components/ScreenWrapper";
import { theme } from "../constants/theme";
import { wp, hp } from "../helpers/common";
import { StatusBar } from "expo-status-bar";

const Splash = () => {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <StatusBar style="dark" />
      <Image
        source={require("../assets/images/logo.png")}
        style={styles.logo}
      />
    </View>
  );
};

export default Splash;

const styles = StyleSheet.create({
  logo: {
    width: wp(50),
    height: hp(50),
    resizeMode: "contain",
  },
});
