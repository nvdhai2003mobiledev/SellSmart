import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { DynamicText, Header, Input } from '../../../components';
import { color, moderateScale, scaleWidth } from '../../../utils';
import { promotionAPI } from '../../../services/api/promotionAPI';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { rootStore } from '../../../models/root-store';
import { Calendar } from 'iconsax-react-native';

// Type cho dữ liệu gửi lên API
type PromotionRequest = {
  name: string;
  discount: number;
  minOrderValue: number;
  maxDiscount: number;
  startDate: string;
  endDate: string;
  status: 'sapdienra' | 'active' | 'expired';
};

const AddPromotionScreen = observer(() => {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [discount, setDiscount] = useState('');
  const [minOrderValue, setMinOrderValue] = useState('');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const validateInputs = () => {
    if (!name.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên khuyến mãi');
      return false;
    }

    const discountNum = parseFloat(discount);
    if (isNaN(discountNum) || discountNum <= 0 || discountNum > 100) {
      Alert.alert('Lỗi', 'Giảm giá phải từ 1% đến 100%');
      return false;
    }

    const minOrderValueNum = parseFloat(minOrderValue);
    if (isNaN(minOrderValueNum) || minOrderValueNum <= 0) {
      Alert.alert('Lỗi', 'Giá trị đơn tối thiểu phải lớn hơn 0');
      return false;
    }

    const maxDiscountNum = parseFloat(maxDiscount);
    if (isNaN(maxDiscountNum) || maxDiscountNum <= 0) {
      Alert.alert('Lỗi', 'Giảm giá tối đa phải lớn hơn 0');
      return false;
    }

    if (maxDiscountNum <= minOrderValueNum) {
      Alert.alert('Lỗi', 'Giảm giá tối đa phải lớn hơn giá trị đơn tối thiểu');
      return false;
    }

    // Reset time part of dates for accurate date comparison
    const startDateTime = new Date(startDate);
    startDateTime.setHours(0, 0, 0, 0);
    
    const endDateTime = new Date(endDate);
    endDateTime.setHours(0, 0, 0, 0);

    if (endDateTime < startDateTime) {
      Alert.alert(
        'Lỗi',
        `Ngày kết thúc (${endDateTime.toLocaleDateString('vi-VN')}) không thể trước ngày bắt đầu (${startDateTime.toLocaleDateString('vi-VN')})`
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateInputs()) return;

    try {
      // Tính toán trạng thái dựa trên ngày
      const currentDate = new Date();
      let status: 'sapdienra' | 'active' | 'expired';
      
      if (currentDate < startDate) {
        status = 'sapdienra';
      } else if (currentDate >= startDate && currentDate <= endDate) {
        status = 'active';
      } else {
        status = 'expired';
      }

      const promotionData: PromotionRequest = {
        name: name.trim(),
        discount: parseFloat(discount),
        minOrderValue: parseFloat(minOrderValue),
        maxDiscount: parseFloat(maxDiscount),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        status
      };

      const response = await promotionAPI.addPromotion(promotionData);

      if (response.ok && response.data) {
        // Lấy danh sách khuyến mãi mới nhất từ server
        const refreshResponse = await promotionAPI.getPromotions();
        if (refreshResponse.ok && refreshResponse.data) {
          rootStore.promotionStore.setPromotions(refreshResponse.data);
          
          // Hiển thị thông báo thành công và quay lại màn hình trước
          Alert.alert('Thành công', 'Thêm khuyến mãi thành công', [
            {
              text: 'OK',
              onPress: () => {
                navigation.goBack();
                // Gọi API lấy danh sách mới một lần nữa sau khi quay lại màn hình danh sách
                promotionAPI.getPromotions().then(finalResponse => {
                  if (finalResponse.ok && finalResponse.data) {
                    rootStore.promotionStore.setPromotions(finalResponse.data);
                  }
                });
              }
            }
          ]);
        }
      } else {
        Alert.alert('Lỗi', 'Không thể thêm khuyến mãi');
      }
    } catch (error) {
      console.error('Error adding promotion:', error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi thêm khuyến mãi');
    }
  };

  const onStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const onEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Thêm khuyến mãi"
        showBackIcon={true}
        onPressBack={() => navigation.goBack()}
      />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <View style={styles.section}>
            <DynamicText style={styles.sectionTitle}>Thông tin cơ bản</DynamicText>
            <View style={styles.inputWrapper}>
              <DynamicText style={styles.label}>Tên khuyến mãi</DynamicText>
              <Input
                inputContainerStyle={styles.inputContainer}
                placeholderText="Nhập tên khuyến mãi"
                value={name}
                onChangeText={setName}
                inputStyle={styles.input}
              />
            </View>

            <View style={styles.inputWrapper}>
              <DynamicText style={styles.label}>Giảm giá (%)</DynamicText>
              <Input
                inputContainerStyle={styles.inputContainer}
                placeholderText="Nhập phần trăm giảm giá"
                value={discount}
                onChangeText={setDiscount}
                keyboardType="numeric"
                inputStyle={styles.input}
              />
            </View>
          </View>

          <View style={styles.section}>
            <DynamicText style={styles.sectionTitle}>Điều kiện áp dụng</DynamicText>
            <View style={styles.inputWrapper}>
              <DynamicText style={styles.label}>Giá trị đơn tối thiểu</DynamicText>
              <Input
                inputContainerStyle={styles.inputContainer}
                placeholderText="Nhập giá trị đơn tối thiểu"
                value={minOrderValue}
                onChangeText={setMinOrderValue}
                keyboardType="numeric"
                inputStyle={styles.input}
              />
            </View>

            <View style={styles.inputWrapper}>
              <DynamicText style={styles.label}>Giảm giá tối đa</DynamicText>
              <Input
                inputContainerStyle={styles.inputContainer}
                placeholderText="Nhập giảm giá tối đa"
                value={maxDiscount}
                onChangeText={setMaxDiscount}
                keyboardType="numeric"
                inputStyle={styles.input}
              />
            </View>
          </View>

          <View style={styles.section}>
            <DynamicText style={styles.sectionTitle}>Thời gian áp dụng</DynamicText>
            <View style={styles.dateContainer}>
              <DynamicText style={styles.label}>Ngày bắt đầu</DynamicText>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowStartDatePicker(true)}>
                <DynamicText style={styles.dateText}>
                  {startDate.toLocaleDateString('vi-VN')}
                </DynamicText>
                <Calendar size={20} color={color.accentColor.darkColor} />
              </TouchableOpacity>
            </View>

            <View style={styles.dateContainer}>
              <DynamicText style={styles.label}>Ngày kết thúc</DynamicText>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowEndDatePicker(true)}>
                <DynamicText style={styles.dateText}>
                  {endDate.toLocaleDateString('vi-VN')}
                </DynamicText>
                <Calendar size={20} color={color.accentColor.darkColor} />
              </TouchableOpacity>
            </View>
          </View>

          {showStartDatePicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onStartDateChange}
              minimumDate={new Date()}
            />
          )}

          {showEndDatePicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onEndDateChange}
              minimumDate={startDate}
            />
          )}

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}>
            <DynamicText style={styles.submitButtonText}>
              Thêm khuyến mãi
            </DynamicText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.backgroundColor,
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: moderateScale(16),
    paddingBottom: moderateScale(32),
  },
  section: {
    marginBottom: moderateScale(32),
    backgroundColor: color.accentColor.whiteColor,
    borderRadius: moderateScale(12),
    padding: moderateScale(20),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: color.accentColor.darkColor,
    marginBottom: moderateScale(24),
  },
  inputWrapper: {
    marginBottom: moderateScale(20),
  },
  label: {
    fontSize: moderateScale(15),
    fontWeight: '500',
    color: color.accentColor.darkColor,
    marginBottom: moderateScale(8),
  },
  inputContainer: {
    height: moderateScale(48),
    backgroundColor: color.backgroundColor,
    borderWidth: 1,
    borderColor: color.accentColor.grayColor,
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(16),
  },
  input: {
    fontSize: moderateScale(16),
    color: color.accentColor.darkColor,
    flex: 1,
    padding: 0,
  },
  dateContainer: {
    marginBottom: moderateScale(20),
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: color.accentColor.grayColor,
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
    backgroundColor: color.backgroundColor,
    height: moderateScale(48),
  },
  dateText: {
    fontSize: moderateScale(16),
    color: color.accentColor.darkColor,
  },
  submitButton: {
    backgroundColor: color.primaryColor,
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    marginTop: moderateScale(32),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  submitButtonText: {
    color: color.accentColor.whiteColor,
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
});

export default AddPromotionScreen;
