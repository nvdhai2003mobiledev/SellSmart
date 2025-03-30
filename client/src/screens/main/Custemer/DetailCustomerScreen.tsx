import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { observer } from 'mobx-react-lite';
import { DynamicText, Header } from '../../../components';
import { contents } from '../../../context';
import { color, scaledSize, scaleHeight, scaleWidth } from '../../../utils';
import { rootStore } from '../../../models/root-store';
import { Images } from '../../../assets';
import IconFontAwesome from 'react-native-vector-icons/FontAwesome';
import { RootStackParamList, Screen } from '../../../navigation/navigation.type';

// Hàm định dạng ngày tháng
const formatDate = (isoDate: string | null) => {
  if (!isoDate) return 'Không có';
  const date = new Date(isoDate);
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1)
    .toString()
    .padStart(2, '0')}/${date.getFullYear()}`;
};

const DetailCustomerScreen = observer(() => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const customerStore = rootStore.customers;
  const customer = customerStore.selectedCustomer;

  // Xử lý khi nhấn nút chỉnh sửa
  const handleEditCustomer = () => {
    if (!customer) return;
    navigation.navigate(Screen.UPDATE_CUSTOMER);
  };

  if (!customer) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={color.primaryColor} />
        <DynamicText style={styles.loadingText}>Đang tải thông tin khách hàng...</DynamicText>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Header
        title="Chi tiết khách hàng"
        showBackIcon={true}
        onPressBack={() => navigation.goBack()}
        showRightIcon={true}
        RightIcon={
          <TouchableOpacity onPress={handleEditCustomer}>
            <IconFontAwesome name="edit" size={24} color={color.accentColor.whiteColor} />
          </TouchableOpacity>
        }
      />

      {/* Ảnh đại diện */}
      <Image
        source={
          customer.avatar && typeof customer.avatar === 'string' && customer.avatar.trim() !== ''
            ? { uri: customer.avatar }
            : require('../../../assets/images/device-mobile.png')
        }
        style={styles.avatar}
      />
      
      {/* Tên khách hàng */}
      <DynamicText style={styles.customerName}>{customer.fullName}</DynamicText>

      {/* Hộp thông tin */}
      <View style={styles.infoContainer}>
        {renderInfoRow('ID khách hàng', customer._id)}
        {renderInfoRow('Số điện thoại', customer.phoneNumber || 'Chưa cập nhật')}
        {renderInfoRow('Email', customer.email || 'Chưa cập nhật')}
        {renderInfoRow('Ngày sinh', customer.birthDate ? formatDate(customer.birthDate) : 'Chưa cập nhật')}
        {renderInfoRow('Địa chỉ', customer.address || 'Chưa cập nhật')}
      </View>
    </ScrollView>
  );
});

const renderInfoRow = (label: string, value: string) => (
  <View style={styles.row}>
    <DynamicText style={styles.label}>{label}</DynamicText>
    {value && <DynamicText style={styles.value}>{value}</DynamicText>}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: scaleHeight(30),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: scaleHeight(10),
    fontSize: scaledSize(16),
    color: color.accentColor.grayColor,
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
    backgroundColor: color.accentColor.whiteColor,
    marginBottom: scaleHeight(10),
  },
  customerName: {
    fontSize: scaledSize(18),
    fontWeight: 'bold',
    marginBottom: scaleHeight(15),
    color: color.primaryColor,
  },
  infoContainer: {
    backgroundColor: color.accentColor.whiteColor,
    width: '90%',
    borderRadius: scaledSize(10),
    marginTop: scaleHeight(10),
    paddingHorizontal: scaleWidth(20),
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scaleHeight(15),
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  rowNoBorder: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scaleHeight(15),
  },
  label: {
    fontSize: scaledSize(14),
    fontWeight: 'bold',
    color: color.accentColor.darkColor,
  },
  value: {
    fontSize: scaledSize(16),
    color: color.accentColor.darkColor,
    maxWidth: '60%',
    textAlign: 'right',
  },
  editIcon: {
    width: scaleWidth(24),
    height: scaleHeight(24),
    tintColor: color.accentColor.whiteColor,
  },
});

export default DetailCustomerScreen;
