import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Button, DynamicText, Header } from '../../../components';
import { contents } from '../../../context';
import { scaledSize, scaleHeight, scaleWidth } from '../../../utils';
import { useForm } from 'react-hook-form';

const ConfigScreen = (navigation) => {
  const [selectedTheme, setSelectedTheme] = useState('system');
  const [selectedFontSize, setSelectedFontSize] = useState(2);
  const [selectedColor, setSelectedColor] = useState('#007AFF');

  const themes = [
    { id: 'system', label: 'Hệ thống' },
    { id: 'light', label: 'Sáng' },
    { id: 'dark', label: 'Tối' },
  ];
  const { handleSubmit } = useForm();
  const onSubmit = (data: any) => {
    console.log(data);
  };
  const colors = ['#007AFF', '#A68BFF', '#30D158', '#FFA500', '#8E44AD', '#FF3B30'];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <Header
              title={contents.config.title}
              showBackIcon={true}
              onPressBack={() => navigation.goBack()}
              showRightIcon={true}
              RightIcon={false}
            />

      {/* Giao diện */}
      <View style={styles.section}>
      <DynamicText style={styles.show}>{contents.config.background}</DynamicText>
        <View style={styles.themeContainer}>
          {themes.map((theme) => (
            <TouchableOpacity
              key={theme.id}
              style={[styles.themeOption, selectedTheme === theme.id && styles.selected]}
              onPress={() => setSelectedTheme(theme.id)}
            >
              <View style={styles.themeImage} />
              <Text>{theme.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Phông chữ */}
      <View style={styles.section}>
      <DynamicText style={styles.fonttext}>{contents.config.font}</DynamicText>
        <View style={styles.fontSizeContainer}>
          <Text>Aa</Text>
          <View style={styles.slider} />
          <Text>Aa</Text>
        </View>
      </View>

      {/* Màu sắc */}
      <View style={styles.section}>
      <DynamicText style={styles.colorBas}>{contents.config.color}</DynamicText>

        <View style={styles.colorContainer}>
          {colors.map((color) => (
            <TouchableOpacity
              key={color}
              style={[styles.colorBox, { backgroundColor: color }, selectedColor === color && styles.selected]}
              onPress={() => setSelectedColor(color)}
            >
              {selectedColor === color && <View style={styles.selectedCheck} />}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Button lưu */}
      <Button
                title={contents.config.button_title}
                onPress={handleSubmit(onSubmit)}
                buttonContainerStyle={styles.buttonContainer}
              />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F8F8F8',
    padding: scaledSize(20),
  },
  show:{
fontWeight:'bold',
fontSize:scaledSize(16),
marginBottom:scaleHeight(10),
  },
  fonttext:{
    fontWeight:'bold',
    fontSize:scaledSize(16),
    marginBottom:scaleHeight(10),
  },
  colorBas:{
    fontWeight:'bold',
    fontSize:scaledSize(16),
    marginBottom:scaleHeight(10),
  },
  headerTitle: {
    fontSize: scaledSize(18),
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  section: {
    backgroundColor: '#FFF',
    borderRadius: scaledSize(10),
    padding: scaledSize(10),
    marginBottom: scaleHeight(15),
  },
  sectionTitle: {
    fontSize: scaledSize(16),
    fontWeight: '600',
    marginBottom: scaleHeight(10),
  },
  themeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  themeOption: {
    alignItems: 'center',
    padding: scaledSize(10),
    borderWidth: scaledSize(1),
    borderColor: '#E0E0E0',
    borderRadius: scaledSize(10),
    width: '30%',
  },
  themeImage: {
    width: scaleWidth(50),
    height: scaleHeight(30),
    backgroundColor: '#E0E0E0',
    marginBottom: scaleHeight(5),
  },
  selected: {
    borderColor: '#007AFF',
    borderWidth: scaleWidth(2),
  },
  fontSizeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slider: {
    flex: 1,
    height: scaleHeight(4),
    backgroundColor: '#D0D0D0',
    marginHorizontal: scaleWidth(10),
  },
  colorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  colorBox: {
    width: scaleWidth(40),
    height: scaleHeight(40),
    borderRadius: scaledSize(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCheck: {
    width: scaleWidth(20),
    height: scaleHeight(20),
    backgroundColor: '#FFF',
    borderRadius: scaledSize(10),
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: scaledSize(15),
    borderRadius: scaledSize(10),
    alignItems: 'center',
    marginTop: scaleHeight(20),
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: scaledSize(16),
    fontWeight: '600',
  },
  buttonContainer: {
    marginTop: scaleHeight(10),
  },
});

export default ConfigScreen;
