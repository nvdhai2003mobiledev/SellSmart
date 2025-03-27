import React, {useCallback, useEffect, useMemo, useState, useRef} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Platform,
  AlertButton,
  KeyboardAvoidingView,
  Keyboard,
  ActivityIndicator,
  Modal,
  Dimensions,
  TouchableWithoutFeedback,
  Animated,
} from 'react-native';
import {
  BaseLayout,
  Button,
  DynamicText,
  Header,
  Input,
} from '../../../components';
import {Picker} from '@react-native-picker/picker';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import {Controller, useForm} from 'react-hook-form';
import {
  color,
  scaleHeight,
  scaleWidth,
  scaledSize,
  moderateScale,
} from '../../../utils';
import {
  Profile2User,
  Calendar,
  Briefcase,
  Camera,
  ArrowDown2,
  TickCircle,
  CloseCircle,
} from 'iconsax-react-native';
import {observer} from 'mobx-react-lite';
import {rootStore} from '../../../models/root-store';
import {NavigationProp, RouteProp} from '@react-navigation/native';
import {RootStackParamList, Screen} from '../../../navigation/navigation.type';
import {contents} from '../../../context';
import {RegexPatterns} from '../../../constants';
import {
  launchCamera,
  launchImageLibrary,
  Asset,
} from 'react-native-image-picker';
import {format} from 'date-fns';
import {Fonts, Images} from '../../../assets';
import DatePicker from 'react-native-date-picker';
import {vi} from 'date-fns/locale';

// Declare types for navigation and route
type EmployeeScreenRouteProp = RouteProp<
  RootStackParamList,
  Screen.UPDATE_EMPLOYEE
>;
type StackNavigationProp = NavigationProp<RootStackParamList>;

// Form values interface
interface EmployeeFormValues {
  employeeId: string;
  fullName: string;
  username: string;
  gender: string;
  phoneNumber: string;
  email: string;
  birthDate: string;
  address?: string; // Made optional
  department: string;
  position: string;
  salary: string;
  photoUrl?: string; // Added for photo
}

// Gender option type
interface GenderOption {
  label: string;
  value: string;
}

// Gender Selection Modal props
interface GenderSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  options: GenderOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  onConfirm: () => void;
}

const genderOptions = [
  {label: 'Nam', value: 'nam'},
  {label: 'Nữ', value: 'nữ'},
  {label: 'Khác', value: 'khác'},
];

const departmentOptions = [
  {label: 'Kỹ thuật', value: 'Kỹ thuật'},
  {label: 'Nhân sự', value: 'Nhân sự'},
  {label: 'Kế toán', value: 'Kế toán'},
  {label: 'Kinh doanh', value: 'Kinh doanh'},
  {label: 'Marketing', value: 'Marketing'},
];

