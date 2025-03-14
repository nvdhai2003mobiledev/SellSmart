import React from "react";
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { DynamicText, Header } from "../../../components";
import { contents } from "../../../context";
import { scaledSize, scaleHeight, scaleWidth } from "../../../utils";

const CustomerDetailScreen = () => {
  const navigation = useNavigation();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Header
                          title={contents.detailstaff.title}
                          showBackIcon={true}
                          onPressBack={() => navigation.goBack()}
                          showRightIcon={true}
                          RightIcon={false}
                        />

      {/* Ảnh đại diện */}
      <Image source={{ uri: "https://via.placeholder.com/100" }} style={styles.avatar} />

      {/* Hộp thông tin */}
     <View style={styles.infoContainer}>
             <DynamicText style={styles.rowNoBorder}>
               <DynamicText style={styles.label}>{contents.detailcustomer.id}</DynamicText>
             </DynamicText>
             {renderInfoRow(contents.detailcustomer.username, "Nguyễn Văn A")}
             {renderInfoRow(contents.detailcustomer.gender, "Nam")}
             {renderInfoRow(contents.detailcustomer.phone, "0398289916")}
             {renderInfoRow(contents.detailcustomer.email, "nva92@gmail.com")}
             {renderInfoRow(contents.detailcustomer.bithDate, "12/02/2000")}
             {renderInfoRow(contents.detailcustomer.address, "Minh Khai, Bắc Từ Liêm, Hà Nội")}
           </View>

      {/* Nút xóa nhân viên */}
      <TouchableOpacity style={styles.deleteButton}>
        <Text style={styles.deleteText}>Xóa khách hàng</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const renderInfoRow = (label, value) => (
  <TouchableOpacity style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    {value && <Text style={styles.value}>{value}</Text>}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    backgroundColor: "#F8F8F8",
    paddingVertical: scaleHeight(20),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    width: '90%',
  },
  backButton: {
    padding: scaledSize(10),
    position: 'absolute',
    left: 0,
  },
  headerTitle: {
    fontSize: scaledSize(18),
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  avatar: {
    width: scaleWidth(100),
    height: scaleHeight(100),
    borderRadius: scaledSize(50),
    backgroundColor: "#E0E0E0",
    marginBottom: scaleHeight(10),
  },
  infoContainer: {
    backgroundColor: "#FFF",
    width: "90%",
    borderRadius: scaledSize(10),
    marginTop: scaleHeight(10),
    paddingHorizontal: scaleWidth(20),
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: scaleHeight(15),
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  rowNoBorder: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: scaleHeight(15),
  },
  label: {
    fontSize: scaledSize(14),
    fontWeight: "bold",
    color: "#000",
  },
  value: {
    fontSize: scaledSize(16),
    color: "#333",
  },
  deleteButton: {
    marginTop: scaleHeight(20),
    paddingVertical: scaleHeight(15),
    width: "90%",
    alignItems: "center",
    borderRadius: scaledSize(8),
    borderWidth: scaleWidth(1),
    borderColor: "#FF4D4F",
  },
  deleteText: {
    color: "#FF4D4F",
    fontSize: scaledSize(16),
    fontWeight: "bold",
  },
});


export default CustomerDetailScreen;