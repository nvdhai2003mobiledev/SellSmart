import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { BaseLayout, Button, DynamicText, Input ,Header} from '../../../components';
import { scaledSize, scaleHeight } from '../../../utils'; // Import responsive utils
import { contents } from '../../../context';
import { NavigationProp, useNavigation } from "@react-navigation/native";
import { RootStackParamList, Screen } from "../../../navigation/navigation.type";





const OrderScreen = () => {
 const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  return (
   <BaseLayout style={styles.container}>
     
   
      <Header title={"Đơn Hàng"}/>


        <TouchableOpacity style={styles.createOrderButton} onPress={()=>navigation.navigate(Screen.CREATEORDER)}>
          <Icon name="add-circle-outline" size={scaledSize(24)} color="#007bff" />
          <DynamicText style={styles.createOrderText}>{contents.order.create_order}</DynamicText>
        </TouchableOpacity>

        <View style={styles.grid}>
          <TouchableOpacity style={styles.gridItem}>
            <Icon name="calendar-outline" size={scaledSize(24)} color="#007bff" />
            <DynamicText style={styles.gridText}>{contents.order.order}</DynamicText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gridItem}>
            <Icon name="document-text-outline" size={scaledSize(24)} color="#007bff" />
            <DynamicText style={styles.gridText}>{contents.order.order_draft}</DynamicText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gridItem}>
            <Icon name="cube-outline" size={scaledSize(24)} color="#007bff" />
            <DynamicText style={styles.gridText}>{contents.order.return_product}</DynamicText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gridItem}>
            <Icon name="car-outline" size={scaledSize(24)} color="#007bff" />
            <DynamicText style={styles.gridText}>{contents.order.ship}</DynamicText>
          </TouchableOpacity>
        </View>
     
    </BaseLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    paddingTop: scaleHeight(50),
   
  },
  
  header: {
    fontSize: scaledSize(20),
    fontWeight: "bold",
    marginBottom: scaleHeight(20),
  },
  createOrderButton: {
    flexDirection: "column", // Chuyển từ row -> column
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: scaleHeight(15),
    borderRadius: scaledSize(10),
    borderWidth: 1,
    borderColor: "#007bff",
    width:scaledSize(400),
    justifyContent: "center",
    marginBottom: scaleHeight(20),
    borderStyle: "dashed",
   
  },
  createOrderText: {
    color: "#007bff",
    fontSize: scaledSize(16),
    marginTop: scaleHeight(8), // Thay vì marginLeft, dùng marginTop để tạo khoảng cách giữa icon và chữ
    textAlign: "center",
   
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
   width:scaledSize(400)
  },
  gridItem: {
    width: "48%",
    backgroundColor: "#e7f1ff",
    padding: scaleHeight(20),
    borderRadius: scaledSize(10),
    alignItems: "center",
    marginBottom: scaleHeight(15),
  },
  gridText: {
    marginTop: scaleHeight(10),
    fontSize: scaledSize(14),
    fontWeight: "500",
    color: "black",
  },
});

export default OrderScreen;
