import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/main/Home/HomeScreen';
import { ProviderScreen } from '../screens/main/Provider/ProviderScreen';
import { AddProviderScreen } from '../screens/main/Provider/AddProviderScreen';

export type AppStackParamList = {
  Home: undefined;
  Provider: undefined;
  AddProvider: undefined;
};

const Stack = createNativeStackNavigator<AppStackParamList>();

export const AppNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Provider" component={ProviderScreen} />
      <Stack.Screen name="AddProvider" component={AddProviderScreen} />
    </Stack.Navigator>
  );
}; 