import React from 'react'
import {createNativeStackNavigator} from "@react-navigation/native-stack";
import {LoginScreen, OnboardingScreen, SplashScreen} from "@src/app/screens";

const Stack = createNativeStackNavigator();
const AppNavigation = () => {
  return (
      <Stack.Navigator initialRouteName={'Splash'} screenOptions={{headerShown: false}}>
        <Stack.Screen name={'Splash'} component={SplashScreen} />
        <Stack.Screen name={'Onboarding'} component={OnboardingScreen} />
        <Stack.Screen name={'Login'} component={LoginScreen} />
      </Stack.Navigator>
  )
}
export default AppNavigation
