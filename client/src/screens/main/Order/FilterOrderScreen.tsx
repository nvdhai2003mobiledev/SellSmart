import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Calendar } from 'react-native-calendars';
import Icon from 'react-native-vector-icons/Ionicons';
import { Header, DynamicText, BaseLayout } from '../../../components';
import { color, moderateScale } from '../../../utils';

// Payment status options
const PAYMENT_STATUS_OPTIONS = [
  { label: 'Đã thanh toán', value: 'paid' },
  { label: 'Chưa thanh toán', value: 'unpaid' },
  { label: 'Thanh toán một phần', value: 'partpaid' },
];

// Order status options
const ORDER_STATUS_OPTIONS = [
  { label: 'Chưa xử lý', value: 'pending' },
  { label: 'Đã xử lý', value: 'processing' },
  { label: 'Đã hủy', value: 'canceled' },
];

interface FilterParams {
  existingFilter?: {
    paymentStatus?: string;
    orderStatus?: string;
    startDate?: string;
    endDate?: string;
  };
}

const FilterOrderScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  
  // Get existing filter from previous screen if any
  const params = route.params as FilterParams;
  const existingFilter = params?.existingFilter || {};

  // State for filters
  const [paymentStatus, setPaymentStatus] = useState(existingFilter.paymentStatus || null);
  const [orderStatus, setOrderStatus] = useState(existingFilter.orderStatus || null);
  
  // Date state
  const [startDate, setStartDate] = useState(existingFilter.startDate || null);
  const [endDate, setEndDate] = useState(existingFilter.endDate || null);
  
  // Date picker modal state
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [currentDateType, setCurrentDateType] = useState<'start' | 'end'>('start');

  // Render select option
  const renderSelectOption = (
    options: Array<{label: string, value: string}>, 
    selectedValue: string | null, 
    onSelect: (value: string | null) => void,
    title: string
  ) => (
    <View style={styles.optionContainer}>
      <DynamicText style={styles.optionTitle}>{title}</DynamicText>
      <View style={styles.optionButtonContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionButton,
              selectedValue === option.value && styles.selectedOptionButton
            ]}
            onPress={() => 
              onSelect(selectedValue === option.value ? null : option.value)
            }
          >
            <DynamicText 
              style={[
                styles.optionButtonText,
                selectedValue === option.value && styles.selectedOptionButtonText
              ]}
            >
              {option.label}
            </DynamicText>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Open date picker modal
  const openDatePicker = (type: 'start' | 'end') => {
    setCurrentDateType(type);
    setDatePickerVisible(true);
  };

  // Handle date selection
  const handleDateSelect = (day: any) => {
    const selectedDate = day.dateString;
    
    if (currentDateType === 'start') {
      setStartDate(selectedDate);
    } else {
      setEndDate(selectedDate);
    }
    
    setDatePickerVisible(false);
  };

  // Clear selected date
  const clearDate = (type: 'start' | 'end') => {
    if (type === 'start') {
      setStartDate(null);
    } else {
      setEndDate(null);
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setPaymentStatus(null);
    setOrderStatus(null);
    setStartDate(null);
    setEndDate(null);
  };

  // Apply filter
  const applyFilter = () => {
    // Construct filter object
    const filter: any = {};
    
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (orderStatus) filter.orderStatus = orderStatus;
    if (startDate) filter.startDate = startDate;
    if (endDate) filter.endDate = endDate;

    // Navigate back to order list with filter
    navigation.navigate('ORDERLIST', { 
      filter: Object.keys(filter).length > 0 ? filter : null 
    });
  };

  return (
    <BaseLayout style={styles.container}>
      <Header 
        title="Bộ lọc" 
        showBackIcon 
        onPressBack={() => navigation.goBack()} 
        showRightIcon 
        RightIcon={<Icon name="refresh" size={moderateScale(10)} color={color.primaryColor} />}
        onPressRight={resetFilters}
      />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Payment Status Filter */}
        {renderSelectOption(
          PAYMENT_STATUS_OPTIONS, 
          paymentStatus, 
          setPaymentStatus, 
          'Trạng thái thanh toán'
        )}

        {/* Order Status Filter */}
        {renderSelectOption(
          ORDER_STATUS_OPTIONS, 
          orderStatus, 
          setOrderStatus, 
          'Trạng thái đơn hàng'
        )}

        {/* Date Range Picker */}
        <View style={styles.dateFilterContainer}>
          <View style={styles.datePickerContainer}>
            <DynamicText style={styles.optionTitle}>Từ ngày</DynamicText>
            <TouchableOpacity 
              style={styles.dateButton} 
              onPress={() => openDatePicker('start')}
            >
              <DynamicText style={styles.dateButtonText}>
                {startDate ? new Date(startDate).toLocaleDateString() : 'Chọn ngày'}
              </DynamicText>
            </TouchableOpacity>
            {startDate && (
              <TouchableOpacity 
                style={styles.clearDateButton} 
                onPress={() => clearDate('start')}
              >
                <DynamicText style={styles.clearDateButtonText}>Xóa</DynamicText>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.datePickerContainer}>
            <DynamicText style={styles.optionTitle}>Đến ngày</DynamicText>
            <TouchableOpacity 
              style={styles.dateButton} 
              onPress={() => openDatePicker('end')}
            >
              <DynamicText style={styles.dateButtonText}>
                {endDate ? new Date(endDate).toLocaleDateString() : 'Chọn ngày'}
              </DynamicText>
            </TouchableOpacity>
            {endDate && (
              <TouchableOpacity 
                style={styles.clearDateButton} 
                onPress={() => clearDate('end')}
              >
                <DynamicText style={styles.clearDateButtonText}>Xóa</DynamicText>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Modal Calendar */}
        <Modal
          visible={isDatePickerVisible}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Calendar
                onDayPress={handleDateSelect}
                markedDates={{
                  [startDate || '']: {selected: true, selectedColor: color.primaryColor},
                  [endDate || '']: {selected: true, selectedColor: color.primaryColor}
                }}
              />
              <View style={styles.modalButtonContainer}>
                <TouchableOpacity 
                  style={styles.modalCancelButton}
                  onPress={() => setDatePickerVisible(false)}
                >
                  <DynamicText style={styles.modalCancelButtonText}>Hủy</DynamicText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Apply Filter Button */}
        <TouchableOpacity 
          style={styles.applyFilterButton}
          onPress={applyFilter}
        >
          <DynamicText style={styles.applyFilterButtonText}>
            Lọc
          </DynamicText>
        </TouchableOpacity>
      </ScrollView>
    </BaseLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.backgroundColor,
    paddingBottom:moderateScale(30),
  },
  scrollContainer: {
    padding: moderateScale(16),
  },
  optionContainer: {
    marginBottom: moderateScale(16),
  },
  optionTitle: {
    fontSize: moderateScale(15),
    fontWeight: '600',
    marginBottom: moderateScale(8),
  },
  optionButtonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  optionButton: {
    borderWidth: 1,
    borderColor: color.accentColor.grayColor,
    borderRadius: moderateScale(8),
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    marginRight: moderateScale(8),
    marginBottom: moderateScale(8),
  },
  selectedOptionButton: {
    backgroundColor: color.primaryColor,
    borderColor: color.primaryColor,
  },
  optionButtonText: {
    fontSize: moderateScale(13),
    color: color.accentColor.darkColor,
  },
  selectedOptionButtonText: {
    color: 'white',
  },
  dateFilterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  datePickerContainer: {
    flex: 1,
    marginHorizontal: moderateScale(4),
  },
  dateButton: {
    borderWidth: 1,
    borderColor: color.accentColor.grayColor,
    borderRadius: moderateScale(8),
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    marginBottom: moderateScale(8),
  },
  dateButtonText: {
    textAlign: 'center',
    fontSize: moderateScale(13),
    color: color.accentColor.darkColor,
  },
  clearDateButton: {
    alignSelf: 'flex-start',
  },
  clearDateButtonText: {
    fontSize: moderateScale(13),
    color: color.primaryColor,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    width: '90%',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: moderateScale(16),
  },
  modalCancelButton: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(8),
  },
  modalCancelButtonText: {
    color: color.primaryColor,
    fontSize: moderateScale(13),
  },
  applyFilterButton: {
    marginTop: moderateScale(16),
    backgroundColor: color.primaryColor,
    borderRadius: moderateScale(8),
    paddingVertical: moderateScale(12),
    alignItems: 'center',
  },
  applyFilterButtonText: {
    color: 'white',
    fontSize: moderateScale(13),
    fontWeight: '600',
  },
});

export default FilterOrderScreen;