// Custom Animated Gender Modal
const GenderSelectionModal: React.FC<GenderSelectionModalProps> = ({
  visible,
  onClose,
  options,
  selectedValue,
  onSelect,
  onConfirm,
}) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Fade in backdrop
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      // Slide up modal
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Fade out backdrop
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
      // Slide down modal
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, fadeAnim, slideAnim]);

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          styles.modalBackdrop,
          {
            opacity: fadeAnim,
          },
        ]}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [600, 0],
                  }),
                },
              ],
            },
          ]}>
          <View style={styles.modalHeader}>
            <DynamicText style={styles.modalTitle}>Chọn giới tính</DynamicText>
            <TouchableOpacity onPress={onClose}>
              <CloseCircle size={24} color={color.accentColor.grayColor} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            {options.map((option: GenderOption) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.modalOption,
                  selectedValue === option.value && styles.modalOptionSelected,
                ]}
                onPress={() => onSelect(option.value)}>
                <DynamicText
                  style={[
                    styles.modalOptionText,
                    selectedValue === option.value &&
                      styles.modalOptionTextSelected,
                  ]}>
                  {option.label}
                </DynamicText>
                {selectedValue === option.value && (
                  <TickCircle
                    size={24}
                    color={color.primaryColor}
                    variant="Bold"
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>

          <Button
            title="Xác nhận"
            onPress={onConfirm}
            buttonContainerStyle={styles.modalConfirmButton}
          />
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const UpdateEmployeeScreen = observer(() => {
  const navigation = useNavigation<StackNavigationProp>();
  const route = useRoute<EmployeeScreenRouteProp>();
  const {employees} = rootStore;
  const employeeId = route.params?.employeeId || '';
  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState<Asset | null>(null);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedDay, setSelectedDay] = useState('01');
  const [openDatePicker, setOpenDatePicker] = useState(false);
  const [date, setDate] = useState(new Date());
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [genderModalVisible, setGenderModalVisible] = useState(false);
  const [selectedGender, setSelectedGender] = useState('');

  const employeeData = useMemo(() => {
    return employees.employeeList.find(emp => emp.employeeId === employeeId);
  }, [employees.employeeList, employeeId]);

  // Initialize form with default values
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: {errors},
    getValues,
    watch,
  } = useForm<EmployeeFormValues>({
    defaultValues: {
      employeeId: '',
      fullName: '',
      username: '',
      gender: 'nam',
      phoneNumber: '',
      email: '',
      birthDate: '',
      address: '',
      department: 'Kỹ thuật',
      position: '',
      salary: '',
    },
  });

  // Track keyboard visibility
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      },
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      },
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  // Load employee data when available
  useEffect(() => {
    if (!employeeData && employeeId) {
      employees.fetchEmployees();
    }
  }, [employeeData, employeeId, employees]);

  // Reset form with employee data
  useEffect(() => {
    if (employeeData) {
      reset({
        employeeId: employeeData.employeeId,
        fullName: employeeData.user.fullName,
        username: employeeData.user.username,
        gender: employeeData.user.gender?.toLowerCase() || 'nam',
        phoneNumber: employeeData.user.phoneNumber || '',
        email: employeeData.user.email,
        birthDate: employeeData.hireDate || '',
        address: '', // User may not have address
        department: employeeData.department || 'Kỹ thuật',
        position: employeeData.position,
        salary: employeeData.salary?.toString() || '',
      });

      // Set photo if available
      if (employeeData.user.avatar) {
        setPhoto({
          uri: employeeData.user.avatar,
          fileName: 'avatar.jpg',
          type: 'image/jpeg',
        });
      }

      // Parse birth date if available
      if (employeeData.hireDate) {
        try {
          const dateParts = employeeData.hireDate.split('-');
          if (dateParts.length === 3) {
            setSelectedYear(dateParts[0]);
            setSelectedMonth(dateParts[1]);
          }
        } catch (error) {
          console.log('Error parsing date:', error);
        }
      }
    }
  }, [employeeData, reset]);

  // Handle date selection
  const showDatePickerDialog = useCallback(() => {
    setOpenDatePicker(true);
  }, []);

  // Handle date selection in DatePicker
  const handleConfirmDate = (selectedDate: Date) => {
    setDate(selectedDate);
    setValue('birthDate', format(selectedDate, 'yyyy-MM-dd'));
    setOpenDatePicker(false);
  };

  // Handle photo selection
  const handlePickImage = () => {
    Alert.alert(
      'Chọn ảnh đại diện',
      'Bạn muốn chụp ảnh mới hay chọn từ thư viện?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        } as AlertButton,
        {
          text: 'Chụp ảnh',
          onPress: () => {
            launchCamera(
              {
                mediaType: 'photo',
                quality: 0.8,
              },
              response => {
                if (response.didCancel) {
                  console.log('User cancelled camera');
                } else if (response.errorCode) {
                  console.log('Camera Error:', response.errorMessage);
                } else if (response.assets && response.assets[0]) {
                  setPhoto(response.assets[0]);
                }
              },
            );
          },
        } as AlertButton,
        {
          text: 'Thư viện',
          onPress: () => {
            launchImageLibrary(
              {
                mediaType: 'photo',
                quality: 0.8,
              },
              response => {
                if (response.didCancel) {
                  console.log('User cancelled image picker');
                } else if (response.errorCode) {
                  console.log('ImagePicker Error:', response.errorMessage);
                } else if (response.assets && response.assets[0]) {
                  setPhoto(response.assets[0]);
                }
              },
            );
          },
        } as AlertButton,
      ],
    );
  };

  // Add useFocusEffect to fetch latest data when screen is focused
  useFocusEffect(
    useCallback(() => {
      // Force reload employee data when screen is focused
      if (employeeId) {
        employees.fetchEmployeeById(employeeId);
      }
    }, [employeeId, employees]),
  );

  // Handle form submission
  const onSubmit = (values: EmployeeFormValues) => {
    if (!employeeId) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin nhân viên');
      return;
    }

    setLoading(true);

    // Format the employee data for API according to backend expectations
    const formattedEmployee = {
      employeeId: values.employeeId,
      userInfo: {
        username: values.username,
        fullName: values.fullName,
        gender: values.gender,
        phoneNumber: values.phoneNumber,
        email: values.email,
        // Include photo if available
        ...(photo && photo.uri && {avatar: photo.uri}),
      },
      department: values.department,
      position: values.position,
      salary: parseFloat(values.salary),
      hireDate: values.birthDate,
      ...(values.address && {address: values.address}),
    };

    console.log(
      'Updating employee with data:',
      JSON.stringify(formattedEmployee, null, 2),
    );

    // Update the employee in the store
    employees
      .updateEmployee(employeeId, formattedEmployee)
      .then(() => {
        // Force refresh all employee data
        employees.fetchEmployees();

        // Also refresh this specific employee
        employees.fetchEmployeeById(employeeId);

        Alert.alert('Thành công', 'Cập nhật thông tin nhân viên thành công', [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to refresh the list
              navigation.goBack();
            },
          },
        ]);
      })
      .catch(error => {
        console.error('Failed to update employee:', error);
        Alert.alert(
          'Lỗi',
          'Không thể cập nhật thông tin nhân viên: ' + error.message,
        );
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Open gender modal with current value
  const openGenderModal = (currentValue: string) => {
    setSelectedGender(currentValue.toLowerCase());
    setGenderModalVisible(true);
  };

  // Select gender and close modal
  const selectGender = (gender: string) => {
    setSelectedGender(gender);
  };

  // Confirm gender selection and close modal
  const confirmGenderSelection = (onChange: (value: string) => void) => {
    onChange(selectedGender);
    setGenderModalVisible(false);
  };

  if (!employeeData && !employees.isLoading) {
    return (
      <BaseLayout>
        <Header title="Cập nhật thông tin nhân viên" showBackIcon />
        <View style={styles.emptyContainer}>
          <DynamicText style={styles.emptyText}>
            Không tìm thấy thông tin nhân viên
          </DynamicText>
          <Button
            title="Quay lại"
            onPress={() => navigation.goBack()}
            buttonContainerStyle={styles.backButton}
          />
        </View>
      </BaseLayout>
    );
  }

  if (employees.isLoading && !employeeData) {
    return (
      <BaseLayout>
        <Header title="Cập nhật thông tin nhân viên" showBackIcon />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={color.primaryColor} />
          <DynamicText style={styles.loadingText}>
            Đang tải thông tin nhân viên...
          </DynamicText>
        </View>
      </BaseLayout>
    );
  }

  return (
    <BaseLayout style={styles.container}>
      <Header
        title="Cập nhật thông tin nhân viên"
        showBackIcon
        onPressBack={() => navigation.goBack()}
      />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={handlePickImage}>
            <Image
              source={photo?.uri ? {uri: photo.uri} : Images.AVATAR_BYEWIND}
              style={styles.avatar}
            />
            <View style={styles.cameraIconContainer}>
              <Camera size={20} color="white" variant="Bold" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Form card */}
        <View style={styles.formCard}>
          {/* Thông tin cơ bản */}
          <View style={styles.sectionHeader}>
            <Profile2User color={color.primaryColor} size={20} />
            <DynamicText style={styles.sectionTitle}>
              Thông tin cơ bản
            </DynamicText>
          </View>

          {/* Mã nhân viên */}
          <Controller
            control={control}
            name="employeeId"
            rules={{
              required: 'Mã nhân viên không được để trống',
            }}
            render={({field: {onChange, value, onBlur}}) => (
              <Input
                placeholderText="Mã nhân viên"
                onChangeText={onChange}
                value={value}
                editable={false}
                inputContainerStyle={styles.inputContainer}
                error={errors.employeeId?.message}
              />
            )}
          />

          {/* Tên đăng nhập */}
          <Controller
            control={control}
            name="username"
            rules={{
              required: 'Tên đăng nhập không được để trống',
              minLength: {
                value: 4,
                message: 'Tên đăng nhập phải có ít nhất 4 ký tự',
              },
            }}
            render={({field: {onChange, value, onBlur}}) => (
              <Input
                placeholderText="Tên đăng nhập"
                onChangeText={onChange}
                value={value}
                error={errors.username?.message}
                inputContainerStyle={styles.inputContainer}
              />
            )}
          />

          {/* Họ và tên */}
          <Controller
            control={control}
            name="fullName"
            rules={{
              required: 'Họ và tên không được để trống',
            }}
            render={({field: {onChange, value, onBlur}}) => (
              <Input
                placeholderText="Họ và tên"
                onChangeText={onChange}
                value={value}
                error={errors.fullName?.message}
                inputContainerStyle={styles.inputContainer}
              />
            )}
          />

          {/* Giới tính */}
          <Controller
            control={control}
            name="gender"
            render={({field: {onChange, value}}) => (
              <TouchableOpacity
                style={styles.selectInput}
                onPress={() => openGenderModal(value)}>
                <View style={styles.selectInputContainer}>
                  <DynamicText style={styles.pickerLabel}>
                    Giới tính
                  </DynamicText>
                  <View style={styles.selectValueContainer}>
                    <DynamicText style={styles.selectValue}>
                      {genderOptions.find(
                        option => option.value === value.toLowerCase(),
                      )?.label || 'Chọn giới tính'}
                    </DynamicText>
                    <ArrowDown2 size={20} color={color.accentColor.darkColor} />
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />

          {/* Thông tin liên hệ */}
          <View style={[styles.sectionHeader, {marginTop: moderateScale(20)}]}>
            <Camera color={color.primaryColor} size={20} />
            <DynamicText style={styles.sectionTitle}>
              Thông tin liên hệ
            </DynamicText>
          </View>

          {/* Số điện thoại */}
          <Controller
            control={control}
            name="phoneNumber"
            rules={{
              pattern: {
                value: /^[0-9]{10}$/,
                message: 'Số điện thoại phải có 10 chữ số',
              },
            }}
            render={({field: {onChange, value, onBlur}}) => (
              <Input
                placeholderText="Số điện thoại"
                onChangeText={onChange}
                value={value}
                error={errors.phoneNumber?.message}
                inputContainerStyle={styles.inputContainer}
                keyboardType="phone-pad"
              />
            )}
          />

          {/* Email */}
          <Controller
            control={control}
            name="email"
            rules={{
              required: 'Email không được để trống',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Email không hợp lệ',
              },
            }}
            render={({field: {onChange, value, onBlur}}) => (
              <Input
                placeholderText="Email"
                onChangeText={onChange}
                value={value}
                error={errors.email?.message}
                inputContainerStyle={styles.inputContainer}
                keyboardType="email-address"
              />
            )}
          />

          {/* Ngày sinh */}
          <Controller
            control={control}
            name="birthDate"
            render={({field: {value}}) => (
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={showDatePickerDialog}>
                <View style={styles.buttonDatePickerContainer}>
                  <DynamicText style={styles.datePickerLabel}>
                    Ngày sinh
                  </DynamicText>
                  <View style={styles.datePickerValue}>
                    <DynamicText>
                      {value
                        ? format(new Date(value), 'dd/MM/yyyy', {locale: vi})
                        : 'Chọn ngày'}
                    </DynamicText>
                    <Calendar size={20} color={color.accentColor.darkColor} />
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />

          {/* Địa chỉ */}
          <Controller
            control={control}
            name="address"
            render={({field: {onChange, value, onBlur}}) => (
              <View>
                <Input
                  placeholderText="Địa chỉ (tùy chọn)"
                  onChangeText={onChange}
                  value={value || ''}
                  multiline={true}
                  numberOfLines={3}
                  textAlignVertical="top"
                  inputContainerStyle={styles.addressInputContainer}
                  error={errors.address?.message}
                />
              </View>
            )}
          />

          {/* Thông tin công việc */}
          <View style={[styles.sectionHeader, {marginTop: moderateScale(20)}]}>
            <Briefcase color={color.primaryColor} size={20} />
            <DynamicText style={styles.sectionTitle}>
              Thông tin công việc
            </DynamicText>
          </View>

          {/* Phòng ban */}
          <Controller
            control={control}
            name="department"
            rules={{
              required: 'Phòng ban không được để trống',
            }}
            render={({field: {onChange, value, onBlur}}) => (
              <Input
                placeholderText="Phòng ban"
                onChangeText={onChange}
                value={value}
                error={errors.department?.message}
                inputContainerStyle={styles.inputContainer}
              />
            )}
          />

          {/* Chức vụ */}
          <Controller
            control={control}
            name="position"
            rules={{
              required: 'Chức vụ không được để trống',
            }}
            render={({field: {onChange, value, onBlur}}) => (
              <Input
                placeholderText="Chức vụ"
                onChangeText={onChange}
                value={value}
                error={errors.position?.message}
                inputContainerStyle={styles.inputContainer}
              />
            )}
          />

          {/* Lương */}
          <Controller
            control={control}
            name="salary"
            rules={{
              required: 'Lương không được để trống',
              validate: value => !isNaN(Number(value)) || 'Lương phải là số',
            }}
            render={({field: {onChange, value, onBlur}}) => (
              <Input
                placeholderText="Lương"
                onChangeText={onChange}
                value={value}
                error={errors.salary?.message}
                inputContainerStyle={styles.inputContainer}
                keyboardType="numeric"
              />
            )}
          />

          {/* Submit button */}
          <Button
            title="Cập nhật thông tin"
            onPress={handleSubmit(onSubmit)}
            buttonContainerStyle={styles.submitButton}
            loading={loading}
            disabled={loading}
          />
        </View>
      </ScrollView>

      {/* Date Picker */}
      <DatePicker
        modal
        open={openDatePicker}
        date={date}
        onConfirm={handleConfirmDate}
        onCancel={() => setOpenDatePicker(false)}
        mode="date"
        locale="vi"
        maximumDate={new Date()}
        title="Chọn ngày sinh"
        confirmText="Xác nhận"
        cancelText="Hủy"
      />

      {/* Gender Selection Modal */}
      <GenderSelectionModal
        visible={genderModalVisible}
        onClose={() => setGenderModalVisible(false)}
        options={genderOptions}
        selectedValue={selectedGender}
        onSelect={selectGender}
        onConfirm={() =>
          confirmGenderSelection(value => setValue('gender', value))
        }
      />
    </BaseLayout>
  );
});

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  formCard: {
    padding: moderateScale(16),
    backgroundColor: color.accentColor.whiteColor,
    borderRadius: moderateScale(8),
    elevation: 2,
    shadowColor: color.accentColor.blackColor,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginBottom: moderateScale(30), // Add extra margin at the bottom
  },
  profileCard: {
    alignItems: 'center',
    marginBottom: moderateScale(16),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(16),
  },
  sectionTitle: {
    marginLeft: moderateScale(8),
    fontSize: scaledSize(18),
    fontWeight: 'bold',
    color: color.accentColor.darkColor,
  },
  pickerContainer: {
    marginBottom: moderateScale(16),
  },
  pickerLabel: {
    marginBottom: moderateScale(8),
    fontSize: scaledSize(14),
    color: color.accentColor.grayColor,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: color.accentColor.grayColor,
    borderRadius: moderateScale(8),
    backgroundColor: color.accentColor.whiteColor,
  },
  picker: {
    height: scaleHeight(50),
  },
  pickerIcon: {
    marginLeft: moderateScale(8),
  },
  inputContainer: {
    marginBottom: moderateScale(16),
    height: scaleHeight(50),
  },
  addressInputContainer: {
    marginBottom: moderateScale(16),
    minHeight: scaleHeight(100),
  },
  updateButton: {
    marginTop: moderateScale(16),
    marginBottom: moderateScale(10),
  },
  buttonContainer: {
    paddingVertical: moderateScale(10),
  },
  datePickerButton: {
    marginBottom: moderateScale(16),
  },
  buttonDatePickerContainer: {
    borderWidth: 1,
    borderColor: color.accentColor.grayColor + '30',
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
  },
  datePickerLabel: {
    fontSize: scaledSize(14),
    marginBottom: scaleHeight(4),
    color: color.accentColor.darkColor,
  },
  datePickerValue: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    width: scaleWidth(100),
    height: scaleWidth(100),
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: scaleWidth(100),
    height: scaleWidth(100),
    borderRadius: scaleWidth(24),
  },
  avatarPlaceholder: {
    width: scaleWidth(100),
    height: scaleWidth(100),
    borderRadius: scaleWidth(50),
    backgroundColor: color.primaryColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: -10,
    right: -10,
    backgroundColor: color.primaryColor,
    borderRadius: scaleWidth(15),
    width: scaleWidth(30),
    height: scaleWidth(30),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: color.accentColor.whiteColor,
  },
  employeeName: {
    fontSize: scaledSize(16),
    fontWeight: 'bold',
    color: color.accentColor.darkColor,
    marginBottom: moderateScale(4),
    marginTop: moderateScale(16),
  },
  employeePosition: {
    fontSize: scaledSize(14),
    color: color.accentColor.grayColor,
  },
  employeeEmail: {
    fontSize: scaledSize(14),
    color: color.accentColor.grayColor,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: moderateScale(16),
  },
  emptyText: {
    fontSize: scaledSize(16),
    color: color.accentColor.grayColor,
    marginBottom: moderateScale(16),
  },
  backButton: {
    width: scaleWidth(120),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: moderateScale(16),
    fontSize: 16,
    color: color.accentColor.darkColor,
  },
  submitButton: {
    marginTop: moderateScale(16),
    marginBottom: moderateScale(48),
  },
  errorText: {
    color: color.accentColor.errorColor,
    fontSize: scaledSize(12),
    marginTop: scaleHeight(4),
  },
  selectInput: {
    marginBottom: moderateScale(16),
  },
  selectInputContainer: {
    borderWidth: 1,
    borderColor: color.accentColor.grayColor + '30',
    borderRadius: moderateScale(14),
    padding: moderateScale(12),
    backgroundColor: color.inputColor,
  },
  selectValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: moderateScale(4),
  },
  selectValue: {
    fontSize: scaledSize(14),
    color: color.accentColor.darkColor,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  modalContainer: {
    backgroundColor: color.accentColor.whiteColor,
    borderRadius: moderateScale(16),
    padding: moderateScale(20),
    width: '90%',
    maxWidth: 400,
    shadowColor: color.accentColor.blackColor,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
    zIndex: 1001,
    alignSelf: 'center',
    marginHorizontal: moderateScale(20),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(16),
    paddingBottom: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: color.accentColor.grayColor + '20',
  },
  modalTitle: {
    fontSize: scaledSize(20),
    fontWeight: 'bold',
    color: color.primaryColor,
  },
  modalContent: {
    marginBottom: moderateScale(16),
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: moderateScale(16),
    paddingHorizontal: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: color.accentColor.grayColor + '20',
    borderRadius: moderateScale(8),
    marginBottom: moderateScale(8),
  },
  modalOptionSelected: {
    backgroundColor: color.primaryColor + '15',
    borderColor: color.primaryColor,
    borderLeftWidth: 4,
  },
  modalOptionText: {
    fontSize: scaledSize(16),
    color: color.accentColor.darkColor,
  },
  modalOptionTextSelected: {
    fontWeight: 'bold',
    color: color.primaryColor,
  },
  modalConfirmButton: {
    marginTop: moderateScale(16),
    marginBottom: moderateScale(10),
  },
});

export default UpdateEmployeeScreen;
