import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Alert,
  Animated,
  Pressable,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { observer } from 'mobx-react-lite';
import { DynamicText, Header } from '../../../components';
import { color, moderateScale, scaleWidth } from '../../../utils';
import { promotionAPI } from '../../../services/api/promotionAPI';
import { useNavigation } from '@react-navigation/native';
import { Screen, RootStackParamList } from '../../../navigation/navigation.type';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { rootStore } from '../../../models/root-store';
import { Add, ArrowLeft } from 'iconsax-react-native';
import { IPromotion } from '../../../models/promotion/promotion';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const PromotionListScreen = observer(() => {
  const navigation = useNavigation<NavigationProp>();
  const { promotionStore } = rootStore;
  const [refreshing, setRefreshing] = React.useState(false);
  const [selectedPromotion, setSelectedPromotion] = React.useState<IPromotion | null>(null);
  const [isDialogVisible, setIsDialogVisible] = React.useState(false);
  const [scaleAnim] = React.useState(new Animated.Value(1));
  const [showStartDatePicker, setShowStartDatePicker] = React.useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = React.useState(false);
  const [tempDates, setTempDates] = React.useState({ startDate: new Date(), endDate: new Date() });

  const fetchPromotions = async () => {
    try {
      promotionStore.setLoading(true);
      promotionStore.setError(''); // Clear any previous errors
      
      const response = await promotionAPI.getPromotions();
      console.log('Response from API:', response); // Debug log
      
      if (response.ok && Array.isArray(response.data)) {
        console.log('Data received:', response.data); // Debug log
        promotionStore.setPromotions(response.data);
      } else {
        console.error('API Error:', response.problem, response.status); // Debug log
        let errorMessage = 'Không thể tải danh sách khuyến mãi';
        
        if (response.problem === 'NETWORK_ERROR') {
          errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.';
        } else if (response.problem === 'TIMEOUT_ERROR') {
          errorMessage = 'Kết nối quá hạn. Vui lòng thử lại.';
        } else if (response.status === 401) {
          errorMessage = 'Vui lòng đăng nhập lại';
        } else if (response.status === 403) {
          errorMessage = 'Bạn không có quyền truy cập';
        }
        
        promotionStore.setError(errorMessage);
      }
    } catch (error) {
      console.error('Error fetching promotions:', error);
      promotionStore.setError('Lỗi không xác định khi tải danh sách khuyến mãi');
    } finally {
      promotionStore.setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchPromotions();
    setRefreshing(false);
  }, []);

  const navigateToAddPromotion = () => {
    navigation.navigate(Screen.ADD_PROMOTION);
  };

  const handleDateChange = async () => {
    if (!selectedPromotion) return;

    try {
      // Tính toán trạng thái mới dựa trên ngày
      const currentDate = new Date();
      const startDate = new Date(tempDates.startDate);
      const endDate = new Date(tempDates.endDate);
      
      let calculatedStatus: 'sapdienra' | 'active' | 'expired';
      if (currentDate < startDate) {
        calculatedStatus = 'sapdienra';
      } else if (currentDate >= startDate && currentDate <= endDate) {
        calculatedStatus = 'active';
      } else {
        calculatedStatus = 'expired';
      }

      const response = await promotionAPI.updatePromotion(selectedPromotion._id, {
        ...selectedPromotion,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        status: calculatedStatus
      });

      if (response.ok) {
        Alert.alert('Thành công', 'Cập nhật thời gian thành công');
        await fetchPromotions();
      } else {
        Alert.alert('Lỗi', 'Không thể cập nhật thời gian khuyến mãi');
      }
    } catch (error) {
      console.error('Error updating promotion:', error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi cập nhật khuyến mãi');
    } finally {
      setIsDialogVisible(false);
      setSelectedPromotion(null);
    }
  };

  const onStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setTempDates(prev => ({ ...prev, startDate: selectedDate }));
    }
  };

  const onEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setTempDates(prev => ({ ...prev, endDate: selectedDate }));
    }
  };

  const animatePress = (scale: number) => {
    Animated.spring(scaleAnim, {
      toValue: scale,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();
  };

  const renderStatusButton = (
    text: string,
    backgroundColor: string,
    onPress: () => void
  ) => (
    <TouchableOpacity
      style={[styles.statusButton, { backgroundColor }]}
      onPress={onPress}>
      <DynamicText style={styles.statusButtonText}>{text}</DynamicText>
    </TouchableOpacity>
  );

  const renderUpdateDialog = () => (
    <Modal
      visible={isDialogVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setIsDialogVisible(false)}>
      <Pressable 
        style={styles.modalOverlay}
        onPress={() => setIsDialogVisible(false)}>
        <View 
          style={styles.dialogContainer}
          onStartShouldSetResponder={() => true}>
          <DynamicText style={styles.dialogTitle}>Cập nhật thời gian</DynamicText>

          <View style={styles.dateContainer}>
            <DynamicText style={styles.label}>Ngày bắt đầu</DynamicText>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowStartDatePicker(true)}>
              <DynamicText>
                {tempDates.startDate.toLocaleDateString('vi-VN')}
              </DynamicText>
            </TouchableOpacity>
          </View>

          <View style={styles.dateContainer}>
            <DynamicText style={styles.label}>Ngày kết thúc</DynamicText>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowEndDatePicker(true)}>
              <DynamicText>
                {tempDates.endDate.toLocaleDateString('vi-VN')}
              </DynamicText>
            </TouchableOpacity>
          </View>

          {showStartDatePicker && (
            <DateTimePicker
              value={tempDates.startDate}
              mode="date"
              display="default"
              onChange={onStartDateChange}
            />
          )}

          {showEndDatePicker && (
            <DateTimePicker
              value={tempDates.endDate}
              mode="date"
              display="default"
              onChange={onEndDateChange}
              minimumDate={tempDates.startDate}
            />
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.dialogButton, styles.updateButton]}
              onPress={handleDateChange}>
              <DynamicText style={styles.buttonText}>Cập nhật</DynamicText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dialogButton, styles.cancelButton]}
              onPress={() => setIsDialogVisible(false)}>
              <DynamicText style={[styles.buttonText, { color: color.accentColor.darkColor }]}>Hủy</DynamicText>
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Modal>
  );

  const renderPromotionItem = ({ item }: { item: IPromotion }) => {
    // Calculate status based on current date and promotion dates
    const currentDate = new Date();
    const startDate = new Date(item.startDate);
    const endDate = new Date(item.endDate);
    
    let calculatedStatus = item.status;
    if (currentDate < startDate) {
      calculatedStatus = 'sapdienra';
    } else if (currentDate >= startDate && currentDate <= endDate) {
      calculatedStatus = 'active';
    } else {
      calculatedStatus = 'expired';
    }

    // Update promotion status if it's different
    if (calculatedStatus !== item.status) {
      promotionAPI.updatePromotion(item._id, {
        ...item,
        status: calculatedStatus
      });
      promotionStore.updatePromotion({
        ...item,
        status: calculatedStatus
      });
    }

    return (
      <TouchableOpacity
        style={styles.promotionItem}
        onPress={() => {
          setSelectedPromotion(item);
          setTempDates({
            startDate: new Date(item.startDate),
            endDate: new Date(item.endDate)
          });
          setIsDialogVisible(true);
        }}>
        <View style={styles.promotionHeader}>
          <DynamicText style={styles.promotionName}>{item.name}</DynamicText>
          <DynamicText
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  calculatedStatus === 'active'
                    ? color.accentColor.greenColor
                    : calculatedStatus === 'sapdienra'
                    ? color.accentColor.grayColor
                    : color.accentColor.errorColor,
              },
            ]}>
            {calculatedStatus === 'active'
              ? 'Đang diễn ra'
              : calculatedStatus === 'sapdienra'
              ? 'Sắp diễn ra'
              : 'Hết hạn'}
          </DynamicText>
        </View>
        <View style={styles.promotionDetails}>
          <DynamicText style={styles.detailText}>
            Giảm giá: {item.discount}%
          </DynamicText>
          <DynamicText style={styles.detailText}>
            Đơn tối thiểu: {item.minOrderValue.toLocaleString()}đ
          </DynamicText>
          <DynamicText style={styles.detailText}>
            Giảm tối đa: {item.maxDiscount.toLocaleString()}đ
          </DynamicText>
        </View>
        <View style={styles.dateContainer}>
          <DynamicText style={styles.dateText}>
            Từ: {new Date(item.startDate).toLocaleDateString('vi-VN')}
          </DynamicText>
          <DynamicText style={styles.dateText}>
            Đến: {new Date(item.endDate).toLocaleDateString('vi-VN')}
          </DynamicText>
        </View>
      </TouchableOpacity>
    );
  };

  if (promotionStore.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <DynamicText>Đang tải...</DynamicText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header 
        title="Danh sách khuyến mãi"
        showBackIcon={true}
        onPressBack={() => navigation.goBack()}
        showRightIcon={true}
        RightIcon={
          <View style={styles.addIconContainer}>
            <Add 
              size={24} 
              color={color.accentColor.whiteColor}
              variant="Bold"
            />
          </View>
        }
        onPressRight={navigateToAddPromotion}
      />
      {promotionStore.error ? (
        <View style={styles.errorContainer}>
          <DynamicText style={styles.errorText}>{promotionStore.error}</DynamicText>
        </View>
      ) : (
        <FlatList
          data={promotionStore.promotions}
          renderItem={renderPromotionItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <DynamicText>Không có khuyến mãi nào</DynamicText>
            </View>
          }
        />
      )}
      {renderUpdateDialog()}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.backgroundColor,
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
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(16),
  },
  listContainer: {
    padding: moderateScale(16),
  },
  promotionItem: {
    backgroundColor: color.accentColor.whiteColor,
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginBottom: moderateScale(16),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  promotionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(8),
  },
  promotionName: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: 'red',
  },
  statusBadge: {
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(12),
    color: color.accentColor.whiteColor,
    fontSize: moderateScale(12),
  },
  promotionDetails: {
    marginBottom: moderateScale(8),
  },
  detailText: {
    fontSize: moderateScale(14),
    color: color.accentColor.darkColor,
    marginBottom: moderateScale(4),
  },
  dateContainer: {
    marginBottom: moderateScale(16),
  },
  label: {
    fontSize: moderateScale(14),
    marginBottom: moderateScale(8),
    color: color.accentColor.darkColor,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: color.accentColor.grayColor,
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
  },
  buttonContainer: {
    flexDirection: 'column',
    marginTop: moderateScale(24),
    width: '100%',
  },
  dialogButton: {
    padding: moderateScale(14),
    borderRadius: moderateScale(8),
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: moderateScale(6),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  updateButton: {
    backgroundColor: color.primaryColor,
  },
  cancelButton: {
    backgroundColor: color.accentColor.whiteColor,
    borderWidth: 1,
    borderColor: color.accentColor.grayColor,
  },
  buttonText: {
    color: color.accentColor.whiteColor,
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
  dateText: {
    fontSize: moderateScale(12),
    color: 'blue',
  },
  addIconContainer: {
    backgroundColor: color.primaryColor,
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  backButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: moderateScale(8),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogContainer: {
    backgroundColor: color.accentColor.whiteColor,
    borderRadius: moderateScale(16),
    padding: moderateScale(24),
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  dialogTitle: {
    fontSize: moderateScale(20),
    fontWeight: 'bold',
    marginBottom: moderateScale(20),
    textAlign: 'center',
    color: color.accentColor.darkColor,
  },
  statusButton: {
    padding: moderateScale(14),
    borderRadius: moderateScale(12),
    marginBottom: moderateScale(12),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  statusButtonText: {
    color: color.accentColor.whiteColor,
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
});

export default PromotionListScreen;
