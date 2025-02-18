import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import {
  Box,
  Box1,
  Category,
  ChartCircle,
  Home,
  Note,
  Note1,
} from 'iconsax-react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BottomRootStackParamList, Screen } from './navigation.type';
import { color, moderateScale, scaledSize, scaleHeight, scaleWidth } from '../utils';
import HomeScreen from '../screens/bottomTab/Home/HomeScreen';
import OrderScreen from '../screens/bottomTab/Order/OrderScreen';
import ProductScreen from '../screens/bottomTab/Product/ProductScreen';
import StatisticalScreen from '../screens/bottomTab/Statistical/StatisticalScreen';
import MenuScreen from '../screens/bottomTab/Menu/MenuScreen';

const BottomTab = createBottomTabNavigator<BottomRootStackParamList>();

const SPRING_CONFIG = {
  damping: 10,
  mass: 0.5,
  stiffness: 100,
};

const AnimatedIcon = ({
  focused,
  IconComponent,
  colors,
  variant,
  onPress,
}: {
  focused: boolean;
  IconComponent: any;
  colors: string;
  variant: string;
  onPress?: () => void;
}) => {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const bubbleScale = useSharedValue(0);
  const ringScale = useSharedValue(0);
  const ringOpacity = useSharedValue(0);

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.8, { duration: 100 }),
      withTiming(1, { duration: 150 }),
    );
    translateY.value = withSequence(
      withSpring(-8, { ...SPRING_CONFIG, damping: 4 }),
      withSpring(0, SPRING_CONFIG),
    );
    onPress?.();
  };

  React.useEffect(() => {
    if (focused) {
      translateY.value = withSequence(
        withTiming(-15, { duration: 300 }),
        withSpring(0, { ...SPRING_CONFIG, damping: 12 }),
      );

      scale.value = withSequence(
        withTiming(0.6, { duration: 150 }),
        withSpring(1.2, SPRING_CONFIG),
        withSpring(1, { ...SPRING_CONFIG, damping: 15 }),
      );

      bubbleScale.value = withSequence(
        withTiming(1.2, { duration: 200 }),
        withTiming(1, { duration: 150 }),
      );
      ringScale.value = withSequence(
        withTiming(0.8, { duration: 100 }),
        withTiming(1.5, { duration: 300 }),
        withTiming(1, { duration: 200 }),
      );
      ringOpacity.value = withSequence(
        withTiming(0.6, { duration: 100 }),
        withTiming(0, { duration: 300 }),
      );
    } else {
      scale.value = withTiming(1, { duration: 300 });
      translateY.value = withTiming(0, { duration: 300 });
      bubbleScale.value = withTiming(0, { duration: 200 });
      ringScale.value = withTiming(0, { duration: 200 });
      ringOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [focused]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  const bubbleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bubbleScale.value }],
    opacity: interpolate(bubbleScale.value, [0, 1], [0, 0.15]),
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={styles.container}>
        <Animated.View
          style={[
            styles.bubble,
            bubbleStyle,
            { backgroundColor: color.primaryColor },
          ]}
        />
        <Animated.View
          style={[styles.ring, ringStyle, { borderColor: color.primaryColor }]}
        />
        <Animated.View style={iconStyle}>
          <IconComponent
            variant={variant}
            size={scaledSize(28)}
            color={colors}
          />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};

export const BottomNavigation = () => {
  return (
    <BottomTab.Navigator
      initialRouteName={Screen.HOME}
      screenOptions={({ route, navigation }) => ({
        tabBarIcon: ({ focused }) => {
          let IconComponent: any;
          let colors = focused
            ? color.primaryColor
            : color.accentColor.grayColor;
          let variant = focused ? 'Bold' : 'Bulk';

          if (route.name === Screen.HOME) {
            IconComponent = Home;
          } else if (route.name === Screen.ORDER) {
            IconComponent = focused ? Note : Note1;
          } else if (route.name === Screen.PRODUCT) {
            IconComponent = focused ? Box : Box1;
          } else if (route.name === Screen.STATISTICAL) {
            IconComponent = ChartCircle;
          } else if (route.name === Screen.MENU) {
            IconComponent = Category;
          }

          return (
            <AnimatedIcon
              focused={focused}
              IconComponent={IconComponent}
              colors={colors}
              variant={variant}
              onPress={() => navigation.navigate(route.name)}
            />
          );
        },
        tabBarIconStyle: {
          margin: 'auto',
        },
        tabBarShowLabel: false,
        tabBarStyle: {
          height: scaleHeight(65),
          borderRadius: moderateScale(20),
          position: 'absolute',
          bottom: scaleHeight(30),
          marginHorizontal: scaleWidth(30),
          paddingHorizontal: scaleHeight(20),
          shadowColor: color.accentColor.darkColor,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.2,
          shadowRadius: moderateScale(20),
          elevation: moderateScale(20),
          backgroundColor: color.accentColor.whiteColor,
        },
        headerShown: false,
      })}>
      <BottomTab.Screen name={Screen.HOME} component={HomeScreen} />
      <BottomTab.Screen name={Screen.ORDER} component={OrderScreen} />
      <BottomTab.Screen name={Screen.PRODUCT} component={ProductScreen} />
      <BottomTab.Screen name={Screen.STATISTICAL} component={StatisticalScreen} />
      <BottomTab.Screen name={Screen.MENU} component={MenuScreen} />
    </BottomTab.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    width: scaledSize(50),
    height: scaledSize(50),
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    position: 'absolute',
    width: scaledSize(48),
    height: scaledSize(48),
    borderRadius: moderateScale(16),
  },
  ring: {
    position: 'absolute',
    width: moderateScale(45),
    height: moderateScale(45),
    borderRadius: moderateScale(25),
    borderWidth: 2,
  },
});
