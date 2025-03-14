import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { DynamicText, Header } from "../../../components";
import { contents } from "../../../context";
import { scaledSize, scaleHeight, scaleWidth } from "../../../utils";

const AllNotifiScreen = (navigation) => {
  const [selectedTab, setSelectedTab] = useState("all");

  const notifications = {
    all: [
      {
        id: 1,
        icon: "home-outline",
        color: "#007AFF",
        title: "Chuyển khoản vào ngân hàng",
        time: "03:52:55 - 12/05",
        description: "MB Bank, 449287448743 (NGUYEN NGOC HA), 1.200.000đ, Đơn hàng DH_0948371",
      },
      {
        id: 2,
        icon: "wallet-outline",
        color: "#FFA500",
        title: "Đề nghị thanh toán",
        time: "03:52:55 - 12/05",
        description: "Customer Nguyễn Ngọc Minh has successfully paid for order #95111 with a value of 20.00 USD...",
      },
    ],
    promo: [],
    order: [],
  };

  return (
    
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.notificationList}>
        <View style={styles.notificationCard}>
          <View style={styles.notificationContent}>
            <DynamicText style={styles.notificationTitle}>{contents.notifi.titlee}</DynamicText>
            <DynamicText style={styles.notificationTime}>{contents.notifi.time}</DynamicText>
            <DynamicText style={styles.notificationDescription}>{contents.notifi.description}</DynamicText>
          </View>
        </View>
        <View style={styles.notificationCard}>
          <View style={styles.notificationContent}><DynamicText style={styles.notificationTitle}>{contents.notifi.titleee}</DynamicText>
            <DynamicText style={styles.notificationTime}>{contents.notifi.timee}</DynamicText>
            <DynamicText style={styles.notificationDescription}>{contents.notifi.descriptionn}</DynamicText>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#fff",
    padding: scaledSize(20),
    
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: scaleHeight(20),
  },
  backButton: {
    padding: scaledSize(10),
  },
  filterButton: {
    padding: scaledSize(10),
  },
  headerTitle: {
    fontSize: scaledSize(18),
    fontWeight: "600",
    textAlign: "center",
    flex: 1,
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: "#E0E0E0",
    borderRadius: scaledSize(10),
    marginBottom: scaleHeight(15),
  },
  tab: {
    flex: 1,
    padding: scaledSize(10),
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "white",
    borderRadius: scaledSize(10),
  },
  tabText: {
    fontSize: scaledSize(14),
    fontWeight: "500",
  },
  notificationList: {
    marginTop: 10,
  },
  notificationCard: {
    flexDirection: "row",
    backgroundColor: "white",
    paddingVertical: scaledSize(20), // Tăng chiều cao
    paddingHorizontal: scaledSize(20), // Tăng chiều rộng
    borderRadius: scaledSize(12), // Bo góc lớn hơn
    marginBottom: scaleHeight(15), // Tạo khoảng cách giữa các hộp
    alignItems: "center",
    width: "100%", // Chiếm toàn bộ chiều rộng
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 6, // Android - tăng bóng đổ
},

  icon: {
    marginRight: scaleWidth(10),
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: scaledSize(14),
    fontWeight: "bold",
  },
  notificationTime: {
    fontSize: scaledSize(12),
    color: "gray",
  },
  notificationDescription: {
    fontSize: scaledSize(14),
    color: "#555",
  },
  noNotification: {
    textAlign: "center",
    color: "gray",
    marginTop: scaleHeight(20),
    fontSize: scaledSize(16),
  },
});

export default AllNotifiScreen;