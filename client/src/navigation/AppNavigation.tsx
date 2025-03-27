import React from 'react';
import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from '@react-navigation/native-stack';
import {BottomNavigation} from './BottomNavigation';
import {RootStackParamList, Screen} from './navigation.type';
import {observer} from 'mobx-react-lite';
import {rootStore} from '../models/root-store';
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
  OrderScreen,
  ProfileScreen,
  SplashScreen,
  UpdateCustomerScreen,
  UpdateEmployeeScreen,
  VerifyScreen,
  CreateOrderScreen,
} from '../screens';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const screenOptions: NativeStackNavigationOptions = {
  animation: 'slide_from_right',
  headerShown: false,
};

export const AppNavigation = observer(() => {
  const {isAuthenticated, isAdmin} = rootStore;

  React.useEffect(() => {
    rootStore.auth.loadStoredAuth();
  }, []);

  // Nếu chưa đăng nhập, chỉ hiển thị các màn hình auth
  if (!isAuthenticated) {
    return (
      <RootStack.Navigator screenOptions={screenOptions}>
        <RootStack.Screen name={Screen.SPLASH} component={SplashScreen} />
        <RootStack.Screen name={Screen.ORDERSCREEN} component={OrderScreen} />
        <RootStack.Screen
          name={Screen.ONBOARDING}
          component={OnboardingScreen}
        />
        <RootStack.Screen name={Screen.LOGIN} component={LoginScreen} />
        <RootStack.Screen
          name={Screen.FORGOT_PASSWORD}
          component={ForgotPasswordScreen}
        />
        <RootStack.Screen name={Screen.VERIFY} component={VerifyScreen} />
        <RootStack.Screen
          name={Screen.CREATE_PASSWORD}
          component={CreatePasswordScreen}
        />
      </RootStack.Navigator>
    );
  }

  // Nếu đã đăng nhập, hiển thị các màn hình chức năng
  return (
    <RootStack.Navigator screenOptions={screenOptions}>
      <RootStack.Screen name={Screen.BOTTOM_TAB} component={BottomNavigation} />
      <RootStack.Screen name={Screen.NOTIFI} component={NotificationScreen} />
      <RootStack.Screen name={Screen.CONFIG} component={ConfigScreen} />
      <RootStack.Screen
        name={Screen.CREATEORDER}
        component={CreateOrderScreen}
      />
      <RootStack.Screen name={Screen.PROFILE} component={ProfileScreen} />
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
      {/* Chỉ admin mới thấy được các màn hình quản lý nhân viên */}
      {isAdmin && (
        <>
          <RootStack.Screen
            name={Screen.UPDATE_EMPLOYEE}
            component={UpdateEmployeeScreen}
          />
          <RootStack.Screen
            name={Screen.DETAIL_EMPLOYEE}
            component={DetailEmployeeScreen}
            options={{
              headerShown: false,
            }}
          />
          <RootStack.Screen
            name={Screen.ADD_EMPLOYEE}
            component={AddEmployeeScreen}
          />
          <RootStack.Screen
            name={Screen.EMPLOYEES}
            component={EmployeeScreen}
            options={{
              headerShown: false,
            }}
          />
        </>
      )}
    </RootStack.Navigator>
  );
});
