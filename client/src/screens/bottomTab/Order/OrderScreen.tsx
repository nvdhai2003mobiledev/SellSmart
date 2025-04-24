import React, {useRef, useState} from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import {
  AddCircle,
  Calendar,
  ArrowRight2,
  CloseCircle,
} from 'iconsax-react-native';
import {BaseLayout, DynamicText, Header} from '../../../components';
import {
  color,
  moderateScale,
  scaledSize,
  scaleHeight,
  scaleWidth,
} from '../../../utils';
import {contents} from '../../../context';
import {NavigationProp, useNavigation} from '@react-navigation/native';
import {RootStackParamList, Screen} from '../../../navigation/navigation.type';
import {rootStore} from '../../../models/root-store';

const OrderScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const scrollY = useRef(0);
  const [bottomTabVisible, setBottomTabVisible] = useState(true);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;

    if (
      currentScrollY > scrollY.current &&
      bottomTabVisible &&
      currentScrollY > 20
    ) {
      setBottomTabVisible(false);
      navigation.getParent()?.setOptions({
        tabBarStyle: {display: 'none'},
      });
    } else if (currentScrollY < scrollY.current && !bottomTabVisible) {
      setBottomTabVisible(true);
      navigation.getParent()?.setOptions({
        tabBarStyle: {
          height: scaleHeight(65),
          borderRadius: moderateScale(20),
          position: 'absolute',
          bottom: scaleHeight(30),
          marginHorizontal: scaleWidth(30),
          paddingHorizontal: scaleHeight(20),
          shadowColor: color.accentColor.darkColor,
          shadowOffset: {width: 0, height: 10},
          shadowOpacity: 0.2,
          shadowRadius: moderateScale(20),
          elevation: moderateScale(20),
          backgroundColor: color.accentColor.whiteColor,
          display: 'flex',
        },
      });
    }

    scrollY.current = currentScrollY;
  };

  // Function to navigate to OrderListScreen with filter
  const navigateToOrderList = (status?: string) => {
    // @ts-ignore - Bỏ qua TypeScript error vì chúng ta biết Screen.ORDERLIST là hợp lệ
    navigation.navigate(Screen.ORDERLIST, {status});
  };

  return (
    <BaseLayout style={styles.scrollView}>
      <Header title={'Hóa đơn'} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}>
        <TouchableOpacity
          style={styles.createOrderButton}
          onPress={() => navigation.navigate(Screen.CREATEORDER)}>
          <AddCircle
            size={scaledSize(36)}
            color={color.primaryColor}
            variant="Bold"
          />
          <DynamicText style={styles.createOrderText}>
            {contents.order.create_order}
          </DynamicText>
        </TouchableOpacity>

        <View style={styles.sectionTitle}>
          <DynamicText style={styles.sectionTitleText}>
            Quản lý Hóa đơn
          </DynamicText>
        </View>

        <View style={styles.grid}>
          {/* Tất cả Hóa đơn */}
          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigateToOrderList()}>
            <View style={styles.gridItemContent}>
              <View
                style={[styles.iconContainer, {backgroundColor: '#E8F5FF'}]}>
                <Calendar
                  size={scaledSize(24)}
                  color={color.primaryColor}
                  variant="Bold"
                />
              </View>
              <View>
                <DynamicText style={styles.gridTitle}>Hóa đơn</DynamicText>
                <DynamicText style={styles.gridSubtitle}>
                  {rootStore.orders?.orders?.length || 0} đơn
                </DynamicText>
              </View>
            </View>
            <ArrowRight2
              size={20}
              color={color.accentColor.grayColor}
              variant="Linear"
            />
          </TouchableOpacity>

          {/* Hóa đơn đã hủy */}
          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigateToOrderList('canceled')}>
            <View style={styles.gridItemContent}>
              <View
                style={[styles.iconContainer, {backgroundColor: '#FFF0F0'}]}>
                <CloseCircle
                  size={scaledSize(24)}
                  color="#FF3B30"
                  variant="Bold"
                />
              </View>
              <View>
                <DynamicText style={styles.gridTitle}>Đơn hủy</DynamicText>
                <DynamicText style={styles.gridSubtitle}>
                  {rootStore.orders?.canceledOrders?.length || 0} đơn
                </DynamicText>
              </View>
            </View>
            <ArrowRight2
              size={20}
              color={color.accentColor.grayColor}
              variant="Linear"
            />
          </TouchableOpacity>
        </View>

        {/* Thêm padding bottom để tránh bị che bởi bottom tab */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </BaseLayout>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  createOrderButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    padding: moderateScale(20),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: color.primaryColor,
    borderStyle: 'dashed',
    marginBottom: moderateScale(20),
  },
  createOrderText: {
    color: color.primaryColor,
    fontSize: moderateScale(16),
    marginTop: moderateScale(8),
    fontWeight: '500',
  },
  sectionTitle: {
    marginBottom: moderateScale(12),
  },
  sectionTitleText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: color.accentColor.darkColor,
  },
  grid: {
    flexDirection: 'column',
    gap: moderateScale(12),
  },
  gridItem: {
    backgroundColor: 'white',
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gridItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: scaledSize(48),
    height: scaledSize(48),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: moderateScale(12),
  },
  gridTitle: {
    fontSize: moderateScale(16),
    color: color.accentColor.darkColor,
    marginBottom: moderateScale(4),
    fontWeight: '500',
  },
  gridSubtitle: {
    fontSize: moderateScale(15),
    color: color.accentColor.grayColor,
  },
  bottomPadding: {
    height: moderateScale(100),
  },
});

export default OrderScreen;
