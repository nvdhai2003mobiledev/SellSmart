import { Button, StyleSheet, Text, View } from "react-native";
import React from "react";
import { useRouter } from "expo-router";
import Login from "./login";

const Index = () => {
  const router = useRouter();
  return (
    <Login />
  );
};

export default Index;
