import {Image, StyleSheet, View} from 'react-native';
import React, {useEffect} from 'react';
import {useNavigation} from '@react-navigation/native';
import {BaseLayout} from '../../../components';
import {Images} from '../../../assets';
import {scaledSize} from '../../../utils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Screen} from '../../../navigation/navigation.type';

const SplashScreen = () => {
  const navigation = useNavigation();

  useEffect(() => {
    const checkFirstTimeUse = async () => {
      try {
        const hasSeenOnboarding = await AsyncStorage.getItem(
          'hasSeenOnboarding',
        );

        setTimeout(() => {
          if (hasSeenOnboarding === 'true') {
            navigation.reset({
              index: 0,
              routes: [{name: Screen.ONBOARDING as never}],
            }); // Lần đầu vào app -> chuyển sang Onboarding
          } else {
            navigation.reset({
              index: 0,
              routes: [{name: Screen.ONBOARDING as never}],
            }); // Lần đầu vào app -> chuyển sang Onboarding
          }
        }, 3000);
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      }
    };

    checkFirstTimeUse();
  }, []);

  return (
    <BaseLayout style={styles.container} scrollable={false}>
      <View style={styles.imageContainer}>
        <Image source={Images.LOGO} style={styles.logoImage} />
      </View>
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
  imageContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: scaledSize(120),
    height: scaledSize(120),
    resizeMode: 'contain',
  },
});
