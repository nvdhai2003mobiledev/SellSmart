import React from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import {Screen} from './navigation.type';
import {DayScreen, WeekScreen, MonthScreen} from '../screens';
import {color, moderateScale, scaleHeight, scaleWidth} from '../utils';
import {contents} from '../context';
import {DynamicText, Header} from '../components';
import {Notification} from 'iconsax-react-native';

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
