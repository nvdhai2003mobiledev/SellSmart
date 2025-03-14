import React from 'react';
import { View, FlatList, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { BaseLayout, DynamicText, Header } from '../../../components';
import Icon from 'react-native-vector-icons/Ionicons';
import { color, moderateScale, scaleHeight, scaleWidth } from '../../../utils';
import { contents } from '../../../context';
import { Images } from '../../../assets';
import { Screen } from '../../../navigation/navigation.type';
import { SceneStyleInterpolators } from '@react-navigation/bottom-tabs';

export const StaffScreen = ({ navigation }) => {
  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <DynamicText style={styles.staffId}>{contents.staff.staff_id_label} {item.id}</DynamicText>
      <View style={styles.row}>
        <Image source={Images.SHOP} style={styles.avatar} />
        <View>
          <DynamicText style={styles.name}>{item.name}</DynamicText>
          <DynamicText style={styles.phone}>{contents.staff.phone_label}{item.phone}</DynamicText>
          <DynamicText style={styles.position}>
            {contents.staff.position_label}: <DynamicText style={styles.positionText}>{item.position}</DynamicText>
          </DynamicText>
        </View>
      </View>
    </View>
  );

  return (
    <BaseLayout >
      {/* Header mới */}
      <Header
        title={contents.staff.title}
        showBackIcon={true}
        onPressBack={() => navigation.goBack()}
        showRightIcon={true}
        RightIcon={false}
      />

      {/* Danh sách nhân viên */}
      <FlatList
        data={contents.staff.employees}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
      />

      {/* Thanh công cụ */}
      <View style={styles.toolbar}>
        <View style={styles.toolbar3}>
        <ToolbarButton 
  icon="add" 
  label={contents.staff.toolbar.add}  
  onPress={() => navigation.navigate(Screen.ADDSTAFF)}
/>
<ToolbarButton 
  icon="filter-outline" 
  label={contents.staff.toolbar.filter} 
  onPress={() => navigation.navigate(Screen.STAFFDEATIL)} 
/>
<ToolbarButton 
  icon="swap-vertical-outline" 
  label={contents.staff.toolbar.filter} 
  onPress={() => navigation.navigate(Screen.UPDATESTAFF)} 
/>
</View>
        <ToolbarButton icon="search-outline" label={contents.staff.toolbar.search} />
      </View>
    </BaseLayout>
  );
};
const ToolbarButton = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.iconButton} onPress={onPress}>
    <Icon name={icon} size={24} color={color.primaryColor} />
    <DynamicText style={styles.iconText}>{label}</DynamicText>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  listContainer: {
    flex: 1,
  },
  card: {
    width: '100%', // Chiếm toàn bộ chiều ngang
    backgroundColor: 'white',
    padding: scaleWidth(16),
    borderRadius: moderateScale(12),
    marginBottom: scaleHeight(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    alignSelf: 'stretch', // Đảm bảo phần tử mở rộng tối đa
  },
  
  staffId: {
    fontSize: moderateScale(12),
    color: color.accentColor.grayColor,
    marginBottom: scaleHeight(4),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: scaleWidth(50),
    height: scaleHeight(50),
    borderRadius: 25,
    marginRight: scaleWidth(12),
  },
  name: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
  },
  phone: {
    fontSize: moderateScale(12),
    color: color.accentColor.grayColor,
  },
  position: {
    fontSize: moderateScale(14),
  },
  positionText: {
    color: color.primaryColor,
    fontSize: moderateScale(14),

  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(1),
    backgroundColor: 'white',
   
  },
  
  toolbar3: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start', // Đẩy nhóm nút về bên trái
    flex: 1, // Để nó chiếm phần lớn không gian
    gap:scaleWidth(30)
  },
  
  iconButton: {
    alignItems: 'center',
  },
  iconText: {
    fontSize: moderateScale(12),
    color: color.primaryColor,
    marginTop: scaleHeight(4),
  },
});
