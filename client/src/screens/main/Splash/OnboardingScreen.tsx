import React, { useState, useRef } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import Swiper from "react-native-swiper";
import Icon from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { scaledSize } from '../../../utils';
import { BaseLayout, Button, DynamicText, Input } from '../../../components';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { contents } from '../../../context';


const OnboardingScreen = () => {
  const navigation = useNavigation();
  const swiperRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const slides = [
    {
      title: "Quản lý tồn kho",
      description: "Kiểm soát hàng hóa dễ dàng, cập nhật tức thời.",
      image: require("../../../assets/images/a1.png"),
    },
    {
      title: "Báo cáo doanh thu",
      description: "Cập nhật kịp thời mọi lúc, mọi nơi.",
      image: require("../../../assets/images/a2.png"),
    },
    {
      title: "Quản lý tồn kho chính xác",
      description: "Kiểm soát hàng hóa dễ dàng, cập nhật tức thời.",
      image: require("../../../assets/images/a3.png"),
    },
  ];

  const handleNext = async () => {
    if (currentIndex < slides.length - 1) {
      swiperRef.current?.scrollBy(1);
    } else {
      await AsyncStorage.setItem("hasSeenOnboarding", "true");
      navigation.navigate("LoginScreen"); // Thay vì replace
    }
  };
  

  return (
    <View style={styles.container}>
      {/* Nút "Bỏ qua" */}
      <TouchableOpacity style={styles.skipButton} onPress={() => navigation.navigate("LoginScreen")}>
  <DynamicText style={styles.skipText}>{contents.onboarding.onboarding3.boqua}</DynamicText>
</TouchableOpacity>


      {/* Swiper */}
      <Swiper
        ref={swiperRef}
        loop={false}
        showsPagination={true}
        onIndexChanged={(index) => setCurrentIndex(index)}
        nextButton={
          <View style={styles.arrowButton}>
            <Icon name="arrow-forward-circle" size={scaledSize(40)} color="#4CAF50" />
          </View>
        }
        prevButton={
          <View style={styles.arrowButton}>
            <Icon name="arrow-back-circle" size={scaledSize(40)} color="#4CAF50" />
          </View>
        }
      >
        {slides.map((slide, index) => (
          <View key={index} style={styles.slide}>
            <View style={styles.imageContainer}>
              <Image source={slide.image} style={styles.image} />
            </View>
            <DynamicText style={styles.title}>{slide.title}</DynamicText>
            <DynamicText style={styles.description}>{slide.description}</DynamicText>
          </View>
        ))}
      </Swiper>

      {/* Nút "Tiếp theo" hoặc "Bắt đầu ngay" */}
      <View style={styles.buttonContainer}>
        <Button 
          title={currentIndex === slides.length - 1 ? "Bắt đầu ngay" : "Tiếp theo"} 
          onPress={handleNext} 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  skipButton: {
    position: "absolute",
    top: scaledSize(40),
    right: scaledSize(20),
    zIndex: 1,
  },
  skipText: {
    fontSize: scaledSize(16),
    color: "#1E90FF",
    fontWeight: "bold",
  },
  slide: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: scaledSize(10),
  },
  imageContainer: {
    width: scaledSize(350),
    height: scaledSize(350),
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  title: {
    fontSize: scaledSize(20),
    fontWeight: "bold",
    color: "#363D4E",
    marginBottom: scaledSize(10),
    textAlign: "center",
  },
  description: {
    fontSize: scaledSize(15),
    color: "#747475",
    textAlign: "center",
    lineHeight: scaledSize(22),
  },
  arrowButton: {
    marginBottom: scaledSize(550), // Điều chỉnh vị trí lên trên
  },
  buttonContainer: {
    position: "absolute",
    bottom: scaledSize(65),
    left: 25,
    right: 25,
    alignItems: "center",
  },
});

export default OnboardingScreen;
