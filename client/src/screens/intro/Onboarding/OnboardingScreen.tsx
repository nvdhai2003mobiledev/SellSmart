import React, {useRef, useState} from 'react';
import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {color, scaledSize, scaleHeight} from '../../../utils';
import {BaseLayout, Button, DynamicText} from '../../../components';
import {Screen} from '../../../navigation/navigation.type.ts';
import {Fonts, Images} from '../../../assets';
import {contents} from '../../../context';
import Swiper from 'react-native-swiper';
import AsyncStorage from '@react-native-async-storage/async-storage';

const {width} = Dimensions.get('window');
const OnboardingScreen = () => {
  const navigation = useNavigation<any>();
  const swiperRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const slides = [
    {
      image: Images.ONBOARDING1,
      title: contents.onboarding.onboarding1.title,
      description: contents.onboarding.onboarding1.description,
    },
    {
      image: Images.ONBOARDING2,
      title: contents.onboarding.onboarding2.title,
      description: contents.onboarding.onboarding2.description,
    },
    {
      image: Images.ONBOARDING3,
      title: contents.onboarding.onboarding3.title,
      description: contents.onboarding.onboarding3.description,
    },
  ];

  const handleNext = async () => {
    if (currentIndex < slides.length - 1) {
      // @ts-ignore
      swiperRef.current?.scrollBy(1);
    } else {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      const value = await AsyncStorage.getItem('hasSeenOnboarding');
      console.log('Saved value:', value); // Kiểm tra giá trị lưu
      navigation.replace(Screen.LOGIN);
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    const value = await AsyncStorage.getItem('hasSeenOnboarding');
    console.log('Saved value:', value); // Kiểm tra giá trị lưu
    navigation.replace(Screen.LOGIN);
  };

  return (
    <BaseLayout style={styles.container}>
      {/* Nút "Bỏ qua" */}
      <TouchableOpacity
        style={styles.skipButton}
        activeOpacity={0.7}
        onPress={handleSkip}>
        <DynamicText style={styles.skipText}>
          {contents.onboarding.skip}
        </DynamicText>
      </TouchableOpacity>

      {/* Swiper với hiệu ứng đơn giản */}
      <Animated.View style={[styles.swiperContainer, {opacity: fadeAnim}]}>
        <Swiper
          ref={swiperRef}
          loop={false}
          showsButtons={false}
          showsPagination={true}
          onIndexChanged={index => setCurrentIndex(index)}
          dot={<View style={styles.paginationDot} />}
          activeDot={<View style={styles.paginationDotActive} />}
          paginationStyle={styles.paginationContainer}
          width={width}
          autoplay={false}
          bounces={true}>
          {slides.map((slide, index) => (
            <View key={index} style={styles.slide}>
              <View style={styles.imageContainer}>
                <Image source={slide.image} style={styles.image} />
              </View>
              <DynamicText style={styles.title}>{slide.title}</DynamicText>
              <DynamicText style={styles.description}>
                {slide.description}
              </DynamicText>
            </View>
          ))}
        </Swiper>
      </Animated.View>

      {/* Nút "Tiếp theo" hoặc "Bắt đầu ngay" */}
      <View style={styles.buttonContainer}>
        <Button
          title={
            currentIndex === slides.length - 1
              ? contents.onboarding.start
              : contents.onboarding.next
          }
          onPress={handleNext}
        />
      </View>
    </BaseLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skipButton: {
    position: 'absolute',
    top: scaledSize(30),
    right: scaledSize(20),
    zIndex: 10,
    padding: scaledSize(8),
  },
  skipText: {
    fontSize: scaledSize(16),
    color: color.accentColor.darkColor,
    fontFamily: Fonts.Inter_SemiBold,
  },
  swiperContainer: {
    flex: 1,
    width: '100%',
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  imageContainer: {
    width: scaledSize(350),
    height: scaledSize(350),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scaledSize(20),
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  title: {
    fontSize: scaledSize(22),
    fontWeight: 'bold',
    color: color.accentColor.darkColor,
    marginBottom: scaledSize(15),
    textAlign: 'center',
    paddingHorizontal: scaledSize(20),
  },
  description: {
    fontSize: scaledSize(16),
    color: color.accentColor.grayColor,
    textAlign: 'center',
    lineHeight: scaledSize(24),
    marginBottom: scaledSize(20),
    paddingHorizontal: scaledSize(30),
  },
  paginationContainer: {
    bottom: scaledSize(80),
  },
  paginationDot: {
    width: scaledSize(8),
    height: scaledSize(8),
    borderRadius: scaledSize(4),
    backgroundColor: color.accentColor.grayColor,
    marginHorizontal: scaledSize(3),
  },
  paginationDotActive: {
    width: scaledSize(8),
    height: scaledSize(8),
    borderRadius: scaledSize(4),
    backgroundColor: color.primaryColor,
    marginHorizontal: scaledSize(3),
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: scaleHeight(50),
    paddingHorizontal: scaledSize(20),
  },
});

export default OnboardingScreen;
