import React, {useEffect, useCallback, useState} from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
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
import {Fonts, Images} from '../../../assets';
import {NavigationProp, useNavigation} from '@react-navigation/native';
import {RootStackParamList, Screen} from '../../../navigation/navigation.type';
import {observer} from 'mobx-react-lite';
import {rootStore} from '../../../models/root-store';
import {
  ProfileAdd,
  SearchNormal1,
  Edit2,
  Trash,
  ArrowRight2,
  People,
  Add,
  Calendar,
  Building,
  User,
  TickCircle,
  CloseCircle,
  Timer,
  Filter,
} from 'iconsax-react-native';
import {format} from 'date-fns';
import {vi} from 'date-fns/locale';

const EmployeeScreen = observer(() => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const {employees} = rootStore;
  const {employeeList, isLoadingEmployees, error} = employees;
  const [retryCount, setRetryCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filteredEmployees, setFilteredEmployees] = useState<any[]>(
    Array.from(employees.employees),
  );
  const [errorState, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const fetchEmployees = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const success = await employees.fetchEmployees();
      if (!success && retryCount < 2) {
        setRetryCount(prev => prev + 1);
        console.log(`Retry fetchEmployees (${retryCount + 1}/3)...`);

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

      // Apply filter if needed
      if (statusFilter) {
        setFilteredEmployees(
          employees.getEmployeesByStatus(statusFilter as any),
        );
      } else {
        setFilteredEmployees(Array.from(employees.employees));
      }
    } catch (err: any) {
      console.error('Error fetching employees:', err);
      if (err.message?.includes('401')) {
        Alert.alert(
          'Phiên đăng nhập hết hạn',
          'Vui lòng đăng nhập lại để tiếp tục',
          [
            {
              text: 'Đăng nhập lại',
              onPress: () => {
                rootStore.auth.clearAuth();
                navigation.navigate(Screen.LOGIN);
              },
            },
          ],
        );
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [employees, retryCount, navigation, statusFilter]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const onRefresh = () => {
    setIsRefreshing(true);
    setError(null);

    employees
      .fetchEmployees()
      .then(() => {
        if (statusFilter) {
          setFilteredEmployees(
            employees.getEmployeesByStatus(statusFilter as any),
          );
        } else {
          setFilteredEmployees(Array.from(employees.employees));
        }
      })
      .catch((error: any) => {
        console.error('Error refreshing employees:', error);
        setError('Không thể tải danh sách nhân viên');
      })
      .finally(() => {
        setIsRefreshing(false);
      });
  };

  const handleSearch = useCallback(
    (text: string) => {
      setSearchText(text);
      let filtered = statusFilter
        ? employees.getEmployeesByStatus(statusFilter as any)
        : Array.from(employees.employees);

      if (text.trim() !== '') {
        filtered = filtered.filter(
          (employee: any) =>
            employee.user.fullName.toLowerCase().includes(text.toLowerCase()) ||
            employee.employeeId.toLowerCase().includes(text.toLowerCase()) ||
            employee.department.toLowerCase().includes(text.toLowerCase()) ||
            employee.position.toLowerCase().includes(text.toLowerCase()) ||
            (employee.user.phoneNumber &&
              employee.user.phoneNumber
                .toLowerCase()
                .includes(text.toLowerCase())) ||
            employee.user.email.toLowerCase().includes(text.toLowerCase()),
        );
      }

      setFilteredEmployees(filtered);
    },
    [employees.employees, statusFilter],
  );

  const handleDeleteEmployee = useCallback(
    (id: string, name: string) => {
      Alert.alert(
        'Xác nhận xóa',
        `Bạn có chắc chắn muốn xóa nhân viên ${name} không?`,
        [
          {
            text: 'Hủy',
            style: 'cancel',
          },
          {
            text: 'Xóa',
            style: 'destructive',
            onPress: async () => {
              try {
                console.log(`Bắt đầu xóa nhân viên với id: ${id}`);
                const success = await employees.deleteEmployee(id);
                console.log(`Kết quả xóa: ${success}`);

                if (success) {
                  Alert.alert('Thành công', 'Đã xóa nhân viên thành công');

                  // Cập nhật danh sách đã lọc
                  setFilteredEmployees(prevList =>
                    prevList.filter(
                      (emp: any) => emp.id !== id && emp.employeeId !== id,
                    ),
                  );

                  // Làm mới danh sách nhân viên
                  onRefresh();
                } else {
                  Alert.alert(
                    'Lỗi',
                    employees.error ||
                      'Không thể xóa nhân viên. Vui lòng thử lại sau.',
                  );
                }
              } catch (error: any) {
                console.error('Error deleting employee:', error);
                Alert.alert(
                  'Lỗi',
                  error?.message ||
                    'Đã xảy ra lỗi không mong muốn khi xóa nhân viên',
                );
              }
            },
          },
        ],
      );
    },
    [employees, onRefresh],
  );

  const handlePressEmployee = (employeeId: string) => {
    navigation.navigate(Screen.DETAIL_EMPLOYEE, {id: employeeId});
  };

  const handleFilterByStatus = (status: string | null) => {
    setStatusFilter(status);
    if (status) {
      setFilteredEmployees(employees.getEmployeesByStatus(status as any));
    } else {
      setFilteredEmployees(Array.from(employees.employees));
    }

    // Also apply current search if any
    if (searchText) {
      handleSearch(searchText);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <TickCircle size={16} color="#00CC99" variant="Bold" />;
      case 'inactive':
        return <CloseCircle size={16} color="#FF4757" variant="Bold" />;
      case 'leave':
        return <Timer size={16} color="#FFA500" variant="Bold" />;
      default:
        return <TickCircle size={16} color="#00CC99" variant="Bold" />;
    }
  };

  const renderItem = ({item}: any) => (
    <TouchableOpacity
      style={styles.employeeItem}
      onPress={() => handlePressEmployee(item.employeeId)}
      activeOpacity={0.7}>
      <Image
        source={
          item.user.avatar ? {uri: item.user.avatar} : Images.AVATAR_BYEWIND
        }
        style={styles.avatar}
      />
      <View style={styles.cardContent}>
        <View style={styles.employeeHeader}>
          <DynamicText style={styles.employeeName}>
            {item.user.fullName}
          </DynamicText>
          <View style={[styles.statusBadge, getStatusStyle(item.workStatus)]}>
            {getStatusIcon(item.workStatus)}
            <DynamicText
              style={[
                styles.statusBadgeText,
                getStatusTextStyle(item.workStatus),
              ]}>
              {getStatusLabel(item.workStatus)}
            </DynamicText>
          </View>
        </View>

        <View style={styles.employeeInfo}>
          <View style={styles.infoItem}>
            <User
              size={16}
              color={color.accentColor.grayColor}
              variant="Linear"
            />
            <DynamicText style={styles.employeePosition}>
              {item.position}
            </DynamicText>
          </View>
          <View style={styles.infoItem}>
            <Building
              size={16}
              color={color.accentColor.grayColor}
              variant="Linear"
            />
            <DynamicText style={styles.employeeDepartment}>
              {item.department}
            </DynamicText>
          </View>
          <View style={styles.infoItem}>
            <Calendar
              size={16}
              color={color.accentColor.grayColor}
              variant="Linear"
            />
            <DynamicText style={styles.employeeHireDate}>
              {format(new Date(item.hireDate), 'dd/MM/yyyy', {locale: vi})}
            </DynamicText>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() =>
              navigation.navigate(Screen.UPDATE_EMPLOYEE, {
                employeeId: item.employeeId,
              })
            }>
            <Edit2 size={16} color="white" variant="Bold" />
            <DynamicText style={styles.actionButtonText}>Sửa</DynamicText>
          </TouchableOpacity>
          {/* <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteEmployee(item.id, item.user?.fullName)}>
            <Trash size={16} color="white" variant="Bold" />
            <DynamicText style={styles.actionButtonText}>Xóa</DynamicText>
          </TouchableOpacity> */}
          <TouchableOpacity
            style={[styles.actionButton, styles.viewButton]}
            onPress={() => handlePressEmployee(item.employeeId)}>
            <ArrowRight2 size={16} color="white" variant="Bold" />
            <DynamicText style={styles.actionButtonText}>Chi tiết</DynamicText>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active':
        return styles.activeStatus;
      case 'inactive':
        return styles.inactiveStatus;
      case 'leave':
        return styles.leaveStatus;
      default:
        return styles.activeStatus;
    }
  };

  const getStatusTextStyle = (status: string) => {
    switch (status) {
      case 'active':
        return styles.activeStatusText;
      case 'inactive':
        return styles.inactiveStatusText;
      case 'leave':
        return styles.leaveStatusText;
      default:
        return styles.activeStatusText;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Đang làm việc';
      case 'inactive':
        return 'Đã nghỉ việc';
      case 'leave':
        return 'Nghỉ phép';
      default:
        return 'Đang làm việc';
    }
  };

  const renderHeader = () => (
    <>
      <View style={styles.headerContainer}>
        <View style={styles.searchBox}>
          <SearchNormal1
            size={20}
            color={color.accentColor.grayColor}
            variant="Linear"
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm nhân viên..."
            placeholderTextColor={color.accentColor.grayColor}
            value={searchText}
            onChangeText={handleSearch}
          />
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate(Screen.ADD_EMPLOYEE)}
          activeOpacity={0.7}>
          <Add size={20} color={color.accentColor.whiteColor} variant="Bold" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            !statusFilter && styles.filterButtonActive,
          ]}
          onPress={() => handleFilterByStatus(null)}>
          <DynamicText
            style={[
              styles.filterText,
              !statusFilter && styles.filterTextActive,
            ]}>
            Tất cả
          </DynamicText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            statusFilter === 'active' && styles.filterButtonActive,
          ]}
          onPress={() => handleFilterByStatus('active')}>
          <DynamicText
            style={[
              styles.filterText,
              statusFilter === 'active' && styles.filterTextActive,
            ]}>
            Đang làm việc
          </DynamicText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            statusFilter === 'leave' && styles.filterButtonActive,
          ]}
          onPress={() => handleFilterByStatus('leave')}>
          <DynamicText
            style={[
              styles.filterText,
              statusFilter === 'leave' && styles.filterTextActive,
            ]}>
            Nghỉ phép
          </DynamicText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            statusFilter === 'inactive' && styles.filterButtonActive,
          ]}
          onPress={() => handleFilterByStatus('inactive')}>
          <DynamicText
            style={[
              styles.filterText,
              statusFilter === 'inactive' && styles.filterTextActive,
            ]}>
            Đã nghỉ việc
          </DynamicText>
        </TouchableOpacity>
      </View>

      {/* <View style={styles.statContainer}>
        <View style={styles.statItem}>
          <DynamicText style={styles.statValue}>
            {employeeList.length}
          </DynamicText>
          <DynamicText style={styles.statLabel}>Tổng nhân viên</DynamicText>
        </View>
        <View style={styles.statItem}>
          <DynamicText style={styles.statValue}>
            {employees.getEmployeesByStatus('active').length}
          </DynamicText>
          <DynamicText style={styles.statLabel}>Đang làm việc</DynamicText>
        </View>
        <View style={styles.statItem}>
          <DynamicText style={styles.statValue}>
            {employees.getEmployeesByStatus('leave').length}
          </DynamicText>
          <DynamicText style={styles.statLabel}>Nghỉ phép</DynamicText>
        </View>
      </View> */}
    </>
  );

  const EmptyEmployeeList = () => (
    <View style={styles.emptyContainer}>
      <People
        size={60}
        color={color.accentColor.grayColor + '80'}
        variant="Bulk"
      />
      <DynamicText style={styles.emptyText}>
        {searchText
          ? 'Không tìm thấy nhân viên nào phù hợp với tìm kiếm của bạn'
          : statusFilter
          ? `Không có nhân viên nào trong trạng thái ${getStatusLabel(
              statusFilter,
            )}`
          : 'Chưa có nhân viên nào trong hệ thống'}
      </DynamicText>
      <TouchableOpacity
        style={styles.addEmployeeButton}
        onPress={() => navigation.navigate(Screen.ADD_EMPLOYEE)}>
        <ProfileAdd
          size={20}
          color={color.accentColor.whiteColor}
          variant="Bold"
        />
        <DynamicText style={styles.addEmployeeButtonText}>
          Thêm nhân viên mới
        </DynamicText>
      </TouchableOpacity>
    </View>
  );

  if (isLoadingEmployees && employeeList.length === 0) {
    return (
      <BaseLayout style={styles.container}>
        <Header
          title={contents.employee.title}
          showBackIcon={true}
          onPressBack={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={color.primaryColor} />
        </View>
      </BaseLayout>
    );
  }

  return (
    <BaseLayout style={styles.container}>
      <Header
        title={contents.employee.title}
        showBackIcon={true}
        onPressBack={() => navigation.goBack()}
      />
      {renderHeader()}

      <FlatList
        data={filteredEmployees}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListEmptyComponent={<EmptyEmployeeList />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[color.primaryColor]}
          />
        }
      />

      {isLoadingEmployees && employeeList.length > 0 && !isRefreshing && (
        <View style={styles.overlayLoadingContainer}>
          <ActivityIndicator size="large" color={color.primaryColor} />
        </View>
      )}

      {errorState && (
        <View style={styles.errorContainer}>
          <DynamicText style={styles.errorText}>{errorState}</DynamicText>
          <Button
            title="Thử lại"
            onPress={fetchEmployees}
            buttonContainerStyle={styles.retryButton}
          />
        </View>
      )}
    </BaseLayout>
  );
});

