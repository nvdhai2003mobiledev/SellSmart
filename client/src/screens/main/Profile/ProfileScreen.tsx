import React from 'react';
import {StyleSheet, View, Image, ScrollView} from 'react-native';
import {BaseLayout, Button, DynamicText, Header} from '../../../components';
import {color, moderateScale, scaledSize, scaleHeight} from '../../../utils';
import {observer} from 'mobx-react-lite';
import {rootStore} from '../../../models/root-store';
import {Images, Fonts} from '../../../assets';
import {NavigationProp, useNavigation} from '@react-navigation/native';
import {RootStackParamList, Screen} from '../../../navigation/navigation.type';
import {
  Call,
  Message,
  Calendar,
  Profile as ProfileIcon,
  Location,
} from 'iconsax-react-native';

const ProfileScreen = observer(() => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const {auth} = rootStore;
  const {user} = auth;

  const handleGoBack = () => {
    navigation.goBack();
  };

  // Hàm lấy avatar
  const getAvatar = () => {
    if (user?.avatar) {
      return {uri: user.avatar};
    }
    return Images.AVATAR_BYEWIND;
  };

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) {return 'Chưa cập nhật';}

    try {
      const date = new Date(dateString);
      return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    } catch (error) {
      return 'Định dạng không hợp lệ';
    }
  };

  const formatGender = (gender: string | null | undefined): string => {
    if (!gender) {return 'Chưa cập nhật';}
    return gender === 'male' ? 'Nam' : 'Nữ';
  };

  return (
    <BaseLayout style={styles.container}>
      <Header
        title="Thông tin cá nhân"
        showBackIcon={true}
        onPressBack={handleGoBack}
      />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Avatar và tên */}
        <View style={styles.profileHeader}>
          <Image source={getAvatar()} style={styles.avatar} />
          <DynamicText style={styles.fullName}>
            {user?.fullName || 'Chưa cập nhật'}
          </DynamicText>
          <DynamicText style={styles.role}>
            {user?.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}
          </DynamicText>
        </View>

        {/* Thông tin liên hệ */}
        <View style={styles.section}>
          <DynamicText style={styles.sectionTitle}>
            Thông tin liên hệ
          </DynamicText>

          <View style={styles.infoItem}>
            <Call size={24} color={color.primaryColor} variant="Bold" />
            <View style={styles.infoContent}>
              <DynamicText style={styles.infoLabel}>Số điện thoại</DynamicText>
              <DynamicText style={styles.infoValue}>
                {user?.phoneNumber || 'Chưa cập nhật'}
              </DynamicText>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Message size={24} color={color.primaryColor} variant="Bold" />
            <View style={styles.infoContent}>
              <DynamicText style={styles.infoLabel}>Email</DynamicText>
              <DynamicText style={styles.infoValue}>
                {user?.email || 'Chưa cập nhật'}
              </DynamicText>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Location size={24} color={color.primaryColor} variant="Bold" />
            <View style={styles.infoContent}>
              <DynamicText style={styles.infoLabel}>Địa chỉ</DynamicText>
              <DynamicText style={styles.infoValue}>
                {user?.address || 'Chưa cập nhật'}
              </DynamicText>
            </View>
          </View>
        </View>

        {/* Thông tin cá nhân */}
        <View style={styles.section}>
          <DynamicText style={styles.sectionTitle}>
            Thông tin cá nhân
          </DynamicText>

          <View style={styles.infoItem}>
            <ProfileIcon size={24} color={color.primaryColor} variant="Bold" />
            <View style={styles.infoContent}>
              <DynamicText style={styles.infoLabel}>Giới tính</DynamicText>
              <DynamicText style={styles.infoValue}>
                {formatGender(user?.gender)}
              </DynamicText>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Calendar size={24} color={color.primaryColor} variant="Bold" />
            <View style={styles.infoContent}>
              <DynamicText style={styles.infoLabel}>Ngày sinh</DynamicText>
              <DynamicText style={styles.infoValue}>
                {formatDate(user?.dob)}
              </DynamicText>
            </View>
          </View>
        </View>

        {/* Nút Chỉnh sửa */}
        <Button
          title="Chỉnh sửa thông tin"
          buttonContainerStyle={styles.editButton}
        />

        <View style={styles.bottomPadding} />
      </ScrollView>
    </BaseLayout>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: scaleHeight(45),
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: moderateScale(24),
  },
  avatar: {
    width: scaledSize(120),
    height: scaledSize(120),
    borderRadius: moderateScale(16),
    marginBottom: moderateScale(16),
  },
  fullName: {
    fontSize: moderateScale(24),
    fontFamily: Fonts.Inter_Bold,
    color: color.accentColor.darkColor,
    marginBottom: moderateScale(4),
  },
  role: {
    fontSize: moderateScale(14),
    color: color.accentColor.grayColor,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginBottom: moderateScale(16),
  },
  sectionTitle: {
    fontSize: moderateScale(16),
    fontFamily: Fonts.Inter_SemiBold,
    color: color.accentColor.darkColor,
    marginBottom: moderateScale(16),
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(16),
  },
  infoContent: {
    marginLeft: moderateScale(12),
    flex: 1,
  },
  infoLabel: {
    fontSize: moderateScale(12),
    color: color.accentColor.grayColor,
    marginBottom: moderateScale(4),
  },
  infoValue: {
    fontSize: moderateScale(14),
    color: color.accentColor.darkColor,
    fontFamily: Fonts.Inter_SemiBold,
  },
  editButton: {
    marginTop: moderateScale(8),
    marginBottom: moderateScale(16),
  },
  bottomPadding: {
    height: moderateScale(40),
  },
});

export default ProfileScreen;
