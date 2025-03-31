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
import { useNavigation, useRoute } from '@react-navigation/native';
import { BaseLayout, Header } from '../../../components';
import Icon from 'react-native-vector-icons/Ionicons';
import { create } from 'apisauce';
import { ApiEndpoint } from '../../../services/api/api-endpoint';
import { Screen } from '../../../navigation/navigation.type';

const CustomerSelection = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Filter customers when search query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCustomers(customers);
    } else {
      const query = searchQuery.toLowerCase().trim();
      const filtered = customers.filter(customer =>
        customer.fullName.toLowerCase().includes(query) || 
        customer.phoneNumber.includes(query) || 
        (customer.email && customer.email.toLowerCase().includes(query))
      );
      setFilteredCustomers(filtered);
    }
  }, [searchQuery, customers]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      // Create API instance
      const api = create({
        baseURL: "http://10.0.2.2:3000",
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });

      // Fetch customers
      const response = await api.get(ApiEndpoint.CUSTOMERS);
      
      if (response.ok) {
        const customersData = response.data?.data || [];
        setCustomers(customersData);
        setFilteredCustomers(customersData);
      } else {
        console.error('Failed to fetch customers:', response.problem);
        Alert.alert('Error', 'Failed to load customers. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCustomer = (customer) => {
    // Navigate back to CreateOrderScreen with selected customer
    if (route.params?.onSelect) {
      route.params.onSelect(customer);
    }
    navigation.goBack();
  };

  const renderCustomerItem = ({ item }) => (
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
    navigation.navigate(Screen.ADD_CUSTOMER, { 
      onCustomerCreated: (newCustomer) => {
        if (route.params?.onSelect) {
          route.params.onSelect(newCustomer);
        }
        navigation.navigate(Screen.CREATEORDER, { customer: newCustomer });
      }
    });
  };

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
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      ) : (
        <FlatList
          data={filteredCustomers}
          renderItem={renderCustomerItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.customerList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="people-outline" size={60} color="#ddd" />
              <Text style={styles.emptyText}>Không tìm thấy khách hàng</Text>
            </View>
          }
        />
      )}
    </BaseLayout>
  );
};

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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CustomerSelection; 