import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Feather";

const ProductMenuScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sản phẩm</Text>
      
      <TouchableOpacity style={styles.addProductButton}>
        <Icon name="plus-circle" size={24} color="#007AFF" />
        <Text style={styles.addProductText}>Thêm sản phẩm</Text>
      </TouchableOpacity>
      
      <View style={styles.gridContainer}>
        <TouchableOpacity style={styles.gridItem}>
          <Icon name="package" size={24} color="#007AFF" />
          <Text style={styles.gridText}>Sản phẩm</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.gridItem}>
          <Icon name="lock" size={24} color="#007AFF" />
          <Text style={styles.gridText}>Tồn kho</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.gridItem}>
          <Icon name="truck" size={24} color="#007AFF" />
          <Text style={styles.gridText}>Nhập hàng</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.gridItem}>
          <Icon name="shuffle" size={24} color="#007AFF" />
          <Text style={styles.gridText}>Chuyển kho</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 20,
  },
  addProductButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#007AFF",
    borderRadius: 8,
    padding: 10,
    width: "80%",
    justifyContent: "center",
    marginBottom: 20,
  },
  addProductText: {
    marginLeft: 10,
    color: "#007AFF",
    fontSize: 16,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
  },
  gridItem: {
    width: "40%",
    aspectRatio: 1,
    backgroundColor: "#F7F7F7",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  gridText: {
    marginTop: 5,
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "500",
  },
});

export default ProductMenuScreen;