import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { Controller, useForm } from "react-hook-form";
import { useNavigation } from "@react-navigation/native";
import { BaseLayout, Input, Button, DynamicText } from "../../../components";
import { scaledSize } from "../../../utils";

const CustomerInfoScreen = () => {
  const navigation = useNavigation();

  // Khởi tạo useForm với giá trị mặc định
  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      phone: "0398289916",
      name: "Nguyễn Văn A",
      dob: "16/02/2003",
      address: "Mỹ Đình, Nam Từ Liêm, Hà Nội",
    },
  });

  // Hàm xử lý khi nhấn nút "Tiếp tục"
  const onSubmit = (data) => {
    console.log("Thông tin khách hàng:", data);
    // Có thể thêm logic điều hướng hoặc gửi dữ liệu tại đây
    // Ví dụ: navigation.navigate("NextScreen", { customerInfo: data });
  };

  // Hàm render trường nhập liệu
  const renderInput = (label, name) => (
    <View style={styles.inputContainer}>
      <DynamicText style={styles.label}>{label}</DynamicText>
      <Controller
        control={control}
        name={name}
        rules={{ required: `${label} là bắt buộc` }}
        render={({ field: { onChange, value } }) => (
          <Input
            value={value}
            onChangeText={onChange}
            inputContainerStyle={styles.inputWrapper}
            EndIcon={
              <TouchableOpacity onPress={() => onChange("")}>
                <Icon name="x-circle" size={18} color="#B0B0B0" />
              </TouchableOpacity>
            }
          />
        )}
      />
      {errors[name] && (
        <DynamicText style={styles.errorText}>{errors[name].message}</DynamicText>
      )}
    </View>
  );

  return (
    <BaseLayout>
      <DynamicText style={styles.title}>Thông tin khách hàng</DynamicText>
      {renderInput("Số điện thoại", "phone")}
      {renderInput("Tên khách hàng", "name")}
      {renderInput("Ngày sinh", "dob")}
      {renderInput("Địa chỉ", "address")}
      <Button
        title="Tiếp tục"
        onPress={handleSubmit(onSubmit)}
        buttonContainerStyle={styles.button}
        titleStyle={styles.buttonText}
      />
    </BaseLayout>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: scaledSize(18),
    fontWeight: "600",
    textAlign: "center",
    marginBottom: scaledSize(20),
  },
  inputContainer: {
    marginBottom: scaledSize(15),
  },
  label: {
    fontSize: scaledSize(14),
    color: "#666",
    marginBottom: scaledSize(5),
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: scaledSize(10),
    backgroundColor: "#F7F7F7",
  },
  button: {
    backgroundColor: "#007AFF",
    padding: scaledSize(12),
    borderRadius: 8,
    alignItems: "center",
    marginTop: scaledSize(20),
  },
  buttonText: {
    color: "#FFF",
    fontSize: scaledSize(16),
    fontWeight: "600",
  },
  errorText: {
    color: "red",
    marginTop: scaledSize(5),
  },
});

export default CustomerInfoScreen;