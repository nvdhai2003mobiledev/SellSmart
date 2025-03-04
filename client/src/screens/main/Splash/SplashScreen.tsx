import { Image, StyleSheet, View } from 'react-native';
import React, { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BaseLayout } from '../../../components';
import { Images } from '../../../assets';
import { scaledSize } from '../../../utils';
import { contents } from '../../../context';



const SplashScreen = () => {
  const navigation = useNavigation();

  useEffect(() => {
    const checkFirstTimeUse = async () => {
      try {
        const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');

        setTimeout(() => {
          if (hasSeenOnboarding === 'true') {
            navigation.replace('LoginScreen'); // Lần sau vào app -> chuyển sang Login
          } else {
            navigation.replace('OnboardingScreen'); // Lần đầu vào app -> chuyển sang Onboarding
          }
        }, 3000);
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      }
    };

    checkFirstTimeUse();
  }, []);

  return (
    <BaseLayout style={styles.container}>
      <Image source={Images.LOGO} style={styles.logoImage} />
    </BaseLayout>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: scaledSize(120),
    height: scaledSize(120),
    resizeMode: 'contain',
  },
});
