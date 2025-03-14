import React from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { View, StyleSheet } from "react-native";
import AllNotifiScreen from "./AllNotifiScreen";
import PromoScreen from "./PromoScreen";
import OrderScreen from "../../bottomTab/Order/OrderScreen";
import { BaseLayout, Header } from "../../../components";
import OderNotifiScreen from "./OderNotifiScreen";
import { contents } from "../../../context";
import Ionicons from "react-native-vector-icons/Ionicons";

const Tab = createMaterialTopTabNavigator();

const NotificationScreen = ({ navigation }) => {
  return (
    <BaseLayout style={styles.container}>
      {/* Header */}
      <Header
                    title={contents.notifi.title}
                    showBackIcon={true}
                    onPressBack={() => navigation.goBack()}
                    showRightIcon={true}
                    RightIcon={<Ionicons name="filter-outline" size={24} color="black" />}
                  />
      
      {/* Tab Navigator */}
      <View style={styles.tabContainer}>
        <Tab.Navigator
          screenOptions={{
            tabBarIndicatorStyle: { backgroundColor: "black" },
            tabBarStyle: {
              backgroundColor: "white", // Đặt nền màu trắng
              borderRadius: 8,
              elevation: 0, // Loại bỏ bóng trên Android
              shadowOpacity: 0, // Loại bỏ bóng trên iOS
            },
            tabBarLabelStyle: { fontSize: 14, fontWeight: "bold" },
            tabBarActiveTintColor: "#000",
            tabBarInactiveTintColor: "#666",
          }}
        >
          <Tab.Screen name="Tất cả" component={AllNotifiScreen} />
          <Tab.Screen name="Khuyến mãi" component={PromoScreen} />
          <Tab.Screen name="Đơn mua" component={OderNotifiScreen} />
        </Tab.Navigator>
      </View>
    </BaseLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff" // Nền trắng toàn bộ
  },
  tabContainer: {
    flex: 1,
    backgroundColor: "#fff", // Đảm bảo nền Tab cũng là màu trắng
  },
});

export default NotificationScreen;
