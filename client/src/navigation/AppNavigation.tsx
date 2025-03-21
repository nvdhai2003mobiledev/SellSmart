import React from 'react';
import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from '@react-navigation/native-stack';
import {BottomNavigation} from './BottomNavigation';
import {RootStackParamList, Screen} from './navigation.type';
import {
  AddCustomerScreen,
  AddEmployeeScreen,
  ConfigScreen,
  CreatePasswordScreen,
  CustomerScreen,
  DetailCustomerScreen,
  DetailEmployeeScreen,
  EmployeeScreen,
  ForgotPasswordScreen,
  LoginScreen,
  NotificationScreen,
  OnboardingScreen,
  SplashScreen,
  UpdateCustomerScreen,
  UpdateEmployeeScreen,
  VerifyScreen,
} from '../screens';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const screenOptions: NativeStackNavigationOptions = {
  animation: 'slide_from_right',
  headerShown: false,
};
export const AppNavigation = () => {
  return (
    <RootStack.Navigator
      initialRouteName={Screen.SPLASH}
      screenOptions={screenOptions}>
      <RootStack.Screen name={Screen.SPLASH} component={SplashScreen} />
      <RootStack.Screen name={Screen.BOTTOM_TAB} component={BottomNavigation} />
      <RootStack.Screen name={Screen.ONBOARDING} component={OnboardingScreen} />
      <RootStack.Screen
        name={Screen.FORGOT_PASSWORD}
        component={ForgotPasswordScreen}
      />
      <RootStack.Screen name={Screen.VERIFY} component={VerifyScreen} />
      <RootStack.Screen
        name={Screen.CREATE_PASSWORD}
        component={CreatePasswordScreen}
      />
      <RootStack.Screen name={Screen.LOGIN} component={LoginScreen} />
      <RootStack.Screen name={Screen.NOTIFI} component={NotificationScreen} />
      <RootStack.Screen name={Screen.CONFIG} component={ConfigScreen} />
      <RootStack.Screen
        name={Screen.DETAIL_CUSTOMER}
        component={DetailCustomerScreen}
      />
      <RootStack.Screen
        name={Screen.UPDATE_CUSTOMER}
        component={UpdateCustomerScreen}
      />
      <RootStack.Screen
        name={Screen.ADD_CUSTOMER}
        component={AddCustomerScreen}
      />
      <RootStack.Screen name={Screen.CUSTOMERS} component={CustomerScreen} />
      <RootStack.Screen
        name={Screen.UPDATE_EMPLOYEE}
        component={UpdateEmployeeScreen}
      />
      <RootStack.Screen
        name={Screen.DETAIL_EMPLOYEE}
        component={DetailEmployeeScreen}
      />
      <RootStack.Screen
        name={Screen.ADD_EMPLOYEE}
        component={AddEmployeeScreen}
      />
      <RootStack.Screen name={Screen.EMPLOYEES} component={EmployeeScreen} />
    </RootStack.Navigator>
  );
};
