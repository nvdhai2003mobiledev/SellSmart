import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { BaseLayout, Header } from '../../../components';
import Icon from 'react-native-vector-icons/Ionicons';
import { Screen } from '../../../navigation/navigation.type';
import { observer } from 'mobx-react-lite';
import { rootStore } from '../../../models/root-store';
import { ApiService } from '../../../services/api/customerAPI';

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
  const navigation = useNavigation();
  const route = useRoute<RouteProp<Record<string, RouteParams>, string>>();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [localSearchResults, setLocalSearchResults] = useState<CustomerLike[]>([]);
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
      const filtered = customers.filter(customer =>
        customer.fullName.toLowerCase().includes(query) || 
        customer.phoneNumber.includes(query) || 
        (customer.email && customer.email.toLowerCase().includes(query))
      );
      
      // Convert to plain objects to avoid MobX state tree mutations
      const plainResults = filtered.map(customer => ({
        _id: customer._id,
        fullName: customer.fullName,
        phoneNumber: customer.phoneNumber,
        email: customer.email,
        birthDate: customer.birthDate,
        address: customer.address,
        avatar: customer.avatar
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
        Alert.alert('Error', `Không thể tải danh sách khách hàng: ${rootStore.customers.error}`);
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
      
      if (result.kind === 'ok' && 'customers' in result && Array.isArray(result.customers)) {
        // Cập nhật trực tiếp vào store
        rootStore.customers.setLoading(false);
        rootStore.customers.setError(null);
        rootStore.customers.customers.replace(result.customers);
      } else {
        console.error('Failed to fetch customers directly:', result);
        Alert.alert('Error', 'Không thể tải danh sách khách hàng. Vui lòng thử lại.');
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

  const renderCustomerItem = ({ item }: { item: CustomerLike }) => (
    <TouchableOpacity
      style={styles.customerItem}
      onPress={() => handleSelectCustomer(item)}
    >
      <Image
        source={{ uri: item.avatar || 'https://via.placeholder.com/50' }}
        style={styles.customerAvatar}
      />
      
      <View style={styles.customerDetails}>
        <Text style={styles.customerName}>{item.fullName}</Text>
        <Text style={styles.customerPhone}>{item.phoneNumber}</Text>
        {item.email && <Text style={styles.customerEmail}>{item.email}</Text>}
      </View>
      
      <Icon name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  const handleCreateNewCustomer = () => {
    // Navigate to customer creation screen
    // @ts-ignore - Bypass type checking for navigation
    navigation.navigate(Screen.ADD_CUSTOMER, { 
      onCustomerCreated: (newCustomer: CustomerLike) => {
        if (route.params?.onSelect) {
          route.params.onSelect(newCustomer);
        }
        // @ts-ignore - Bypass type checking for navigation
        navigation.navigate(Screen.CREATEORDER, { customer: newCustomer });
      }
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
        <View style={styles.searchBar}>
          <Icon name="search-outline" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm theo tên, số điện thoại..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {/* New Customer Button */}
      <TouchableOpacity style={styles.newCustomerButton} onPress={handleCreateNewCustomer}>
        <Icon name="add-circle" size={24} color="#007AFF" />
        <Text style={styles.newCustomerText}>Thêm khách hàng mới</Text>
      </TouchableOpacity>
      
      {/* Customer List */}
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loaderText}>Đang tải danh sách khách hàng...</Text>
        </View>
      ) : (
        <FlatList
          data={displayedCustomers as CustomerLike[]}
          renderItem={renderCustomerItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={[
            styles.customerList,
            isCustomersEmpty && styles.emptyListContainer
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="people-outline" size={60} color="#ddd" />
              <Text style={styles.emptyText}>
                {isSearchMode 
                  ? 'Không tìm thấy khách hàng phù hợp'
                  : 'Chưa có khách hàng nào'}
              </Text>
              {!isSearchMode && customers.length === 0 && (
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={fetchCustomers}
                >
                  <Text style={styles.retryText}>Thử lại</Text>
                </TouchableOpacity>
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
    padding: 16,
  },
  searchBar: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  newCustomerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  newCustomerText: {
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
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
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 16,
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  customerPhone: {
    fontSize: 13,
    color: '#666',
  },
  customerEmail: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CustomerSelection; 