export default EmployeeScreen;

const styles = StyleSheet.create({
  container: {
    backgroundColor: color.backgroundColor,
  },
  contentContainer: {
    paddingHorizontal: moderateScale(16),
    paddingTop: moderateScale(10),
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleHeight(16),
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: scaleHeight(100),
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    backgroundColor: color.accentColor.whiteColor,
    borderRadius: moderateScale(12),
    paddingVertical: scaleHeight(12),
    paddingHorizontal: scaleWidth(16),
    marginRight: moderateScale(12),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: scaledSize(14),
    fontFamily: Fonts.Inter_Regular,
    color: color.accentColor.darkColor,
    marginLeft: scaleWidth(10),
    padding: 0,
  },
  addButton: {
    backgroundColor: color.primaryColor,
    borderRadius: moderateScale(12),
    width: scaleWidth(44),
    height: scaleWidth(44),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: scaleHeight(16),
    flexWrap: 'wrap',
  },
  filterButton: {
    paddingVertical: scaleHeight(6),
    paddingHorizontal: scaleWidth(12),
    borderRadius: moderateScale(20),
    marginRight: scaleWidth(8),
    marginBottom: scaleHeight(8),
    backgroundColor: color.accentColor.whiteColor,
  },
  filterButtonActive: {
    backgroundColor: color.primaryColor,
  },
  filterText: {
    fontSize: scaledSize(12),
    fontFamily: Fonts.Inter_Regular,
    color: color.accentColor.darkColor,
  },
  filterTextActive: {
    color: color.accentColor.whiteColor,
    fontFamily: Fonts.Inter_SemiBold,
  },
  statContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scaleHeight(16),
    backgroundColor: color.accentColor.whiteColor,
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: scaledSize(18),
    fontFamily: Fonts.Inter_Bold,
    color: color.primaryColor,
  },
  statLabel: {
    fontSize: scaledSize(12),
    fontFamily: Fonts.Inter_Regular,
    color: color.accentColor.darkColor,
    marginTop: scaleHeight(4),
  },
  employeeItem: {
    backgroundColor: color.accentColor.whiteColor,
    borderRadius: moderateScale(16),
    marginBottom: scaleHeight(16),
    padding: moderateScale(16),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
  },
  cardContent: {
    flex: 1,
    marginLeft: scaleWidth(12),
  },
  avatar: {
    width: scaledSize(60),
    height: scaledSize(60),
    borderRadius: moderateScale(12),
  },
  employeeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleHeight(10),
  },
  employeeName: {
    fontSize: scaledSize(16),
    fontFamily: Fonts.Inter_Bold,
    color: color.accentColor.darkColor,
  },
  employeeInfo: {
    marginTop: scaleHeight(4),
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleHeight(6),
  },
  employeePosition: {
    fontSize: scaledSize(14),
    fontFamily: Fonts.Inter_Regular,
    color: color.accentColor.darkColor,
    marginLeft: scaleWidth(6),
  },
  employeeDepartment: {
    fontSize: scaledSize(14),
    fontFamily: Fonts.Inter_Regular,
    color: color.accentColor.darkColor,
    marginLeft: scaleWidth(6),
  },
  employeeHireDate: {
    fontSize: scaledSize(14),
    fontFamily: Fonts.Inter_Regular,
    color: color.accentColor.darkColor,
    marginLeft: scaleWidth(6),
  },
  statusBadge: {
    paddingHorizontal: scaleWidth(8),
    paddingVertical: scaleHeight(4),
    borderRadius: moderateScale(8),
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadgeText: {
    fontSize: scaledSize(12),
    fontFamily: Fonts.Inter_Regular,
    marginLeft: scaleWidth(4),
  },
  activeStatus: {
    backgroundColor: 'rgba(0, 204, 153, 0.15)',
  },
  inactiveStatus: {
    backgroundColor: 'rgba(255, 71, 87, 0.15)',
  },
  leaveStatus: {
    backgroundColor: 'rgba(255, 165, 0, 0.15)',
  },
  activeStatusText: {
    color: '#00CC99',
  },
  inactiveStatusText: {
    color: '#FF4757',
  },
  leaveStatusText: {
    color: '#FFA500',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: scaleHeight(12),
    paddingTop: scaleHeight(12),
    borderTopWidth: 1,
    borderTopColor: color.accentColor.grayColor + '20',
  },
  actionButton: {
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(6),
    borderRadius: scaledSize(8),
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: scaleWidth(8),
    flexDirection: 'row',
  },
  actionButtonText: {
    fontSize: scaledSize(12),
    fontFamily: Fonts.Inter_Regular,
    color: color.accentColor.whiteColor,
    marginLeft: scaleWidth(4),
  },
  editButton: {
    backgroundColor: color.primaryColor,
  },
  deleteButton: {
    backgroundColor: color.accentColor.errorColor,
  },
  viewButton: {
    backgroundColor: color.accentColor.grayColor,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  errorContainer: {
    padding: moderateScale(16),
    backgroundColor: 'rgba(255, 71, 87, 0.1)',
    borderRadius: moderateScale(12),
    alignItems: 'center',
    margin: moderateScale(10),
  },
  errorText: {
    color: color.accentColor.errorColor,
    marginBottom: scaleHeight(10),
    textAlign: 'center',
    fontFamily: Fonts.Inter_Regular,
  },
  retryButton: {
    width: '50%',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scaleHeight(40),
  },
  emptyText: {
    fontSize: scaledSize(16),
    color: color.accentColor.grayColor,
    textAlign: 'center',
    marginVertical: scaleHeight(20),
    fontFamily: Fonts.Inter_Regular,
    paddingHorizontal: scaleWidth(20),
  },
  addEmployeeButton: {
    backgroundColor: color.primaryColor,
    borderRadius: moderateScale(12),
    paddingVertical: scaleHeight(12),
    paddingHorizontal: scaleWidth(20),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  addEmployeeButtonText: {
    color: color.accentColor.whiteColor,
    fontSize: scaledSize(14),
    fontFamily: Fonts.Inter_SemiBold,
    marginLeft: scaleWidth(8),
  },
});
