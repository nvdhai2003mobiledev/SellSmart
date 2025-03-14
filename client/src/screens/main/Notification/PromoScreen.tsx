import React from "react";
import { View, Text, StyleSheet } from "react-native";

const PromoScreen= () => {
  return (
    <View style={styles.container}>
      <Text>AllNotifiScreen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff", // Đồng bộ nền trắng
    padding: 16,
  },
});

export default PromoScreen;
