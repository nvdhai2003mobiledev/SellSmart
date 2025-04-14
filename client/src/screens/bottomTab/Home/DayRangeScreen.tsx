import React, {useState} from 'react';
import {StyleSheet, View, TouchableOpacity, ScrollView, Modal} from 'react-native';
import {BaseLayout, DynamicText, Header} from '../../../components';
import {color, moderateScale} from '../../../utils';
import {Calendar, ArrowRight2} from 'iconsax-react-native';
import {Fonts} from '../../../assets';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Screen, RootStackParamList} from '../../../navigation/navigation.type';

interface DateRange {
  startDate: Date;
  endDate: Date;
  label: string;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const DayRangeScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [selectedRange, setSelectedRange] = useState<DateRange | null>(null);
  const [customStartDate, setCustomStartDate] = useState(new Date());
  const [customEndDate, setCustomEndDate] = useState(new Date());
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [selectingStartDate, setSelectingStartDate] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const last7Days = new Date(today);
  last7Days.setDate(today.getDate() - 7);

  const last30Days = new Date(today);
  last30Days.setDate(today.getDate() - 30);
  
  const last90Days = new Date(today);
  last90Days.setDate(today.getDate() - 90);

  // Get start of current week (Monday)
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));

  // Get start of last week
  const startOfLastWeek = new Date(startOfWeek);
  startOfLastWeek.setDate(startOfWeek.getDate() - 7);
  const endOfLastWeek = new Date(startOfLastWeek);
  endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);

  // Get start of current month
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  // Get start of last month
  const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

  // Get quarters
  const currentYear = today.getFullYear();
  const lastYear = currentYear - 1;
  
  const quarters = [
    {
      label: `Quý 1/${currentYear}`,
      startDate: new Date(currentYear, 0, 1),
      endDate: new Date(currentYear, 2, 31),
    },
    {
      label: `Quý 2/${currentYear}`,
      startDate: new Date(currentYear, 3, 1),
      endDate: new Date(currentYear, 5, 30),
    },
    {
      label: `Quý 3/${currentYear}`,
      startDate: new Date(currentYear, 6, 1),
      endDate: new Date(currentYear, 8, 30),
    },
    {
      label: `Quý 4/${currentYear}`,
      startDate: new Date(currentYear, 9, 1),
      endDate: new Date(currentYear, 11, 31),
    },
    {
      label: `Quý 1/${lastYear}`,
      startDate: new Date(lastYear, 0, 1),
      endDate: new Date(lastYear, 2, 31),
    },
    {
      label: `Quý 2/${lastYear}`,
      startDate: new Date(lastYear, 3, 1),
      endDate: new Date(lastYear, 5, 30),
    },
    {
      label: `Quý 3/${lastYear}`,
      startDate: new Date(lastYear, 6, 1),
      endDate: new Date(lastYear, 8, 30),
    },
    {
      label: `Quý 4/${lastYear}`,
      startDate: new Date(lastYear, 9, 1),
      endDate: new Date(lastYear, 11, 31),
    },
  ];

  const dateRanges: DateRange[] = [
    {
      label: 'Hôm nay',
      startDate: today,
      endDate: today,
    },
    {
      label: 'Hôm qua',
      startDate: yesterday,
      endDate: yesterday,
    },
    {
      label: '7 ngày qua',
      startDate: last7Days,
      endDate: today,
    },
    {
      label: '30 ngày qua',
      startDate: last30Days,
      endDate: today,
    },
    {
      label: '90 ngày qua',
      startDate: last90Days,
      endDate: today,
    },
    {
      label: 'Tuần này',
      startDate: startOfWeek,
      endDate: today,
    },
    {
      label: 'Tuần trước',
      startDate: startOfLastWeek,
      endDate: endOfLastWeek,
    },
    {
      label: 'Tháng này',
      startDate: startOfMonth,
      endDate: today,
    },
    {
      label: 'Tháng trước',
      startDate: startOfLastMonth,
      endDate: endOfLastMonth,
    },
    ...quarters,
  ];

  const openStartDateCalendar = () => {
    setSelectingStartDate(true);
    setSelectedDate(customStartDate);
    setCalendarVisible(true);
  };

  const openEndDateCalendar = () => {
    setSelectingStartDate(false);
    setSelectedDate(customEndDate);
    setCalendarVisible(true);
  };

  const handleRangeSelect = (range: DateRange) => {
    setSelectedRange(range);
    setCustomStartDate(range.startDate);
    setCustomEndDate(range.endDate);
  };

  const handleDateSelect = (date: Date) => {
    if (selectingStartDate) {
      setCustomStartDate(date);
      // If selected start date is after end date, update end date too
      if (date > customEndDate) {
        setCustomEndDate(date);
      }
    } else {
      setCustomEndDate(date);
      // If selected end date is before start date, update start date too
      if (date < customStartDate) {
        setCustomStartDate(date);
      }
    }
    setCalendarVisible(false);
    
    // Create a custom range
    setSelectedRange({
      label: 'Tùy chọn',
      startDate: selectingStartDate ? date : customStartDate,
      endDate: selectingStartDate ? customEndDate : date,
    });
  };

  const handleFilter = () => {
    if (selectedRange) {
      navigation.navigate(Screen.REVENUE, {
        startDate: customStartDate,
        endDate: customEndDate,
      });
    }
  };

  const formatMonthYear = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    return `${year} M${month < 10 ? '0' + month : month}`;
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getMonthDays = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    // Calculate adjusted first day (0 = Monday in our grid)
    const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    
    const days = [];
    
    // Add empty cells for days before the 1st of the month
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const handlePrevMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setSelectedDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setSelectedDate(newDate);
  };

  const renderDateRangeItem = (range: DateRange) => (
    <TouchableOpacity
      key={range.label}
      style={[
        styles.rangeItem,
        selectedRange?.label === range.label && styles.selectedRangeItem,
      ]}
      onPress={() => handleRangeSelect(range)}>
      <DynamicText
        style={[
          styles.rangeText,
          selectedRange?.label === range.label && styles.selectedRangeText,
        ]}>
        {range.label}
      </DynamicText>
    </TouchableOpacity>
  );

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelectedDate = (date: Date) => {
    if (!date) return false;
    
    const isSameDate = (d1: Date, d2: Date) => 
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear();
    
    return isSameDate(date, customStartDate) || isSameDate(date, customEndDate);
  };

  return (
    <BaseLayout contentContainerStyle={styles.container}>
      {/* Custom Date Range Selector */}
      <Header
        title="Phạm vi ngày"
        showBackIcon
        onPressBack={() => navigation.goBack()}
      />
      <View style={styles.customRangeContainer}>
        <View style={styles.header}>
          <Calendar size={20} color={color.accentColor.darkColor} variant="Bold" />
          <DynamicText style={styles.headerTitle}>Phạm vi ngày</DynamicText>
        </View>
        <View style={styles.dateInputsContainer}>
          <TouchableOpacity style={styles.dateInput} onPress={openStartDateCalendar}>
            <DynamicText style={styles.dateInputLabel}>Từ</DynamicText>
            <DynamicText style={styles.dateInputValue}>
              {customStartDate.toLocaleDateString('vi-VN')}
            </DynamicText>
            <View style={styles.calendarIcon}>
              <Calendar size={20} color={color.accentColor.grayColor} variant="Linear" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dateInput} onPress={openEndDateCalendar}>
            <DynamicText style={styles.dateInputLabel}>Đến</DynamicText>
            <DynamicText style={styles.dateInputValue}>
              {customEndDate.toLocaleDateString('vi-VN')}
            </DynamicText>
            <View style={styles.calendarIcon}>
              <Calendar size={20} color={color.accentColor.grayColor} variant="Linear" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Predefined Date Ranges */}
      <ScrollView style={{height:moderateScale(240)}} showsVerticalScrollIndicator={false}>
        <View style={styles.rangesContent}>
          {dateRanges.map(range => renderDateRangeItem(range))}
        </View>
      </ScrollView>

      {/* Filter Button */}
      <TouchableOpacity
        style={[styles.filterButton, !selectedRange && styles.filterButtonDisabled]}
        onPress={handleFilter}
        disabled={!selectedRange}>
        <DynamicText style={styles.filterButtonText}>Lọc</DynamicText>
      </TouchableOpacity>

      {/* Calendar Modal */}
      <Modal
        visible={calendarVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCalendarVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.calendarContainer}>
            <View style={styles.calendarHeader}>
              <DynamicText style={styles.calendarTitle}>
                {selectingStartDate ? 'Từ' : 'Đến'} {selectedDate.toLocaleDateString('vi-VN')}
              </DynamicText>
            </View>
            
            <View style={styles.monthSelector}>
              <TouchableOpacity onPress={handlePrevMonth}>
                <ArrowRight2 
                  size={24} 
                  color={color.accentColor.darkColor} 
                  style={styles.prevMonthIcon}
                />
              </TouchableOpacity>
              <DynamicText style={styles.monthYear}>
                {formatMonthYear(selectedDate)}
              </DynamicText>
              <TouchableOpacity onPress={handleNextMonth}>
                <ArrowRight2 
                  size={24} 
                  color={color.accentColor.darkColor}
                />
              </TouchableOpacity>
            </View>
            
            <View style={styles.weekDaysHeader}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                <DynamicText key={index} style={styles.weekDayLabel}>
                  {day}
                </DynamicText>
              ))}
            </View>
            
            <View style={styles.calendarGrid}>
              {getMonthDays().map((date, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dateCell,
                    date && isToday(date) && styles.todayCell,
                    date && isSelectedDate(date) && styles.selectedDateCell,
                  ]}
                  onPress={() => date && handleDateSelect(date)}
                  disabled={!date}>
                  {date ? (
                    <DynamicText
                      style={[
                        styles.dateCellText,
                        isToday(date) && styles.todayText,
                        isSelectedDate(date) && styles.selectedDateText,
                      ]}>
                      {date.getDate()}
                    </DynamicText>
                  ) : (
                    <DynamicText style={styles.emptyCell}></DynamicText>
                  )}
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setCalendarVisible(false)}>
                <DynamicText style={styles.cancelButtonText}>CANCEL</DynamicText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.okButton}
                onPress={() => {
                  handleDateSelect(selectedDate);
                }}>
                <DynamicText style={styles.okButtonText}>OK</DynamicText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </BaseLayout>
  );
};

