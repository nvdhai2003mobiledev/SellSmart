import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {BaseLayout, DynamicText, Header} from '../../../components';
import {color, scaledSize, scaleHeight, scaleWidth} from '../../../utils';
import {Provider} from '../../../models/provider/provider';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {RootStackParamList, Screen} from '../../../navigation/navigation.type';
import {Fonts} from '../../../assets';
import IconFontAwesome from 'react-native-vector-icons/FontAwesome';

type DetailProviderScreenRouteProp = RouteProp<
  RootStackParamList,
  Screen.DETAIL_PROVIDER
>;

const DetailProviderScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<DetailProviderScreenRouteProp>();
  const provider = route.params?.provider;

  const handleBack = () => {
    navigation.goBack();
  };

  const handleEditProvider = () => {
    if (!provider) return;
    // Thêm navigation đến màn hình edit sau
  };

  const renderInfoRow = (label: string, value: string | undefined) => (
    <View style={styles.row}>
      <DynamicText style={styles.label}>{label}</DynamicText>
      <DynamicText style={styles.value}>{value || 'Chưa cập nhật'}</DynamicText>
    </View>
  );

  if (!provider) {
    return (
      <BaseLayout>
        <Header 
          title="Chi tiết nhà cung cấp" 
          showBackIcon 
          onPressBack={handleBack}
        />
        <View style={styles.emptyContainer}>
          <DynamicText style={styles.emptyText}>
            Không tìm thấy thông tin nhà cung cấp
          </DynamicText>
        </View>
      </BaseLayout>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Header 
        title="Chi tiết nhà cung cấp" 
        showBackIcon 
        onPressBack={handleBack}
        showRightIcon={true}
        RightIcon={
          <TouchableOpacity onPress={handleEditProvider}>
            <IconFontAwesome name="edit" size={24} color={color.accentColor.whiteColor} />
          </TouchableOpacity>
        }
      />

      <View style={styles.statusContainer}>
        <View style={[
          styles.statusBadge,
          { backgroundColor: provider.status === 'active' ? color.primaryColor : color.accentColor.grayColor }
        ]}>
          <DynamicText style={styles.statusText}>
            {provider.status === 'active' ? 'Đang cung cấp' : 'Dừng cung cấp'}
          </DynamicText>
        </View>
      </View>
      
      <View style={styles.infoContainer}>
        <View style={styles.detailsSection}>
          {renderInfoRow('Tên công ty', provider.fullName)}
          {renderInfoRow('Số điện thoại', provider.phoneNumber)}
          {renderInfoRow('Email', provider.email)}
          {renderInfoRow('Địa chỉ', provider.address)}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: scaleHeight(30),
  },
  statusContainer: {
    width: '90%',
    alignItems: 'center',
    marginVertical: scaleHeight(10),
  },
  statusBadge: {
    paddingHorizontal: scaleWidth(20),
    paddingVertical: scaleHeight(8),
    borderRadius: scaledSize(20),
  },
  statusText: {
    fontSize: scaledSize(20),
    color: color.accentColor.whiteColor,
    fontFamily: Fonts.Inter_SemiBold,
  },
  infoContainer: {
    backgroundColor: color.accentColor.whiteColor,
    width: '90%',
    borderRadius: scaledSize(10),
    overflow: 'hidden',
  },
  detailsSection: {
    paddingHorizontal: scaleWidth(20),
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scaleHeight(20),
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  label: {
    fontSize: scaledSize(20),
    fontFamily: Fonts.Inter_Regular,
    color: color.accentColor.grayColor,
  },
  value: {
    fontSize: scaledSize(25),
    fontFamily: Fonts.Inter_SemiBold,
    color: color.accentColor.darkColor,
    maxWidth: '60%',
    textAlign: 'right',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scaleWidth(16),
  },
  emptyText: {
    fontSize: scaledSize(20),
    color: color.accentColor.grayColor,
    textAlign: 'center',
    fontFamily: Fonts.Inter_Regular,
  },
});

export default DetailProviderScreen;
