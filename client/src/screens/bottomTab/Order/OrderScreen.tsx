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
  DocumentText,
  ArrowRight2,
  TruckFast,
  Box,
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
import { rootStore } from '../../../models/root-store';

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
    navigation.navigate(Screen.ORDERLIST, { status });
  };

  return (
    <BaseLayout style={styles.scrollView}>
      <Header title={'Đơn hàng'} />
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
            Quản lý đơn hàng
          </DynamicText>
        </View>

        <View style={styles.grid}>
          <TouchableOpacity 
            style={styles.gridItem} 
            onPress={() => navigateToOrderList()}
          >
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
                <DynamicText style={styles.gridTitle}>
                  {contents.order.order || 'Đơn hàng'}
                </DynamicText>
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

          <TouchableOpacity 
            style={styles.gridItem} 
            onPress={() => navigateToOrderList('pending')}
          >
            <View style={styles.gridItemContent}>
              <View
                style={[styles.iconContainer, {backgroundColor: '#FFF5E8'}]}>
                <DocumentText
                  size={scaledSize(24)}
                  color="#FFA500"
                  variant="Bold"
                />
              </View>
              <View>
                <DynamicText style={styles.gridTitle}>
                  {contents.order.order_draft || 'Đơn nháp'}
                </DynamicText>
                <DynamicText style={styles.gridSubtitle}>
                  {rootStore.orders?.pendingOrders?.length || 0} đơn
                </DynamicText>
              </View>
            </View>
            <ArrowRight2
              size={20}
              color={color.accentColor.grayColor}
              variant="Linear"
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.gridItem} 
            onPress={() => navigateToOrderList('processing')}
          >
            <View style={styles.gridItemContent}>
              <View
                style={[styles.iconContainer, {backgroundColor: '#E8FFF5'}]}>
                <Box size={scaledSize(24)} color="#00CC99" variant="Bold" />
              </View>
              <View>
                <DynamicText style={styles.gridTitle}>
                  {contents.order.return_product || 'Trả hàng'}
                </DynamicText>
                <DynamicText style={styles.gridSubtitle}>
                  {rootStore.orders?.processingOrders?.length || 0} đơn
                </DynamicText>
              </View>
            </View>
            <ArrowRight2
              size={20}
              color={color.accentColor.grayColor}
              variant="Linear"
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.gridItem} 
            onPress={() => navigateToOrderList('shipping')}
          >
            <View style={styles.gridItemContent}>
              <View
                style={[styles.iconContainer, {backgroundColor: '#F5E8FF'}]}>
                <TruckFast
                  size={scaledSize(24)}
                  color="#9B51E0"
                  variant="Bold"
                />
              </View>
              <View>
                <DynamicText style={styles.gridTitle}>
                  {contents.order.ship || 'Vận chuyển'}
                </DynamicText>
                <DynamicText style={styles.gridSubtitle}>
                  {rootStore.orders?.shippingOrders?.length || 0} đơn
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
    fontSize: moderateScale(8),
    marginTop: moderateScale(8),
    fontWeight: '500',
  },
  sectionTitle: {
    marginBottom: moderateScale(12),
  },
  sectionTitleText: {
    fontSize: moderateScale(8),
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
    fontSize: moderateScale(7),
    color: color.accentColor.darkColor,
    marginBottom: moderateScale(4),
    fontWeight: '500',
  },
  gridSubtitle: {
    fontSize: moderateScale(7),
    color: color.accentColor.grayColor,
  },
  bottomPadding: {
    height: moderateScale(100),
  },
});


export default OrderScreen;