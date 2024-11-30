import { Button, StyleSheet, Text, View } from "react-native";
import React from "react";
import { useRouter } from "expo-router";

const Index = () => {
  const router = useRouter();
  return (
    <View>
      <Text>index</Text>
      <Button title="Splash" onPress={() => router.push("splash")} />
    </View>
  );
};

export default Index;
