import React from 'react';
import { createNativeStackNavigator, NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { BottomNavigation } from './BottomNavigation';
import { HomeScreen, LoginScreen, SplashScreen } from '../screens';
import { Screen } from './navigation.type';
import OnboardingScreen from '../screens/main/Splash/OnboardingScreen';
import ForgotPasswordScreen from '../screens/main/Splash/ForgotPasswordScreen';
import XacMinh from '../screens/main/Splash/XacMinh';
import NewPass from '../screens/main/Splash/NewPass';





const RootStack = createNativeStackNavigator();
const screenOptions: NativeStackNavigationOptions = {
  animation: 'slide_from_right',
  headerShown: false,
};
export const AppNavigation = () => {
  return (
    <RootStack.Navigator
      // initialRouteName= "LoginScreen"
      initialRouteName={Screen.BOTTOM_TAB}
      screenOptions={screenOptions}>
      <RootStack.Screen name={Screen.SPLASH} component={SplashScreen} />
      <RootStack.Screen name={Screen.BOTTOM_TAB} component={BottomNavigation} />
      <RootStack.Screen name= "OnboardingScreen" component={OnboardingScreen} />
      <RootStack.Screen name= "ForgotPasswordScreen" component={ForgotPasswordScreen} />
      <RootStack.Screen name= "XacMinh" component={XacMinh} />
      <RootStack.Screen name= "NewPass" component={NewPass} />
      <RootStack.Screen name= "LoginScreen" component={LoginScreen} />

    </RootStack.Navigator>
  );
};
