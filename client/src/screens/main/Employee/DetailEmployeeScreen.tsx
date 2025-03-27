import React, {useEffect, useCallback, useState} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {BaseLayout, DynamicText, Header, Button} from '../../../components';
import {
  color,
  moderateScale,
  scaledSize,
  scaleHeight,
  scaleWidth,
} from '../../../utils';
import {contents} from '../../../context';
import {Images, Fonts} from '../../../assets';
import {observer} from 'mobx-react-lite';
import {rootStore} from '../../../models/root-store';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {RootStackParamList, Screen} from '../../../navigation/navigation.type';
import {Image} from 'react-native';
import {format} from 'date-fns';
import {vi} from 'date-fns/locale';

type DetailEmployeeScreenRouteProp = RouteProp<
  RootStackParamList,
  Screen.DETAIL_EMPLOYEE
>;

const DetailEmployeeScreen = observer(() => {
  const navigation = useNavigation();
  const route = useRoute<DetailEmployeeScreenRouteProp>();
  const {id} = route.params;
  const {employees} = rootStore;
  const {isLoadingEmployees, error} = employees;
  const [retryCount, setRetryCount] = useState(0);

  const loadEmployeeData = useCallback(async () => {
    try {
      // Force a new fetch from the API to get the latest data
      const success = await employees.fetchEmployeeById(id);
      if (!success && retryCount < 2) {
        setRetryCount(prev => prev + 1);
        console.log(`Retry fetchEmployeeById (${retryCount + 1}/3)...`);

        // Nếu vẫn lỗi sau 3 lần thử, hiển thị thông báo
        if (retryCount === 1) {
          setTimeout(() => {
            Alert.alert(
              'Lỗi kết nối',
              'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet và thử lại.',
              [{text: 'Đồng ý'}],
            );
          }, 500);
        }
      }
    } catch (err: any) {
      console.error('Error loading employee details:', err);
      if (err.message?.includes('401')) {
        Alert.alert(
          'Phiên đăng nhập hết hạn',
          'Vui lòng đăng nhập lại để tiếp tục',
          [
            {
              text: 'Đăng nhập lại',
              onPress: () => {
                rootStore.auth.clearAuth();
                navigation.navigate(Screen.LOGIN as never);
              },
            },
          ],
        );
      }
    }
  }, [employees, id, retryCount, navigation]);

  useEffect(() => {
    loadEmployeeData();
  }, [loadEmployeeData]);

  const employee = employees.getEmployeeByEmployeeId(id);

  const confirmDelete = () => {
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa nhân viên này?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Xóa',
          onPress: handleDelete,
          style: 'destructive',
        },
      ],
      {cancelable: true},
    );
  };

  const handleDelete = async () => {
    if (!employee) return;

    try {
      const success = await employees.deleteEmployee(employee.id);
      if (success) {
        Alert.alert('Thành công', 'Đã xóa nhân viên thành công');
        navigation.goBack();
      } else {
        Alert.alert('Lỗi', employees.error || 'Không thể xóa nhân viên');
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi không mong muốn khi xóa nhân viên');
    }
  };

  if (isLoadingEmployees && !employee) {
    return (
      <BaseLayout>
        <Header
          title={contents.detail_employee.title}
          showBackIcon={true}
          onPressBack={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={color.primaryColor} />
        </View>
      </BaseLayout>
    );
  }

  if (error) {
    return (
      <BaseLayout>
        <Header
          title={contents.detail_employee.title}
          showBackIcon={true}
          onPressBack={() => navigation.goBack()}
        />
        <View style={styles.errorContainer}>
          <DynamicText style={styles.errorText}>{error}</DynamicText>
          <Button
            title="Thử lại"
            onPress={loadEmployeeData}
            buttonContainerStyle={styles.retryButton}
          />
        </View>
      </BaseLayout>
    );
  }

  if (!employee) {
    return (
      <BaseLayout>
        <Header
          title={contents.detail_employee.title}
          showBackIcon={true}
          onPressBack={() => navigation.goBack()}
        />
        <View style={styles.errorContainer}>
          <DynamicText style={styles.errorText}>
            Không tìm thấy thông tin nhân viên
          </DynamicText>
        </View>
      </BaseLayout>
    );
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Không có';

    try {
      return format(new Date(dateString), 'dd/MM/yyyy', {locale: vi});
    } catch (err) {
      return 'Ngày không hợp lệ';
    }
  };

  return (
    <BaseLayout>
      <Header
        title={contents.detail_employee.title}
        showBackIcon={true}
        onPressBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Ảnh đại diện */}
        <Image
          source={
            employee.user.avatar
              ? {uri: employee.user.avatar}
              : Images.AVATAR_BYEWIND
          }
          style={styles.avatar}
        />

        {/* Hộp thông tin */}
        <View style={styles.infoContainer}>
          <View style={styles.rowNoBorder}>
            <DynamicText style={styles.label}>
              {contents.detail_employee.id}
            </DynamicText>
            <DynamicText style={styles.value}>
              {employee.employeeId}
            </DynamicText>
          </View>

          {renderInfoRow(
            contents.detail_employee.username,
            employee.user.fullName,
          )}

          {renderInfoRow(
            contents.detail_employee.gender,
            employee.user.gender || 'Không có',
          )}

          {renderInfoRow(
            contents.detail_employee.phone,
            employee.user.phoneNumber || 'Không có',
          )}

          {renderInfoRow(contents.detail_employee.email, employee.user.email)}

          {renderInfoRow(
            contents.detail_employee.bithDate,
            formatDate(employee.hireDate),
          )}

          {renderInfoRow(contents.detail_employee.position, employee.position)}
        </View>

        {/* Nút xóa nhân viên */}
        <TouchableOpacity style={styles.deleteButton} onPress={confirmDelete}>
          <DynamicText style={styles.deleteText}>
            {contents.detail_employee.button_title}
          </DynamicText>
        </TouchableOpacity>
      </ScrollView>
    </BaseLayout>
  );
});

