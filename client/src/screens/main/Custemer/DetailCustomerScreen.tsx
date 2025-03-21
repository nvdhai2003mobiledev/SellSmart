import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';
import {DynamicText, Header} from '../../../components';
import {contents} from '../../../context';
import {color, scaledSize, scaleHeight, scaleWidth} from '../../../utils';

const DetailCustomerScreen = () => {
  const navigation = useNavigation();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Header
        title={contents.detail_employee.title}
        showBackIcon={true}
        onPressBack={() => navigation.goBack()}
        showRightIcon={true}
        RightIcon={false}
      />

      {/* Ảnh đại diện */}
      <Image
        source={{uri: 'https://via.placeholder.com/100'}}
        style={styles.avatar}
      />

      {/* Hộp thông tin */}
      <View style={styles.infoContainer}>
        <DynamicText style={styles.rowNoBorder}>
          <DynamicText style={styles.label}>
            {contents.detail_customer.id}
          </DynamicText>
        </DynamicText>
        {renderInfoRow(contents.detail_customer.username, 'Nguyễn Văn A')}
        {renderInfoRow(contents.detail_customer.gender, 'Nam')}
        {renderInfoRow(contents.detail_customer.phone, '0398289916')}
        {renderInfoRow(contents.detail_customer.email, 'nva92@gmail.com')}
        {renderInfoRow(contents.detail_customer.bithDate, '12/02/2000')}
        {renderInfoRow(
          contents.detail_customer.address,
          'Minh Khai, Bắc Từ Liêm, Hà Nội',
        )}
      </View>

      {/* Nút xóa nhân viên */}
      <TouchableOpacity style={styles.deleteButton}>
        <Text style={styles.deleteText}>Xóa khách hàng</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const renderInfoRow = (label: string, value: string) => (
  <TouchableOpacity style={styles.row}>
    <DynamicText style={styles.label}>{label}</DynamicText>
    {value && <DynamicText style={styles.value}>{value}</DynamicText>}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
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
  },
  deleteButton: {
    marginTop: scaleHeight(20),
    paddingVertical: scaleHeight(15),
    width: '90%',
    alignItems: 'center',
    borderRadius: scaledSize(8),
    borderWidth: scaleWidth(1),
    borderColor: color.accentColor.errorColor,
  },
  deleteText: {
    color: color.accentColor.errorColor,
    fontSize: scaledSize(16),
    fontWeight: 'bold',
  },
});

export default DetailCustomerScreen;
