import React from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import {Screen, RootStackParamList} from './navigation.type';
import {DayScreen, WeekScreen, MonthScreen} from '../screens';
import {color, moderateScale, scaleHeight, scaleWidth} from '../utils';
import {contents} from '../context';
import {DynamicText, Header} from '../components';
import {
  Notification,
  DocumentText,
  ShoppingBag,
  Profile2User,
  Box,
  PercentageSquare,
  ReceiptAdd,
} from 'iconsax-react-native';
import {useNavigation, NavigationProp} from '@react-navigation/native';

const Tab = createMaterialTopTabNavigator();

type MyTabsProps = {
  state: any;
  descriptors: {[key: string]: {options: any}};
  navigation: any;
};

const MyTabs = ({state, descriptors, navigation}: MyTabsProps) => {
  return (
    <View style={styles.tabBar}>
      {state.routes.map((route: any, index: any) => {
        const {options} = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          }); 

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? {selected: true} : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={[styles.tabItem, isFocused ? styles.tabItemActive : null]}>
            <DynamicText style={styles.tabText}>{label}</DynamicText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const TabNav = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  
  return (
    <View style={styles.container}>
      <Header
        title={contents.appName}
        RightIcon={
          <Notification
            size={24}
            color={color.accentColor.darkColor}
            variant="Linear"
            style={{marginEnd: scaleWidth(20)}}
          />
        }
        showRightIcon={true}
      />
      
      {/* Quick Access Buttons Row */}
      <View style={styles.quickAccessRow}>
        <TouchableOpacity style={styles.quickButton} onPress={() => navigation.navigate(Screen.CREATEORDER as any)}>
          <View style={[styles.quickIconContainer, {backgroundColor: color.primaryColor}]}>
            <DocumentText size={20} color="#FFFFFF" variant="Bold" />
          </View>
          <DynamicText style={styles.quickLabel}>Đơn hàng</DynamicText>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.quickButton} onPress={() => navigation.navigate(Screen.PRODUCT as any)}>
          <View style={[styles.quickIconContainer, {backgroundColor: '#EE0033'}]}>
            <Box size={20} color="#FFFFFF" variant="Bold" />
          </View>
          <DynamicText style={styles.quickLabel}>Sản phẩm</DynamicText>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.quickButton} onPress={() => navigation.navigate(Screen.CUSTOMERS as any)}>
          <View style={[styles.quickIconContainer, {backgroundColor: '#00CC6A'}]}>
            <Profile2User size={20} color="#FFFFFF" variant="Bold" />
          </View>
          <DynamicText style={styles.quickLabel}>Khách hàng</DynamicText>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.quickButton} onPress={() => navigation.navigate(Screen.PROMOTION_LIST as any)}>
          <View style={[styles.quickIconContainer, {backgroundColor: '#37BCAC'}]}>
            <PercentageSquare size={20} color="#FFFFFF" variant="Bold" />
          </View>
          <DynamicText style={styles.quickLabel}>Khuyến mãi</DynamicText>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.quickButton} onPress={() => navigation.navigate(Screen.PROVIDER as any)}>
          <View style={[styles.quickIconContainer, {backgroundColor: '#4A6FFF'}]}>
            <ShoppingBag size={20} color="#FFFFFF" variant="Bold" />
          </View>
          <DynamicText style={styles.quickLabel}>Nhà cung cấp</DynamicText>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.quickButton} onPress={() => navigation.navigate(Screen.WARRANTY as any)}>
          <View style={[styles.quickIconContainer, {backgroundColor: '#FF9500'}]}>
            <ReceiptAdd size={20} color="#FFFFFF" variant="Bold" />
          </View>
          <DynamicText style={styles.quickLabel}>Bảo hành</DynamicText>
        </TouchableOpacity>
      </View>
      
      <Tab.Navigator
        initialRouteName={Screen.DAYSCREEN}
        tabBar={props => <MyTabs {...props} />}>
        <Tab.Screen
          name={Screen.DAYSCREEN}
          component={DayScreen}
          options={{
            tabBarLabel: contents.home.today,
          }}
        />
        <Tab.Screen
          name={Screen.WEEKSCREEN}
          component={WeekScreen}
          options={{
            tabBarLabel: contents.home.week,
          }}
        />
        <Tab.Screen
          name={Screen.MONTHSCREEN}
          component={MonthScreen}
          options={{
            tabBarLabel: contents.home.month,
          }}
        />
      </Tab.Navigator>
    </View>
  );
};

export default TabNav;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.backgroundColor,
  },
  // Quick access buttons styles
  quickAccessRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: moderateScale(16),
    marginBottom: scaleHeight(10),
    marginTop: scaleHeight(5),
  },
  quickButton: {
    alignItems: 'center',
    width: scaleWidth(70),
  },
  quickIconContainer: {
    width: scaleWidth(45),
    height: scaleWidth(30),
    borderRadius: moderateScale(6),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scaleHeight(4),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  quickLabel: {
    fontSize: moderateScale(9),
    textAlign: 'center',
    color: color.accentColor.darkColor,
    fontWeight: '500',
  },
  tabBar: {
    borderRadius: moderateScale(12),
    height: scaleHeight(90),
    backgroundColor: '#EBEBEC',
    flexDirection: 'row',
    marginHorizontal: moderateScale(16),
    paddingHorizontal: moderateScale(5),
    paddingVertical: moderateScale(3),
    marginBottom: scaleHeight(30),
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: moderateScale(10),
  },
  tabItemActive: {
    backgroundColor: '#fff',
  },
  tabText: {
    color: '#000',
    fontSize: moderateScale(14),
  },
});