const renderInfoRow = (label: string, value: string) => (
  <View style={styles.row}>
    <DynamicText style={styles.label}>{label}</DynamicText>
    {value && <DynamicText style={styles.value}>{value}</DynamicText>}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    backgroundColor: color.backgroundColor,
    paddingVertical: scaleHeight(20),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(16),
  },
  errorText: {
    color: color.accentColor.errorColor,
    marginBottom: scaleHeight(10),
    textAlign: 'center',
  },
  retryButton: {
    width: '50%',
  },
  avatar: {
    width: scaleWidth(100),
    height: scaleHeight(100),
    borderRadius: scaledSize(50),
    backgroundColor: '#E0E0E0',
    marginBottom: scaleHeight(10),
  },
  infoContainer: {
    backgroundColor: color.accentColor.whiteColor,
    width: '90%',
    borderRadius: scaledSize(10),
    marginTop: scaleHeight(10),
    paddingHorizontal: scaleWidth(20),
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scaleHeight(15),
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  rowNoBorder: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scaleHeight(15),
  },
  label: {
    fontSize: scaledSize(14),
    fontFamily: Fonts.Inter_SemiBold,
    color: color.accentColor.darkColor,
  },
  value: {
    fontSize: scaledSize(14),
    color: color.accentColor.darkColor,
  },
  deleteButton: {
    marginTop: scaleHeight(20),
    paddingVertical: scaleHeight(15),
    width: '90%',
    alignItems: 'center',
    borderRadius: scaledSize(8),
    borderWidth: scaleWidth(1),
    borderColor: color.accentColor.errorColor,
  },
  deleteText: {
    color: color.accentColor.errorColor,
    fontSize: scaledSize(16),
    fontFamily: Fonts.Inter_SemiBold,
  },
});

export default DetailEmployeeScreen;
