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
  AddCircle,
  ArrowRight2,
  Profile2User,
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

  const handleSelectCustomer = (customer: CustomerLike) => {
    // Kiểm tra nếu có callback onSelect từ route.params
    if (route.params?.onSelect && typeof route.params.onSelect === 'function') {
      route.params.onSelect(customer);
      navigation.goBack();
    } else {
      console.error('onSelect callback not found in route.params');
      Alert.alert('Error', 'Không thể chọn khách hàng. Vui lòng thử lại.');
    }
  };

  const renderCustomerItem = ({item}: {item: CustomerLike}) => (
    <TouchableOpacity
      style={styles.customerItem}
      onPress={() => handleSelectCustomer(item)}>
      <AsyncImage
        source={{uri: item.avatar || 'https://via.placeholder.com/50'}}
        style={styles.customerAvatar}
      />

      <View style={styles.customerDetails}>
        <DynamicText style={styles.customerName}>{item.fullName}</DynamicText>
        <DynamicText style={styles.customerPhone}>
          {item.phoneNumber}
        </DynamicText>
        {item.email && (
          <DynamicText style={styles.customerEmail}>{item.email}</DynamicText>
        )}
      </View>

      <ArrowRight2 size={20} color="#ccc" variant="Linear" />
    </TouchableOpacity>
  );

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

  return (
    <BaseLayout>
      <Header
        title="Chọn khách hàng"
        showBackIcon
        onPressBack={() => navigation.goBack()}
      />

      {/* Search Bar */}
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
      </View>

      {/* New Customer Button */}
      <TouchableOpacity
        style={styles.newCustomerButton}
        onPress={handleCreateNewCustomer}>
        <AddCircle size={24} color={color.primaryColor} variant="Bold" />
        <DynamicText style={styles.newCustomerText}>
          Thêm khách hàng mới
        </DynamicText>
      </TouchableOpacity>

      {/* Customer List */}
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={color.primaryColor} />
          <DynamicText style={styles.loaderText}>
            Đang tải danh sách khách hàng...
          </DynamicText>
        </View>
      ) : (
        <FlatList
          data={displayedCustomers as CustomerLike[]}
          renderItem={renderCustomerItem}
          keyExtractor={item => item._id}
          contentContainerStyle={[
            styles.customerList,
            isCustomersEmpty && styles.emptyListContainer,
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
    </BaseLayout>
  );
});

const styles = StyleSheet.create({
  searchContainer: {
    padding: scaleWidth(16),
  },
  searchBarWrapper: {
    flex: 1,
  },
  searchInputContainer: {
    height: scaleHeight(50),
    backgroundColor: '#f0f0f0',
  },
  searchInputStyle: {
    fontSize: scaledSize(16),
  },
  newCustomerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    padding: scaleWidth(16),
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  newCustomerText: {
    marginLeft: scaleWidth(12),
    fontSize: scaledSize(16),
    fontFamily: Fonts.Inter_SemiBold,
    color: color.primaryColor,
  },
  customerList: {
    padding: 0,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  customerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.accentColor.whiteColor,
    padding: scaleWidth(16),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  customerAvatar: {
    width: scaleWidth(50),
    height: scaleWidth(50),
    borderRadius: moderateScale(25),
    marginRight: scaleWidth(16),
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: scaledSize(18),
    fontFamily: Fonts.Inter_SemiBold,
    color: '#000',
    marginBottom: scaleHeight(4),
  },
  customerPhone: {
    fontSize: scaledSize(16),
    fontFamily: Fonts.Inter_Regular,
    color: '#666',
  },
  customerEmail: {
    fontSize: scaledSize(14),
    fontFamily: Fonts.Inter_Regular,
    color: '#999',
    marginTop: scaleHeight(2),
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: scaleHeight(12),
    fontSize: scaledSize(16),
    fontFamily: Fonts.Inter_Regular,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: scaleHeight(60),
  },
  emptyText: {
    fontSize: scaledSize(16),
    fontFamily: Fonts.Inter_Regular,
    color: '#999',
    marginTop: scaleHeight(12),
    marginBottom: scaleHeight(12),
  },
  retryButton: {
    paddingHorizontal: scaleWidth(20),
    paddingVertical: scaleHeight(10),
    height: 'auto',
    marginTop: scaleHeight(12),
  },
  retryText: {
    fontSize: scaledSize(16),
  },
});

export default CustomerSelection;
