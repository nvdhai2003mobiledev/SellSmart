import React, {useState, useCallback} from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  BaseLayout,
  DynamicText,
  Header,
  Input,
  Button,
} from '../../../components';
import {
  color,
  moderateScale,
  scaledSize,
  scaleHeight,
  scaleWidth,
} from '../../../utils';
import {contents} from '../../../context';
import {Fonts, Images} from '../../../assets';
import {NavigationProp, useNavigation} from '@react-navigation/native';
import {RootStackParamList, Screen} from '../../../navigation/navigation.type';
import {Controller, useForm} from 'react-hook-form';
import {rootStore} from '../../../models/root-store';
import {format} from 'date-fns';
import {
  User,
  People,
  Call,
  MessageText1,
  Calendar,
  Location,
  Building,
  Profile2User,
  MoneyRecive,
  AddCircle,
  Briefcase,
  Information,
  Profile,
} from 'iconsax-react-native';

// Define form values interface
interface EmployeeFormValues {
  employeeId: string;
  username: string;
  fullName: string;
  gender: 'male' | 'female' | 'other';
  phoneNumber: string;
  email: string;
  birthDate: Date;
  address: string;
  department: string;
  position: string;
  salary: string;
}

// Simple validation rules
const validateRequired = (value: string) => {
  if (!value || value.trim() === '') {
    return 'Trường này là bắt buộc';
  }
  return true;
};

const validateEmail = (value: string) => {
  if (!value || value.trim() === '') {
    return 'Email là bắt buộc';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return 'Email không hợp lệ';
  }
  return true;
};

const validateUsername = (value: string) => {
  if (!value || value.trim() === '') {
    return 'Tên đăng nhập là bắt buộc';
  }
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  if (!usernameRegex.test(value)) {
    return 'Tên đăng nhập phải từ 3-20 ký tự, chỉ chứa chữ cái, số và dấu gạch dưới';
  }
  return true;
};

const validateEmployeeId = (value: string) => {
  if (!value || value.trim() === '') {
    return 'Mã nhân viên là bắt buộc';
  }
  // Mã nhân viên phải bắt đầu bằng 'EMP' và theo sau là các chữ số, ví dụ: EMP001
  const empIdRegex = /^EMP\d{3,6}$/;
  if (!empIdRegex.test(value)) {
    return 'Mã nhân viên phải có định dạng EMP + số (ví dụ: EMP001)';
  }
  return true;
};

const validatePhone = (value: string) => {
  if (!value || value.trim() === '') {
    return true; // Điện thoại không bắt buộc
  }
  const phoneRegex = /^[0-9]{10,11}$/;
  if (!phoneRegex.test(value)) {
    return 'Số điện thoại phải có 10-11 chữ số';
  }
  return true;
};

const validateSalary = (value: string) => {
  if (!value) return 'Vui lòng nhập lương';
  return !isNaN(Number(value)) ? true : 'Lương phải là số';
};

const AddEmployeeScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const {employees} = rootStore;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultValues: EmployeeFormValues = {
    employeeId: '',
    username: '',
    fullName: '',
    gender: 'male',
    phoneNumber: '',
    email: '',
    birthDate: new Date(2000, 0, 1),
    address: '',
    department: '',
    position: '',
    salary: '',
  };

  const {
    control,
    handleSubmit,
    setValue,
    formState: {errors},
  } = useForm<EmployeeFormValues>({
    defaultValues,
  });

  const handleDateChange = (name: string) => {
    // Show date picker dialog here using native date picker or another method
    Alert.alert('Chọn ngày', 'Chức năng chọn ngày đang được phát triển.', [
      {
        text: 'Đóng',
        style: 'cancel',
      },
    ]);

    // For demo purposes, just use today's date
    setValue(name as any, new Date());
  };

  const onSubmit = useCallback(
    async (data: EmployeeFormValues) => {
      try {
        setIsSubmitting(true);
        console.log('=== FORM DATA ===', data);

        // Kiểm tra dữ liệu trước khi gửi
        if (
          !data.username ||
          !data.email ||
          !data.employeeId ||
          !data.fullName
        ) {
          Alert.alert(
            'Thông tin không đầy đủ',
            'Vui lòng điền đầy đủ các trường bắt buộc: Mã nhân viên, Tên đăng nhập, Họ tên, Email',
          );
          return;
        }

        // Generate a default password for the user
        const defaultPassword = 'Employee@123'; // Mật khẩu mặc định có thể đổi sau

        // Map form data to API format đúng với backend controller
        const newEmployeeData = {
          username: data.username.trim(),
          fullName: data.fullName.trim(),
          gender: data.gender,
          dob: data.birthDate.toISOString(),
          address: data.address?.trim() || '',
          email: data.email.trim(),
          phoneNumber: data.phoneNumber?.trim() || '',
          password: defaultPassword,
          role: 'employee',
          employeeId: data.employeeId.trim(),
          department: data.department?.trim() || '',
          position: data.position?.trim() || '',
          salary: data.salary ? Number(data.salary.replace(/[^0-9]/g, '')) : 0,
          hireDate: new Date().toISOString(),
          workStatus: 'active',
          // Không gửi các trường không cần thiết
        };

        console.log('=== API DATA FORMAT ===', newEmployeeData);

        const success = await employees.createEmployee(newEmployeeData);

        if (success) {
          Alert.alert('Thành công', 'Đã thêm nhân viên mới thành công', [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]);
        } else {
          Alert.alert(
            'Lỗi',
            employees.error || 'Không thể thêm nhân viên mới. Vui lòng thử lại',
          );
        }
      } catch (error: any) {
        console.error('Error creating employee:', error);
        Alert.alert(
          'Lỗi',
          error?.message ||
            'Đã xảy ra lỗi không mong muốn khi thêm nhân viên mới',
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [employees, navigation],
  );

  return (
    <BaseLayout style={styles.container}>
      <Header
        title={contents.employee.add_employee}
        showBackIcon={true}
        onPressBack={() => navigation.goBack()}
      />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Card Section */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Image source={Images.AVATAR_BYEWIND} style={styles.avatar} />
            <View style={styles.addAvatarButton}>
              <AddCircle size={24} color={color.primaryColor} variant="Bold" />
            </View>
          </View>
          <DynamicText style={styles.profileText}>
            Thêm nhân viên mới
          </DynamicText>
        </View>

        {/* Error message from API */}
        {employees.error && (
          <View style={styles.errorMessageContainer}>
            <DynamicText style={styles.apiErrorText}>
              {employees.error}
            </DynamicText>
          </View>
        )}

        {/* Basic Information Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Information size={22} color={color.primaryColor} variant="Bold" />
            <DynamicText style={styles.sectionTitle}>
              Thông tin cơ bản
            </DynamicText>
          </View>

          <Controller
            control={control}
            name="employeeId"
            rules={{validate: validateEmployeeId}}
            render={({field: {onChange, onBlur, value}}) => (
              <Input
                placeholderText="Nhập mã nhân viên"
                value={value}
                onChangeText={onChange}
                error={errors.employeeId?.message}
                EndIcon={
                  <User size={20} color={color.primaryColor} variant="Linear" />
                }
                inputContainerStyle={styles.inputContainer}
              />
            )}
          />

          <Controller
            control={control}
            name="username"
            rules={{validate: validateUsername}}
            render={({field: {onChange, onBlur, value}}) => (
              <Input
                placeholderText="Nhập tên đăng nhập"
                value={value}
                onChangeText={onChange}
                error={errors.username?.message}
                EndIcon={
                  <Profile
                    size={20}
                    color={color.primaryColor}
                    variant="Linear"
                  />
                }
                inputContainerStyle={styles.inputContainer}
              />
            )}
          />

          <Controller
            control={control}
            name="fullName"
            rules={{validate: validateRequired}}
            render={({field: {onChange, onBlur, value}}) => (
              <Input
                placeholderText="Nhập họ và tên"
                value={value}
                onChangeText={onChange}
                error={errors.fullName?.message}
                EndIcon={
                  <People
                    size={20}
                    color={color.primaryColor}
                    variant="Linear"
                  />
                }
                inputContainerStyle={styles.inputContainer}
              />
            )}
          />

          <Controller
            control={control}
            name="gender"
            render={({field: {onChange, value}}) => (
              <View style={styles.radioContainer}>
                <DynamicText style={styles.radioLabel}>Giới tính</DynamicText>
                <View style={styles.radioGroup}>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => onChange('male')}>
                    <View
                      style={[
                        styles.radioCircle,
                        value === 'male' && styles.radioCircleSelected,
                      ]}>
                      {value === 'male' && <View style={styles.radioDot} />}
                    </View>
                    <DynamicText
                      style={[
                        styles.radioText,
                        value === 'male' && styles.radioTextSelected,
                      ]}>
                      Nam
                    </DynamicText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => onChange('female')}>
                    <View
                      style={[
                        styles.radioCircle,
                        value === 'female' && styles.radioCircleSelected,
                      ]}>
                      {value === 'female' && <View style={styles.radioDot} />}
                    </View>
                    <DynamicText
                      style={[
                        styles.radioText,
                        value === 'female' && styles.radioTextSelected,
                      ]}>
                      Nữ
                    </DynamicText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => onChange('other')}>
                    <View
                      style={[
                        styles.radioCircle,
                        value === 'other' && styles.radioCircleSelected,
                      ]}>
                      {value === 'other' && <View style={styles.radioDot} />}
                    </View>
                    <DynamicText
                      style={[
                        styles.radioText,
                        value === 'other' && styles.radioTextSelected,
                      ]}>
                      Khác
                    </DynamicText>
                  </TouchableOpacity>
                </View>
                {errors.gender && (
                  <DynamicText style={styles.errorText}>
                    {errors.gender.message}
                  </DynamicText>
                )}
              </View>
            )}
          />
        </View>

        {/* Contact Information Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <MessageText1 size={22} color={color.primaryColor} variant="Bold" />
            <DynamicText style={styles.sectionTitle}>
              Thông tin liên hệ
            </DynamicText>
          </View>

          <Controller
            control={control}
            name="phoneNumber"
            rules={{validate: validatePhone}}
            render={({field: {onChange, onBlur, value}}) => (
              <Input
                placeholderText="Nhập số điện thoại"
                value={value}
                onChangeText={onChange}
                error={errors.phoneNumber?.message}
                keyboardType="phone-pad"
                EndIcon={
                  <Call size={20} color={color.primaryColor} variant="Linear" />
                }
                inputContainerStyle={styles.inputContainer}
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            rules={{validate: validateEmail}}
            render={({field: {onChange, onBlur, value}}) => (
              <Input
                placeholderText="Nhập địa chỉ email"
                value={value}
                onChangeText={onChange}
                error={errors.email?.message}
                keyboardType="email-address"
                EndIcon={
                  <MessageText1
                    size={20}
                    color={color.primaryColor}
                    variant="Linear"
                  />
                }
                inputContainerStyle={styles.inputContainer}
              />
            )}
          />

          <Controller
            control={control}
            name="birthDate"
            render={({field: {onChange, value}}) => (
              <Input
                placeholderText="Chọn ngày sinh"
                value={format(value, 'dd/MM/yyyy')}
                onChangeText={() => {}}
                error={errors.birthDate?.message}
                EndIcon={
                  <TouchableOpacity
                    onPress={() => handleDateChange('birthDate')}>
                    <Calendar
                      size={20}
                      color={color.primaryColor}
                      variant="Linear"
                    />
                  </TouchableOpacity>
                }
                inputContainerStyle={styles.inputContainer}
              />
            )}
          />

          <Controller
            control={control}
            name="address"
            render={({field: {onChange, onBlur, value}}) => (
              <Input
                placeholderText="Nhập địa chỉ"
                value={value}
                onChangeText={onChange}
                error={errors.address?.message}
                EndIcon={
                  <Location
                    size={20}
                    color={color.primaryColor}
                    variant="Linear"
                  />
                }
                inputContainerStyle={styles.inputContainer}
              />
            )}
          />
        </View>

        {/* Work Information Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Briefcase size={22} color={color.primaryColor} variant="Bold" />
            <DynamicText style={styles.sectionTitle}>
              Thông tin công việc
            </DynamicText>
          </View>

          <Controller
            control={control}
            name="department"
            rules={{validate: validateRequired}}
            render={({field: {onChange, onBlur, value}}) => (
              <Input
                placeholderText="Nhập phòng ban"
                value={value}
                onChangeText={onChange}
                error={errors.department?.message}
                EndIcon={
                  <Building
                    size={20}
                    color={color.primaryColor}
                    variant="Linear"
                  />
                }
                inputContainerStyle={styles.inputContainer}
              />
            )}
          />

          <Controller
            control={control}
            name="position"
            rules={{validate: validateRequired}}
            render={({field: {onChange, onBlur, value}}) => (
              <Input
                placeholderText="Nhập chức vụ"
                value={value}
                onChangeText={onChange}
                error={errors.position?.message}
                EndIcon={
                  <Profile2User
                    size={20}
                    color={color.primaryColor}
                    variant="Linear"
                  />
                }
                inputContainerStyle={styles.inputContainer}
              />
            )}
          />

          <Controller
            control={control}
            name="salary"
            rules={{validate: validateSalary}}
            render={({field: {onChange, onBlur, value}}) => (
              <Input
                placeholderText="Nhập lương cơ bản"
                value={value}
                onChangeText={onChange}
                error={errors.salary?.message}
                keyboardType="numeric"
                EndIcon={
                  <MoneyRecive
                    size={20}
                    color={color.primaryColor}
                    variant="Linear"
                  />
                }
                inputContainerStyle={styles.inputContainer}
              />
            )}
          />
        </View>

        {/* Submit Button */}
        <View style={styles.submitButtonContainer}>
          <Button
            title="Thêm nhân viên"
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            loading={isSubmitting}
          />
        </View>
      </ScrollView>
    </BaseLayout>
  );
};

export default AddEmployeeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: scaleHeight(100),
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: moderateScale(16),
    paddingBottom: scaleHeight(30),
  },
  profileCard: {
    backgroundColor: color.accentColor.whiteColor,
    borderRadius: moderateScale(16),
    padding: moderateScale(20),
    marginBottom: scaleHeight(16),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: scaleHeight(10),
  },
  avatar: {
    width: scaledSize(100),
    height: scaledSize(100),
    borderRadius: scaledSize(50),
    borderWidth: 3,
    borderColor: color.primaryColor + '30',
  },
  addAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: color.accentColor.whiteColor,
    borderRadius: scaledSize(12),
    padding: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  profileText: {
    fontFamily: Fonts.Inter_Bold,
    fontSize: scaledSize(18),
    color: color.accentColor.darkColor,
  },
  sectionContainer: {
    backgroundColor: color.accentColor.whiteColor,
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    marginBottom: scaleHeight(16),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleHeight(16),
    paddingBottom: scaleHeight(8),
    borderBottomWidth: 1,
    borderBottomColor: color.accentColor.grayColor + '20',
  },
  sectionTitle: {
    fontFamily: Fonts.Inter_Bold,
    fontSize: scaledSize(16),
    color: color.accentColor.darkColor,
    marginLeft: scaleWidth(10),
  },
  inputContainer: {
    marginBottom: scaleHeight(16),
  },
  radioContainer: {
    marginBottom: scaleHeight(16),
  },
  radioLabel: {
    fontSize: scaledSize(14),
    color: color.accentColor.darkColor,
    marginBottom: scaleHeight(8),
    fontFamily: Fonts.Inter_Regular,
  },
  radioGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: scaleWidth(16),
  },
  radioCircle: {
    height: scaledSize(20),
    width: scaledSize(20),
    borderRadius: scaledSize(10),
    borderWidth: 2,
    borderColor: color.accentColor.grayColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: color.primaryColor,
  },
  radioDot: {
    height: scaledSize(10),
    width: scaledSize(10),
    borderRadius: scaledSize(5),
    backgroundColor: color.primaryColor,
  },
  radioText: {
    fontSize: scaledSize(14),
    color: color.accentColor.grayColor,
    marginLeft: scaleWidth(8),
    fontFamily: Fonts.Inter_Regular,
  },
  radioTextSelected: {
    color: color.accentColor.darkColor,
    fontFamily: Fonts.Inter_SemiBold,
  },
  errorText: {
    color: color.accentColor.errorColor,
    fontSize: scaledSize(12),
    marginTop: scaleHeight(5),
    fontFamily: Fonts.Inter_Regular,
  },
  submitButtonContainer: {
    marginTop: scaleHeight(16),
  },
  errorMessageContainer: {
    backgroundColor: color.accentColor.whiteColor,
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    marginBottom: scaleHeight(16),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  apiErrorText: {
    fontFamily: Fonts.Inter_Regular,
    fontSize: scaledSize(14),
    color: color.accentColor.errorColor,
  },
});
