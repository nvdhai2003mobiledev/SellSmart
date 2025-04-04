import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Keyboard,
} from 'react-native';
import {RootStackParamList, Screen} from '../../../navigation/navigation.type';
import { useNavigation, useRoute } from '@react-navigation/native';
import { observer } from 'mobx-react-lite';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { BaseLayout, Header, DynamicText } from '../../../components';
import { rootStore } from '../../../models/root-store';
import { color, moderateScale, scaledSize } from '../../../utils';
import { Order } from '../../../models/Order/Order';

const OrderListScreen = observer(() => {
  const navigation = useNavigation();
  const route = useRoute();
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [currentFilter, setCurrentFilter] = useState<any>(null);

  useEffect(() => {
    // Check for filter from navigation params
    const filterFromParams = route.params?.filter;
    if (filterFromParams) {
      setCurrentFilter(filterFromParams);
    }
    
    fetchOrders();
  }, [route.params?.filter]);

  const fetchOrders = async () => {
    try {
      await rootStore.orders.fetchOrders();
      
      // Sort orders by creation date in descending order (newest first)
      const sortedOrders = [...rootStore.orders.orders].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      // Apply filter if exists
      let processedOrders = sortedOrders;
      
      // Check for status parameter (for canceled orders)
      if (route.params?.status) {
        processedOrders = sortedOrders.filter(order => order.status === route.params?.status);
      }
      // Apply full filter if exists
      else if (route.params?.filter) {
        processedOrders = applyFilter(sortedOrders, route.params.filter);
      }
      
      setOrders(sortedOrders);
      setFilteredOrders(processedOrders);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setIsLoading(false);
    }
  };

  // Filter function
  const applyFilter = (orderList: Order[], filter: any) => {
    return orderList.filter(order => {
      // Payment Status Filter
      if (filter.paymentStatus && order.paymentStatus !== filter.paymentStatus) {
        return false;
      }

      // Order Status Filter
      if (filter.orderStatus && order.status !== filter.orderStatus) {
        return false;
      }

      // Date Range Filter
      const orderDate = new Date(order.createdAt);
      if (filter.startDate) {
        const startDate = new Date(filter.startDate);
        if (orderDate < startDate) return false;
      }
      if (filter.endDate) {
        const endDate = new Date(filter.endDate);
        if (orderDate > endDate) return false;
      }

      return true;
    });
  };

  const handleSearch = () => {
    // Dismiss keyboard
    Keyboard.dismiss();

    // If search query is empty, show filtered orders
    if (!searchQuery.trim()) {
      setFilteredOrders(
        currentFilter 
          ? applyFilter(orders, currentFilter) 
          : orders
      );
      return;
    }

    // Convert search query to lowercase for case-insensitive search
    const query = searchQuery.trim().toLowerCase();

    // Filter orders based on various criteria
    const searchResult = orders.filter(order => 
      // Search by last 4 digits of orderID
      order.orderID.slice(-4).includes(query) ||
      
      // Search by customer name (case-insensitive)
      order.customerID.fullName.toLowerCase().includes(query) ||
      
      // Search by customer phone number
      order.customerID.phoneNumber.includes(query)
    );

    // Apply additional filter if exists
    const finalFilteredOrders = currentFilter 
      ? applyFilter(searchResult, currentFilter)
      : searchResult;

    setFilteredOrders(finalFilteredOrders);
  };

    const navigateToOrderScreen = (status?: string) => {
      navigation.navigate(Screen.BOTTOM_TAB, { status });
    };
  // Navigate to Filter Screen
  const navigateToFilterScreen = () => {
    navigation.navigate(Screen.FILTERORDER, { 
      existingFilter: currentFilter 
    });
  };

  const renderOrderItem = ({ item }: { item: Order }) => {
    const truncatedOrderId = item.orderID.slice(-4);
    return(
    <TouchableOpacity 
      style={styles.orderItem}
      onPress={() => navigation.navigate(Screen.ORDER_DETAIL, { orderId: item._id })}
    >
      <View style={styles.orderHeader}>
        <DynamicText style={styles.orderNumber}>
          #{truncatedOrderId}
        </DynamicText>
        <DynamicText style={styles.orderAmount}>
          {item.totalAmount.toLocaleString()}đ
        </DynamicText>
      </View>
      <View style={styles.orderDetails}>
        <DynamicText style={styles.customerName}>
          {item.customerID.fullName}
        </DynamicText>
        <DynamicText style={styles.orderDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </DynamicText>
      </View><View style={styles.orderStatus}>
        <DynamicText 
          style={[
            styles.statusText, 
            {
              color: 
                item.status === 'pending' ? color.primaryColor :
                item.status === 'processing' ? '#FFA500' :
                item.status === 'shipping' ? '#4169E1' :
                item.status === 'delivered' ? 'green' :
                item.status === 'canceled' ? 'red' : color.accentColor.grayColor
            }
          ]}
        >
          {item.status === 'pending' ? 'Chưa xử lý' :
           item.status === 'processing' ? 'Đã xử lý' :
           item.status === 'canceled' ? 'Đã hủy' : item.status}
        </DynamicText>
      </View>
    </TouchableOpacity>
  )};

  if (isLoading) {
    return (
      <BaseLayout>
        <Header title="Danh sách đơn hàng" showBackIcon onPressBack={()=>  navigateToOrderScreen()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator 
            size="large" 
            color={color.primaryColor} 
          />
        </View>
      </BaseLayout>
    );
  }

  return (
    <BaseLayout>
      <Header title="Danh sách đơn hàng" showBackIcon onPressBack={()=>  navigateToOrderScreen()} />
      
      {/* Search Input with Filter Icon */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm (Mã, Tên, SĐT)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          <TouchableOpacity 
            style={styles.filterIconContainer}
            onPress={navigateToFilterScreen}
          >
            <Ionicons 
              name="filter" 
              size={moderateScale(10)} 
              color={currentFilter ? color.primaryColor : color.accentColor.grayColor} 
            />
            {currentFilter && (
              <View style={styles.filterActiveIndicator} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredOrders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item._id}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <DynamicText style={styles.emptyText}>
              {searchQuery.trim() || currentFilter 
                ? 'Không tìm thấy đơn hàng phù hợp' 
                : 'Không có đơn hàng nào'}
            </DynamicText>
          </View>
        }
        contentContainerStyle={styles.listContainer}
      />
    </BaseLayout>
  );
});

const styles = StyleSheet.create({
  listContainer: {
    paddingHorizontal: moderateScale(16),
    paddingTop: moderateScale(10),
    paddingBottom: moderateScale(70),
  },
  searchContainer: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(10),
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    fontSize: moderateScale(10),
    marginRight: moderateScale(8),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterIconContainer: {
    position: 'relative',
    padding: moderateScale(4),
  },
  filterActiveIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: moderateScale(4),
    height: moderateScale(4),
    borderRadius: moderateScale(2),
    backgroundColor: color.primaryColor,
  },
  orderItem: {
    backgroundColor: 'white',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginBottom: moderateScale(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: moderateScale(8),
  },
  orderNumber: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: color.accentColor.darkColor,
  },
  orderAmount: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: color.primaryColor,
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: moderateScale(8),
  },
  customerName: {
    fontSize: moderateScale(13),
    color: color.accentColor.darkColor,
  },
  orderDate: {
    fontSize: moderateScale(13),
    color: color.accentColor.grayColor,
  },
  orderStatus: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: moderateScale(13),
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: moderateScale(50),
  },
  emptyText: {
    fontSize: moderateScale(13),
    color: color.accentColor.grayColor,
  },
});

export default OrderListScreen;