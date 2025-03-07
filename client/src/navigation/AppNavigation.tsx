import React from 'react';
import { createNativeStackNavigator, NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { BottomNavigation } from './BottomNavigation';
import { HomeScreen, LoginScreen, SplashScreen } from '../screens';
import { Screen } from './navigation.type';
import OnboardingScreen from '../screens/main/Splash/OnboardingScreen';
import ForgotPasswordScreen from '../screens/main/Splash/ForgotPasswordScreen';
import XacMinh from '../screens/main/Splash/XacMinh';
import NewPass from '../screens/main/Splash/NewPass';
import AddStaffScreen from '../screens/main/AddStaff/AddStaffScreen';
import StaffDetailScreen from '../screens/main/StaffDetail/StaffDetailScreen';
import UpdateStaffScreen from '../screens/main/UpdateStaff/UpdateStaffScreen';
import AddCustomerScreen from '../screens/main/AddCustomer/AddCustomerScreen';
import UpdateCustomerScreen from '../screens/main/UpdateCustomer/UpdateCustomerScreen';
import CustomerDetailScreen from '../screens/main/CustomerDetail/CustomerDetailScreen';
import ConfigScreen from '../screens/main/Config/ConfigScreen';
import NotificationScreen from '../screens/main/Notification/NotificationScreen';
import { StaffScreen } from '../screens/main/Staff/StaffScreen';
import { CustomerScreen } from '../screens/main/Custemer/CustomerScreen';

const RootStack = createNativeStackNavigator();
const screenOptions: NativeStackNavigationOptions = {
  animation: 'slide_from_right',
  headerShown: false,
};
export const AppNavigation = () => {
  return (
    <RootStack.Navigator
      // initialRouteName= "LoginScreen"
      initialRouteName={Screen.SPLASH}
      screenOptions={screenOptions}>
      <RootStack.Screen name={Screen.SPLASH} component={SplashScreen} />
      <RootStack.Screen name={Screen.BOTTOM_TAB} component={BottomNavigation} />
      <RootStack.Screen name= "OnboardingScreen" component={OnboardingScreen} />
      <RootStack.Screen name= "ForgotPasswordScreen" component={ForgotPasswordScreen} />
      <RootStack.Screen name= "XacMinh" component={XacMinh} />
      <RootStack.Screen name= "NewPass" component={NewPass} />
      <RootStack.Screen name= "LoginScreen" component={LoginScreen} />

    
      <RootStack.Screen name={Screen.NOTIFI} component={NotificationScreen} />
      <RootStack.Screen name={Screen.CONFIG} component={ConfigScreen} />
      <RootStack.Screen name={Screen.CUSTOMERDETAIL} component={CustomerDetailScreen} />
      <RootStack.Screen name={Screen.UPDATECUSTOMER} component={UpdateCustomerScreen} />
      <RootStack.Screen name={Screen.ADDCUSTOMER} component={AddCustomerScreen} />
      <RootStack.Screen name={Screen.CUSTOMER} component={CustomerScreen} />
      <RootStack.Screen name={Screen.UPDATESTAFF} component={UpdateStaffScreen} />
      <RootStack.Screen name={Screen.STAFFDEATIL} component={StaffDetailScreen} />
      <RootStack.Screen name={Screen.ADDSTAFF} component={AddStaffScreen} />
      <RootStack.Screen name={Screen.STAFF} component={StaffScreen} />

    </RootStack.Navigator>
  );
};
