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
  OrderListScreen,
  FilterOrderScreen,
  ChooseOrderProduct,
  CustomerSelection,
  OrderDetailScreen,
  OrderHistoryScreen,
  PromotionListScreen,
  AddPromotionScreen,
} from '../screens';

// Trực tiếp import các màn hình không được export từ index
import OrderCancelScreen from '../screens/main/Order/OrderCancelScreen';
import PaymentMethods from '../screens/main/Order/PaymentMethods';
import AddProviderScreen from '../screens/main/Provider/AddProviderScreen';
import DetailProviderScreen from '../screens/main/Provider/DetailProviderScreen';
import ProviderScreen from '../screens/main/Provider/ProviderScreen';
import RevenueScreen from '../screens/bottomTab/Home/RevenueScreen';
import DayRangeScreen from '../screens/bottomTab/Home/DayRangeScreen';

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
        <RootStack.Screen
          name={Screen.BOTTOM_TAB}
          component={BottomNavigation}
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
      <RootStack.Screen name={Screen.PROVIDER} component={ProviderScreen} />
      <RootStack.Screen
        name={Screen.DETAIL_PROVIDER}
        component={DetailProviderScreen}
      />
      <RootStack.Screen
        name={Screen.ADD_PROVIDER}
        component={AddProviderScreen}
      />
      <RootStack.Screen
        name={Screen.CHOOSE_ORDER_PRODUCT}
        component={ChooseOrderProduct}
      />
      <RootStack.Screen
        name={Screen.CUSTOMER_SELECTION}
        component={CustomerSelection}
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
      <RootStack.Screen name={Screen.ORDERSCREEN} component={OrderScreen} />
      <RootStack.Screen name={Screen.ORDERLIST} component={OrderListScreen} />
      <RootStack.Screen
        name={Screen.FILTERORDER}
        component={FilterOrderScreen}
        options={{presentation: 'modal'}}
      />
      <RootStack.Screen
        name={Screen.ORDER_DETAIL}
        component={OrderDetailScreen}
      />
      <RootStack.Screen
        name={Screen.ORDER_CANCEL}
        component={OrderCancelScreen}
      />
      <RootStack.Screen
        name={Screen.ORDER_HISTORY}
        component={OrderHistoryScreen}
      />
      <RootStack.Screen
        name={Screen.PAYMENT_METHODS}
        component={PaymentMethods}
      />
      <RootStack.Screen
        name={Screen.PROMOTION_LIST}
        component={PromotionListScreen}
      />
      <RootStack.Screen
        name={Screen.ADD_PROMOTION}
        component={AddPromotionScreen}
      />
      <RootStack.Screen name={Screen.REVENUE} component={RevenueScreen} />
      <RootStack.Screen name={Screen.DAY_RANGE} component={DayRangeScreen} />

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

export default AppNavigation;
