import React from 'react';
import { View, TouchableOpacity, StyleSheet, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { BaseLayout, Button, DynamicText, Header } from '../../../components';
import { color, moderateScale, scaleHeight, scaleWidth } from '../../../utils';
import { contents } from '../../../context';
import { Images } from '../../../assets';

const MenuScreen = () => {
  return (
    <BaseLayout>
      <Header title={contents.menu.title} />

      {/* Tài khoản */}
      <DynamicText style={styles.sectionTitle}>{contents.menu.account.title}</DynamicText>
      <View style={styles.cardAccountStore}>
        <View style={styles.row}>
          <Image source={Images.AVATAR_BYEWIND} style={styles.avatar} />
          
          <View>
            <DynamicText style={styles.title}>{contents.menu.account.name}</DynamicText>
            <DynamicText style={styles.subtitle}>{contents.menu.account.phone}</DynamicText>
          </View>
        </View>
      </View>

      {/* Cửa hàng */}
      <DynamicText style={styles.sectionTitle}>{contents.menu.store.title}</DynamicText>
      <View style={styles.cardAccountStore}>
        <View style={styles.row}>
        <Image source={Images.SHOP} style={styles.storeIcon} />
          <View>
            <DynamicText style={styles.title}>{contents.menu.store.name}</DynamicText>
            <DynamicText style={styles.subtitle}>{contents.menu.store.website}</DynamicText>
          </View>
        </View>
      </View>

      {/* Các mục khác */}
      <DynamicText style={styles.sectionTitle}>{contents.menu.sections.title}</DynamicText>
      <View style={styles.cardOther}>
        <MenuItem icon='people-outline' title={contents.menu.sections.staff} />
        <View style={styles.separator} />
        <MenuItem icon='person-outline' title={contents.menu.sections.customer} />
        <View style={styles.separator} />
        <MenuItem icon='settings-outline' title={contents.menu.sections.settings} />
      </View>

      {/* Nút Đăng xuất */}
      <Button
        title={contents.menu.logout}
        buttonContainerStyle={styles.logoutButton}
        titleStyle={styles.logoutText}
      />
    </BaseLayout>
  );
};

export default MenuScreen;

const MenuItem = ({ icon, title }: any) => {
  return (
    <TouchableOpacity style={styles.menuItem}>
      <View style={styles.row}>
        <Icon name={icon} size={24} color={color.accentColor.blackColor} />
        <DynamicText style={styles.menuText}>{title}</DynamicText>
      </View>
      <Icon name='chevron-forward-outline' size={20} color={color.accentColor.blackColor} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardAccountStore: {
    backgroundColor: 'white',
    padding: moderateScale(16),
    borderRadius: moderateScale(16),
    marginBottom: scaleHeight(12),
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardOther: {
    backgroundColor: 'white',
    padding: moderateScale(6),
    borderRadius: moderateScale(16),
    marginBottom: scaleHeight(20),
    
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: scaleWidth(12),
  },
  storeIcon: {
    width: 50,
    height: 50,
    marginRight: scaleWidth(12),
  },
  title: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: moderateScale(14),
    color: color.accentColor.grayColor,
  },
  sectionTitle: {
    fontSize: moderateScale(14),
    fontWeight: 'bold',
    color: color.accentColor.grayColor,
    marginBottom: scaleHeight(8),
  },
  separator: {
    height: 1,
    backgroundColor: color.accentColor.grayColor,
    marginVertical: scaleHeight(8),
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: scaleHeight(12),
  },
  menuText: {
    marginLeft: scaleWidth(10),
    fontSize: moderateScale(16),
  },
  logoutButton: {
    marginTop: scaleHeight(20),
    backgroundColor: color.accentColor.whiteColor,
    borderWidth: 1,
    borderColor: color.accentColor.errorColor,
    borderRadius: moderateScale(25),
    paddingVertical: scaleHeight(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: color.accentColor.errorColor,
    fontSize: moderateScale(16),
    fontWeight: 'bold',
  },
});
