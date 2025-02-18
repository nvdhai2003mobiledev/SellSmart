import React from 'react';
import { createNativeStackNavigator, NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { BottomNavigation } from './BottomNavigation';
import { LoginScreen, SplashScreen } from '../screens';
import { Screen } from './navigation.type';

const RootStack = createNativeStackNavigator();
const screenOptions: NativeStackNavigationOptions = {
  animation: 'slide_from_right',
  headerShown: false,
};
export const AppNavigation = () => {
  return (
    <RootStack.Navigator
      initialRouteName={Screen.LOGIN}
      screenOptions={screenOptions}>
      <RootStack.Screen name={Screen.SPLASH} component={SplashScreen} />
      <RootStack.Screen name={Screen.LOGIN} component={LoginScreen} />
      <RootStack.Screen name={Screen.BOTTOM_TAB} component={BottomNavigation} />
    </RootStack.Navigator>
  );
};