export default DayRangeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.backgroundColor,
  },
  customRangeContainer: {
    backgroundColor: color.accentColor.whiteColor,
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginBottom: moderateScale(16),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(16),
  },
  headerTitle: {
    fontSize: moderateScale(16),
    color: color.accentColor.darkColor,
    fontFamily: Fonts.Inter_SemiBold,
    marginLeft: moderateScale(8),
  },
  dateInputsContainer: {
    flexDirection: 'row',
    gap: moderateScale(12),
  },
  dateInput: {
    flex: 1,
    backgroundColor: color.backgroundColor,
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
    position: 'relative',
  },
  dateInputLabel: {
    fontSize: moderateScale(12),
    color: color.accentColor.grayColor,
    marginBottom: moderateScale(4),
  },
  dateInputValue: {
    fontSize: moderateScale(14),
    color: color.accentColor.darkColor,
    fontFamily: Fonts.Inter_SemiBold,
  },
  calendarIcon: {
    position: 'absolute',
    right: moderateScale(12),
    top: moderateScale(12),
  },
  rangesContainer: {
    flex: 1,
    backgroundColor: color.accentColor.whiteColor,
    borderRadius: moderateScale(12),
    padding: moderateScale(16),

  },
  rangesContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(10),
  },
  rangeItem: {
    backgroundColor: color.backgroundColor,
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    marginBottom: moderateScale(10),
    width: '48%',
  },
  selectedRangeItem: {
    backgroundColor: color.primaryColor,
  },
  rangeText: {
    fontSize: moderateScale(14),
    color: color.accentColor.darkColor,
  },
  selectedRangeText: {
    color: '#FFFFFF',
  },
  filterButton: {
    backgroundColor: color.primaryColor,
    borderRadius: moderateScale(8),
    padding: moderateScale(16),
    alignItems: 'center',
    margin: moderateScale(16),
  },
  filterButtonDisabled: {
    backgroundColor: color.accentColor.grayColor,
  },
  filterButtonText: {
    fontSize: moderateScale(16),
    color: '#FFFFFF',
    fontFamily: Fonts.Inter_SemiBold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    width: '80%',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(16),
  },
  calendarTitle: {
    fontSize: moderateScale(18),
    color: color.primaryColor,
    fontFamily: Fonts.Inter_SemiBold,
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(16),
  },
  prevMonthIcon: {
    transform: [{rotate: '180deg'}],
  },
  monthYear: {
    fontSize: moderateScale(16),
    color: color.accentColor.darkColor,
    fontFamily: Fonts.Inter_SemiBold,
    marginHorizontal: moderateScale(20),
  },
  weekDaysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: moderateScale(10),
  },
  weekDayLabel: {
    width: moderateScale(30),
    textAlign: 'center',
    fontSize: moderateScale(14),
    color: color.accentColor.grayColor,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dateCell: {
    width: moderateScale(30),
    height: moderateScale(30),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(10),
    borderRadius: moderateScale(15),
  },
  dateCellText: {
    fontSize: moderateScale(14),
    color: color.accentColor.darkColor,
  },
  emptyCell: {
    width: moderateScale(30),
  },
  todayCell: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  todayText: {
    color: color.primaryColor,
    fontFamily: Fonts.Inter_SemiBold,
  },
  selectedDateCell: {
    backgroundColor: color.primaryColor,
  },
  selectedDateText: {
    color: '#FFFFFF',
    fontFamily: Fonts.Inter_SemiBold,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: moderateScale(16),
  },
  cancelButton: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(8),
  },
  cancelButtonText: {
    fontSize: moderateScale(14),
    color: color.accentColor.grayColor,
    fontFamily: Fonts.Inter_SemiBold,
  },
  okButton: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(8),
  },
  okButtonText: {
    fontSize: moderateScale(14),
    color: color.primaryColor,
    fontFamily: Fonts.Inter_SemiBold,
  },
}); 