import React, {useEffect, useState} from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextStyle,
} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {
  BaseLayout,
  Header,
  DynamicText,
  Input,
  Button,
} from '../../../components';
import {
  SearchNormal1,
  Profile2User,
  TickCircle,
  Element3,
  Grid2,
  Add,
} from 'iconsax-react-native';
import {Screen} from '../../../navigation/navigation.type';
import {observer} from 'mobx-react-lite';
import {rootStore} from '../../../models/root-store';
import {ApiService} from '../../../services/api/customerAPI';
import {
  color,
  scaledSize,
  scaleHeight,
  scaleWidth,
  moderateScale,
} from '../../../utils';
import {Fonts} from '../../../assets';
import AsyncImage from '../../bottomTab/Product/AsyncImage';
import FastImage from 'react-native-fast-image';

// Define a type that captures essential customer properties
interface CustomerLike {
  _id: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  birthDate?: string | null;
  address: string;
  avatar?: string | null;
}

interface RouteParams {
  onSelect?: (customer: CustomerLike) => void;
}

const CustomerSelection = observer(() => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<Record<string, RouteParams>, string>>();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [localSearchResults, setLocalSearchResults] = useState<CustomerLike[]>(
    [],
  );
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);

  // Get customers from the store
  const customers = rootStore.customers.customerList;

  // Filter customers when search query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setIsSearchMode(false);
    } else {
      setIsSearchMode(true);
      const query = searchQuery.toLowerCase().trim();
      const filtered = customers.filter(
        (customer: any) =>
          customer.fullName.toLowerCase().includes(query) ||
          customer.phoneNumber.includes(query) ||
          (customer.email && customer.email.toLowerCase().includes(query)),
      );

      // Convert to plain objects to avoid MobX state tree mutations
      const plainResults = filtered.map((customer: any) => ({
        _id: customer._id,
        fullName: customer.fullName,
        phoneNumber: customer.phoneNumber,
        email: customer.email,
        birthDate: customer.birthDate,
        address: customer.address,
        avatar: customer.avatar,
      }));

      setLocalSearchResults(plainResults);
    }
  }, [searchQuery, customers]);

  // Load customers from API on component mount
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      // Sử dụng rootStore để fetch customers
      await rootStore.customers.fetchCustomers();

      if (rootStore.customers.error) {
        console.error('Failed to fetch customers:', rootStore.customers.error);
        Alert.alert(
          'Error',
          `Không thể tải danh sách khách hàng: ${rootStore.customers.error}`,
        );
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      Alert.alert('Error', 'Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Fallback to direct API call if store method fails
  const fetchCustomersDirectly = async () => {
    setLoading(true);
    try {
      // Sử dụng customerAPI trực tiếp
      const result = await ApiService.getCustomers();

      if (
        result.kind === 'ok' &&
        'customers' in result &&
        Array.isArray(result.customers)
      ) {
        // Cập nhật trực tiếp vào store
        rootStore.customers.setLoading(false);
        rootStore.customers.setError(null);
        rootStore.customers.customers.replace(result.customers);
      } else {
        console.error('Failed to fetch customers directly:', result);
        Alert.alert(
          'Error',
          'Không thể tải danh sách khách hàng. Vui lòng thử lại.',
        );
      }
    } catch (error) {
      console.error('Error directly fetching customers:', error);
      Alert.alert('Error', 'Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const toggleCustomerSelection = (customerId: string) => {
    setSelectedCustomer(prevSelected =>
      prevSelected === customerId ? null : customerId,
    );
  };

  const handleSelectCustomer = (customer: CustomerLike) => {
    setSelectedCustomer(customer._id);

    // Kiểm tra nếu có callback onSelect từ route.params
    if (route.params?.onSelect && typeof route.params.onSelect === 'function') {
      route.params.onSelect(customer);
      navigation.goBack();
    } else {
      console.error('onSelect callback not found in route.params');
      Alert.alert('Error', 'Không thể chọn khách hàng. Vui lòng thử lại.');
    }
  };

  const renderCustomerItem = ({
    item,
    index,
  }: {
    item: CustomerLike;
    index: number;
  }) => {
    const isSelected = selectedCustomer === item._id;

    // Create avatar URL with fallback if needed
    let avatarSource;
    if (item.avatar && item.avatar.trim() !== '' && item.avatar !== 'null') {
      avatarSource = item.avatar.startsWith('http')
        ? {uri: item.avatar}
        : {uri: `http://10.0.2.2:5000${item.avatar}`};
    } else {
      // Use placeholder
      avatarSource = null;
    }

    if (viewMode === 'grid') {
      // Grid view rendering
      return (
        <TouchableOpacity
          style={[
            styles.gridItem,
            isSelected && styles.selectedItem,
            {
              marginRight: (index + 1) % 3 !== 0 ? scaleWidth(8) : 0,
            },
          ]}
          onPress={() => handleSelectCustomer(item)}>
          <View style={styles.gridImageContainer}>
            {isSelected && <View style={styles.selectedOverlay} />}
            {avatarSource ? (
              <FastImage
                source={avatarSource}
                style={styles.gridImage}
                resizeMode={FastImage.resizeMode.cover}
              />
            ) : (
              <View style={[styles.gridImage, styles.avatarPlaceholder]}>
                <DynamicText style={styles.initialText}>
                  {item.fullName ? item.fullName[0].toUpperCase() : '?'}
                </DynamicText>
              </View>
            )}
          </View>

          <View style={styles.gridDetails}>
            <DynamicText style={styles.customerName} numberOfLines={1}>
              {item.fullName}
            </DynamicText>
            <DynamicText style={styles.customerPhone} numberOfLines={1}>
              {item.phoneNumber}
            </DynamicText>
            <DynamicText style={styles.customerEmail} numberOfLines={1}>
              {item.email || 'Chưa có email'}
            </DynamicText>
            {item.address && (
              <DynamicText style={styles.gridAddress} numberOfLines={2}>
                {item.address}
              </DynamicText>
            )}
          </View>
        </TouchableOpacity>
      );
    }

    // List view rendering - Redesigned layout
    return (
      <TouchableOpacity
        style={[styles.customerItem, isSelected && styles.selectedItem]}
        onPress={() => handleSelectCustomer(item)}>
        <View style={styles.customerRow}>
          <View style={styles.avatarContainer}>
            {avatarSource ? (
              <FastImage source={avatarSource} style={styles.customerAvatar} />
            ) : (
              <View style={[styles.customerAvatar, styles.avatarPlaceholder]}>
                <DynamicText style={styles.initialText}>
                  {item.fullName ? item.fullName[0].toUpperCase() : '?'}
                </DynamicText>
              </View>
            )}
          </View>

          <View style={styles.customerDetails}>
            <DynamicText style={styles.customerName} numberOfLines={1}>
              {item.fullName}
            </DynamicText>

            <View style={styles.customerInfo}>
              <DynamicText style={styles.customerPhone}>
                {item.phoneNumber}
              </DynamicText>

              {item.email && (
                <DynamicText style={styles.customerEmail} numberOfLines={1}>
                  {item.email}
                </DynamicText>
              )}

              {item.address && (
                <DynamicText style={styles.customerAddress} numberOfLines={2}>
                  {item.address}
                </DynamicText>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const handleCreateNewCustomer = () => {
    // Navigate to customer creation screen
    navigation.navigate(Screen.ADD_CUSTOMER, {
      onCustomerCreated: (newCustomer: CustomerLike) => {
        if (route.params?.onSelect) {
          route.params.onSelect(newCustomer);
        }
        navigation.navigate(Screen.CREATEORDER, {customer: newCustomer});
      },
    });
  };

  // Retry fetching if no customers and not loading
  useEffect(() => {
    if (!loading && customers.length === 0) {
      // Try direct API call as fallback
      fetchCustomersDirectly();
    }
  }, [loading, customers.length]);

  const displayedCustomers = isSearchMode ? localSearchResults : customers;
  const isCustomersEmpty = displayedCustomers.length === 0;
  const isLoading = loading || rootStore.customers.isLoading;

  const confirmSelection = () => {
    const customer = displayedCustomers.find(c => c._id === selectedCustomer);
    if (customer && route.params?.onSelect) {
      route.params.onSelect(customer);
      navigation.goBack();
    } else {
      Alert.alert('Thông báo', 'Vui lòng chọn một khách hàng');
    }
  };

  return (
    <BaseLayout>
      <Header
        title="Chọn khách hàng"
        showBackIcon
        onPressBack={() => navigation.goBack()}
      />

      {/* Search Bar and View Mode Toggle */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBarWrapper}>
          <Input
            inputType="default"
            placeholderText="Tìm kiếm theo tên, số điện thoại..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            showClearIcon={true}
            StartIcon={
              <SearchNormal1 size={20} color={color.accentColor.grayColor} />
            }
            inputContainerStyle={styles.searchInputContainer}
            inputStyle={styles.searchInputStyle as TextStyle}
          />
        </View>

        <TouchableOpacity
          style={styles.viewModeButton}
          onPress={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}>
          {viewMode === 'list' ? (
            <Grid2 size={20} color={color.primaryColor} variant="Bold" />
          ) : (
            <Element3 size={20} color={color.primaryColor} variant="Bold" />
          )}
        </TouchableOpacity>
      </View>

      {/* Customer List */}
      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={color.primaryColor} />
          <DynamicText style={styles.loadingText}>Đang tải...</DynamicText>
        </View>
      ) : (
        <FlatList
          key={viewMode} // Force re-render when view mode changes
          data={displayedCustomers as CustomerLike[]}
          renderItem={renderCustomerItem}
          keyExtractor={item => item._id}
          numColumns={viewMode === 'grid' ? 3 : 1}
          contentContainerStyle={[
            styles.customerList,
            isCustomersEmpty && styles.emptyListContainer,
            {paddingBottom: scaleHeight(80)},
            viewMode === 'grid' && styles.gridList,
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Profile2User size={60} color="#ddd" variant="Bold" />
              <DynamicText style={styles.emptyText}>
                {isSearchMode
                  ? 'Không tìm thấy khách hàng phù hợp'
                  : 'Chưa có khách hàng nào'}
              </DynamicText>
              {!isSearchMode && customers.length === 0 && (
                <Button
                  buttonContainerStyle={styles.retryButton}
                  title="Thử lại"
                  titleStyle={styles.retryText}
                  onPress={fetchCustomers}
                />
              )}
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={handleCreateNewCustomer}
        activeOpacity={0.8}>
        <Add size={32} color="#FFFFFF" variant="Linear" />
      </TouchableOpacity>
    </BaseLayout>
  );
});

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    padding: scaleWidth(16),
    alignItems: 'center',
    gap: scaleWidth(12),
    height: scaleHeight(100),
    marginBottom: scaleHeight(30),
  },
  viewModeButton: {
    width: scaleWidth(38),
    height: scaleWidth(38),
    borderRadius: moderateScale(8),
    backgroundColor: color.inputColor,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: 'rgba(0, 0, 0, 0.2)',
    borderWidth: 0.5,
  },
  searchBarWrapper: {
    flex: 1,
  },
  searchInputContainer: {
    height: scaleHeight(100),
    backgroundColor: color.inputColor,
    borderRadius: moderateScale(8),
  },
  searchInputStyle: {
    fontSize: scaledSize(20),
  },
  customerList: {
    paddingHorizontal: scaleWidth(16),
  },
  gridList: {
    paddingHorizontal: scaleWidth(16),
    paddingTop: scaleHeight(10),
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  customerItem: {
    backgroundColor: 'white',
    borderRadius: moderateScale(8),
    marginBottom: scaleHeight(16),
    padding: scaleWidth(10),
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    elevation: 1,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  customerDetails: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  customerInfo: {
    marginTop: scaleHeight(4),
  },
  customerName: {
    fontSize: scaledSize(22),
    fontFamily: Fonts.Inter_SemiBold,
    color: color.accentColor.darkColor,
  },
  customerPhone: {
    fontSize: scaledSize(18),
    fontFamily: Fonts.Inter_Regular,
    color: '#666',
    marginBottom: scaleHeight(2),
  },
  customerEmail: {
    fontSize: scaledSize(16),
    fontFamily: Fonts.Inter_Regular,
    color: '#999',
    marginBottom: scaleHeight(2),
  },
  customerAddress: {
    fontSize: scaledSize(16),
    fontFamily: Fonts.Inter_Regular,
    color: '#888',
    marginTop: scaleHeight(2),
  },
  checkboxContainer: {
    marginRight: scaleWidth(8),
  },
  checkbox: {
    width: scaleWidth(18),
    height: scaleWidth(18),
    borderRadius: moderateScale(4),
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedCheckbox: {
    backgroundColor: color.primaryColor,
    borderColor: color.primaryColor,
  },
  selectedItem: {
    backgroundColor: '#E1F5FE',
    borderColor: color.primaryColor,
    borderWidth: 1,
  },
  selectedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 153, 255, 0.3)',
    zIndex: 1,
  },
  gridCheckboxContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 2,
  },
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginStart: scaleWidth(4),
  },
  customerAvatar: {
    width: scaleWidth(56),
    height: scaleWidth(56),
    borderRadius: moderateScale(28),
    marginRight: scaleWidth(12),
  },
  avatarPlaceholder: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#ddd',
  },
  initialText: {
    fontSize: scaledSize(18),
    fontFamily: Fonts.Inter_SemiBold,
    color: '#999',
  },
  gridImageContainer: {
    width: '100%',
    height: scaleWidth(150),
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: moderateScale(8),
    borderTopRightRadius: moderateScale(8),
  },
  gridDetails: {
    padding: scaleWidth(6),
  },
  gridAddress: {
    fontSize: scaledSize(14),
    fontFamily: Fonts.Inter_Regular,
    color: '#888',
    marginTop: scaleHeight(2),
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: scaleHeight(150),
    paddingHorizontal: scaleWidth(16),
  },
  selectedInfo: {
    flex: 1,
  },
  selectedCount: {
    fontSize: scaledSize(20),
    fontFamily: Fonts.Inter_SemiBold,
    color: color.accentColor.darkColor,
  },
  confirmButton: {
    backgroundColor: color.primaryColor,
    borderRadius: moderateScale(8),
    paddingVertical: moderateScale(12),
    width: scaleWidth(120),
  },
  confirmButtonText: {
    fontSize: scaledSize(20),
    fontFamily: Fonts.Inter_SemiBold,
    color: 'white',
  },
  loadingBox: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: scaleWidth(150),
  },
  loadingText: {
    marginTop: scaleHeight(10),
    color: color.primaryColor,
    fontSize: scaledSize(16),
    fontFamily: Fonts.Inter_SemiBold,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: scaleHeight(60),
  },
  emptyText: {
    fontSize: scaledSize(16),
    fontFamily: Fonts.Inter_Regular,
    color: color.accentColor.grayColor,
    marginTop: scaleHeight(12),
    marginBottom: scaleHeight(12),
  },
  retryButton: {
    backgroundColor: color.primaryColor,
    paddingHorizontal: scaleWidth(20),
    marginTop: scaleHeight(10),
    height: scaleHeight(40),
    borderRadius: moderateScale(8),
  },
  retryText: {
    fontSize: scaledSize(16),
    color: '#FFF',
    fontFamily: Fonts.Inter_SemiBold,
  },
  floatingButton: {
    position: 'absolute',
    bottom: scaleHeight(40),
    right: scaleWidth(15),
    width: scaleWidth(36),
    height: scaleWidth(36),
    borderRadius: scaleWidth(8),
    backgroundColor: color.primaryColor,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 999,
  },
  gridItem: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: moderateScale(10),
    marginBottom: scaleHeight(20),
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.01)',
    overflow: 'hidden',
    elevation: 1,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowColor: 'rgba(0, 0, 0, 0.01)',
    width: `${100 / 3 - 2}%`,
  },
});

export default CustomerSelection;
