import React from 'react';
import {View, TouchableOpacity, StyleSheet, Image, Alert} from 'react-native';
import {BaseLayout, Button, DynamicText, Header} from '../../../components';
import {
  color,
  moderateScale,
  scaledSize,
  scaleHeight,
  scaleWidth,
} from '../../../utils';
import {contents} from '../../../context';
import {Fonts, Images} from '../../../assets';
import {
  ArrowRight2,
  Profile,
  Profile2User,
  Setting2,
  Box,
} from 'iconsax-react-native';
import {observer} from 'mobx-react-lite';
import {rootStore} from '../../../models/root-store';
import {useNavigation} from '@react-navigation/native';
import {NavigationProp} from '@react-navigation/native';
import {RootStackParamList, Screen} from '../../../navigation/navigation.type';
import {Api} from '../../../services/api/api';
import {ApiEndpoint} from '../../../services/api/api-endpoint';

const MenuScreen = observer(() => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const {isAdmin, auth} = rootStore;
  const {user} = auth;

  const handleLogout = async () => {
    try {
      // Gọi API đăng xuất
      await Api.post(ApiEndpoint.LOGOUT);

      // Xóa trạng thái đăng nhập
      rootStore.reset();

      // Chuyển về màn hình đăng nhập
      navigation.reset({
        index: 0,
        routes: [{name: Screen.LOGIN}],
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const confirmLogout = () => {
    Alert.alert(
      'Xác nhận đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Đăng xuất',
          onPress: handleLogout,
          style: 'destructive',
        },
      ],
      {cancelable: true},
    );
  };

  // Hàm lấy avatar
  const getAvatar = () => {
    if (user?.avatar) {
      return {uri: user.avatar};
    }
    return Images.AVATAR_BYEWIND;
  };

  const navigateToProfile = () => {
    navigation.navigate(Screen.PROFILE);
  };

  const navigateToEmployees = () => {
    navigation.navigate(Screen.EMPLOYEES);
  };

  const navigateToCustomers = () => {
    navigation.navigate(Screen.CUSTOMERS);
  };

  const navigateToSettings = () => {
    navigation.navigate(Screen.CONFIG);
  };

  const navigateToProviders = () => {
    navigation.navigate(Screen.PROVIDER);
  };

  return (
    <BaseLayout>
      <Header title={contents.menu.title} />

      {/* Tài khoản */}
      <DynamicText style={styles.sectionTitle}>
        {contents.menu.account.title}
      </DynamicText>
      <TouchableOpacity
        style={styles.cardAccountStore}
        onPress={navigateToProfile}>
        <View style={styles.row}>
          <Image source={getAvatar()} style={styles.avatar} />
          <View>
            <DynamicText style={styles.title}>
              {user?.fullName || contents.menu.account.name}
            </DynamicText>
            <DynamicText style={styles.subtitle}>
              {user?.phoneNumber || contents.menu.account.phone}
            </DynamicText>
          </View>
        </View>
        <ArrowRight2 size={20} color={color.accentColor.grayColor} />
      </TouchableOpacity>

      {/* Cửa hàng */}
      <DynamicText style={styles.sectionTitle}>
        {contents.menu.store.title}
      </DynamicText>
      <View style={styles.cardAccountStore}>
        <View style={styles.row}>
          <Image source={Images.SHOP} style={styles.storeIcon} />
          <View>
            <DynamicText style={styles.title}>
              {contents.menu.store.name}
            </DynamicText>
            <DynamicText style={styles.subtitle}>
              {contents.menu.store.website}
            </DynamicText>
          </View>
        </View>
      </View>

      {/* Các mục khác */}
      <DynamicText style={styles.sectionTitle}>
        {contents.menu.sections.title}
      </DynamicText>
      <View style={styles.cardOther}>
        {isAdmin && (
          <>
            <MenuItem
              Icon={Profile}
              title={contents.menu.sections.staff}
              onPress={navigateToEmployees}
            />
            <View style={styles.separator} />
          </>
        )}
        <MenuItem
          Icon={Profile2User}
          title={contents.menu.sections.customer}
          onPress={navigateToCustomers}
        />
        <View style={styles.separator} />
        <MenuItem
          Icon={Box}
          title="Nhà cung cấp"
          onPress={navigateToProviders}
        />
        <View style={styles.separator} />
        <MenuItem
          Icon={Setting2}
          title={contents.menu.sections.settings}
          onPress={navigateToSettings}
        />
      </View>

      {/* Nút Đăng xuất */}
      <Button
        title={contents.menu.logout}
        buttonContainerStyle={styles.logoutButton}
        titleStyle={styles.logoutText}
        hasShadow={false}
        onPress={confirmLogout}
      />
    </BaseLayout>
  );
});

export default MenuScreen;

const MenuItem = ({
  Icon,
  title,
  onPress,
}: {
  Icon: any;
  title: string;
  onPress?: () => void;
}) => {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.row}>
        <Icon
          size={scaledSize(24)}
          color={color.accentColor.darkColor}
          variant="Linear"
        />
        <DynamicText style={styles.menuText}>{title}</DynamicText>
      </View>
      <ArrowRight2
        size={20}
        color={color.accentColor.blackColor}
        variant="Linear"
      />
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
    justifyContent: 'space-between',
  },
  cardOther: {
    backgroundColor: 'white',
    padding: moderateScale(6),
    borderRadius: moderateScale(16),
    marginBottom: scaleHeight(20),
    elevation: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleHeight(8),
  },
  avatar: {
    width: scaledSize(48),
    height: scaledSize(48),
    borderRadius: moderateScale(12),
  },
  storeIcon: {
    width: scaledSize(48),
    height: scaledSize(48),
  },
  title: {
    fontSize: scaledSize(12),
    fontFamily: Fonts.Inter_SemiBold,
  },
  subtitle: {
    fontSize: moderateScale(10),
    color: color.accentColor.grayColor,
  },
  sectionTitle: {
    fontSize: scaledSize(12),
    color: color.accentColor.grayColor,
  },
  separator: {
    height: 1,
    backgroundColor: color.accentColor.grayColor + '20',
    marginVertical: scaleHeight(8),
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: scaleHeight(12),
    paddingHorizontal: moderateScale(10),
  },
  menuText: {
    fontSize: moderateScale(14),
  },
  logoutButton: {
    marginTop: scaleHeight(30),
    backgroundColor: color.backgroundColor,
    borderWidth: scaleWidth(0.8),
    borderColor: color.accentColor.errorColor,
    borderRadius: moderateScale(12),
    paddingVertical: scaleHeight(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: color.accentColor.errorColor,
    fontSize: moderateScale(16),
  },
});
