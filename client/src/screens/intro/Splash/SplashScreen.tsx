import React, {useEffect, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {observer} from 'mobx-react-lite';
import {rootStore} from '../../../models/root-store';
import {Screen} from '../../../navigation/navigation.type';
import {Images} from '../../../assets';
import {Image} from 'react-native';
import {color, scaledSize} from '../../../utils';

const SplashScreen = observer(() => {
  const navigation = useNavigation();
  const {isAuthenticated, hasSeenOnboarding} = rootStore;
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        // Load auth state
        await rootStore.auth.loadStoredAuth();
        // Load onboarding state
        await rootStore.onboarding.loadStoredOnboarding();

        // Mark as ready after a delay
        setTimeout(() => {
          setIsReady(true);
        }, 2000);
      } catch (error) {
        console.error('Error during initialization:', error);
      }
    };

    initialize();
  }, []);

  useEffect(() => {
    if (!isReady) {return;}

    if (isAuthenticated) {
      navigation.reset({
        index: 0,
        routes: [{name: Screen.BOTTOM_TAB}],
      });
    } else if (!hasSeenOnboarding) {
      navigation.reset({
        index: 0,
        routes: [{name: Screen.ONBOARDING}],
      });
    } else {
      navigation.reset({
        index: 0,
        routes: [{name: Screen.LOGIN}],
      });
    }
  }, [isReady, isAuthenticated, hasSeenOnboarding, navigation]);

  return (
    <View style={styles.container}>
      <Image source={Images.LOGO} style={styles.logo} />
    </View>
  );
});

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.accentColor.whiteColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: scaledSize(330),
    height: scaledSize(130),
    resizeMode: 'contain',
  },
});
