import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Keyboard,
  RefreshControl,
} from 'react-native';
import {RootStackParamList, Screen} from '../../../navigation/navigation.type';
import {useNavigation, useRoute, NavigationProp, RouteProp} from '@react-navigation/native';
import {observer} from 'mobx-react-lite';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {BaseLayout, Header, DynamicText} from '../../../components';
import {color, moderateScale} from '../../../utils';
import { fetchPaginatedOrders } from '../../../services/api/ordersApi';

// Define route params interface
interface OrderListRouteParams {
  filter?: any;
  status?: string;
}

const OrderListScreen = observer(() => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<{params: OrderListRouteParams}, 'params'>>();
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [currentFilter, setCurrentFilter] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const ITEMS_PER_PAGE = 15;

  const fetchOrders = useCallback(async (loadMore = false) => {
    try {
      if (!loadMore) {
        setIsLoading(true);
        setPage(1);
      } else {
        setLoadingMore(true);
      }

      // Get the current page to fetch
      const pageToFetch = loadMore ? page + 1 : 1;
      
      // Prepare filters based on route params
      const apiFilters: any = {
        // By default we exclude draft orders unless specifically requested
        includeDrafts: false
      };
      
      // If viewing draft orders specifically
      if (route.params?.status === 'draft') {
        // If looking specifically for drafts, set status filter
        apiFilters.status = 'draft';
        // And include drafts in the results
        apiFilters.includeDrafts = true;
      } 
      // For all other cases, exclude draft orders and check for payment status
      else {
        // Check for payment status parameter
        if (route.params?.status) {
          apiFilters.paymentStatus = route.params.status;
        }
        // Apply full filter if exists
        else if (route.params?.filter) {
          // Map route filter to API filter format
          if (route.params.filter.paymentStatus) {
            apiFilters.paymentStatus = route.params.filter.paymentStatus;
          }
          if (route.params.filter.orderStatus) {
            apiFilters.status = route.params.filter.orderStatus;
          }
          if (route.params.filter.startDate) {
            apiFilters.startDate = route.params.filter.startDate;
          }
          if (route.params.filter.endDate) {
            apiFilters.endDate = route.params.filter.endDate;
          }
        }
      }

      console.log(`Fetching orders with filters:`, apiFilters);
      
      // Fetch paginated orders from the API
      const result = await fetchPaginatedOrders(pageToFetch, ITEMS_PER_PAGE, apiFilters);
      
      console.log(`Received ${result.orders.length} orders. Page ${result.page} of ${result.totalPages}. Has more: ${result.hasMore}`);
      
      if (result.orders.length === 0 && pageToFetch > 1) {
        // If we didn't get any orders but we're past page 1, there might be a pagination issue
        console.log("No orders returned for this page, setting hasMore to false");
        setHasMore(false);
        setLoadingMore(false);
        return;
      }
      
      // Update pagination state
      setPage(result.page);
      setHasMore(result.hasMore);
      
      // Handle search if there's a search query
      let displayedOrders = result.orders;
      if (searchQuery.trim()) {
        displayedOrders = result.orders.filter(
          order => 
            order.orderID.slice(-4).includes(searchQuery.trim()) ||
            (order.customerID?.fullName || '').toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
            (order.customerID?.phoneNumber || '').includes(searchQuery.trim())
        );
      }
      
      if (loadMore) {
        // Append new orders to existing filtered orders
        setFilteredOrders(prev => [...prev, ...displayedOrders]);
        // Also update the full orders list
        setOrders(prev => [...prev, ...result.orders]);
      } else {
        // Replace orders with new results
        setFilteredOrders(displayedOrders);
        // Also update the full orders list
        setOrders(result.orders);
      }

      setIsLoading(false);
      setLoadingMore(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setIsLoading(false);
      setLoadingMore(false);
      setHasMore(false); // Stop trying to load more on error
    }
  }, [page, route.params, searchQuery]);

  useEffect(() => {
    // Check for filter from navigation params
    const filterFromParams = route.params?.filter;
    if (filterFromParams) {
      setCurrentFilter(filterFromParams);
    }

    // Chỉ gọi fetch khi khởi tạo màn hình
    fetchOrders();
    // Loại bỏ fetchOrders để không tự động gọi lại mỗi khi route.params thay đổi
  }, [route.params?.filter]);

  useEffect(() => {
    // When search query changes, filter the already fetched orders locally
    // instead of fetching from server
    if (orders.length > 0) {
      if (!searchQuery.trim()) {
        // If search is cleared, show all orders from current page
        setFilteredOrders(orders);
      } else {
        // Filter based on search query
        const filtered = orders.filter(
          order => 
            (order.orderID && order.orderID.slice(-4).includes(searchQuery.trim())) ||
            (order.customerID?.fullName || '').toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
            (order.customerID?.phoneNumber || '').includes(searchQuery.trim())
        );
        setFilteredOrders(filtered);
      }
    }
  }, [searchQuery, orders]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }, [fetchOrders]);

  const loadMoreOrders = () => {
    if (!loadingMore && hasMore) {
      fetchOrders(true);
    }
  };

  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.footerContainer}>
          <ActivityIndicator size="small" color={color.primaryColor} />
        </View>
      );
    }
    
    if (hasMore) {
      return (
        <View style={styles.footerContainer}>
          <TouchableOpacity
            style={styles.loadMoreButton}
            onPress={() => {
              console.log('Load more button pressed');
              loadMoreOrders();
            }}>
            <DynamicText style={styles.loadMoreText}>Xem thêm</DynamicText>
          </TouchableOpacity>
        </View>
      );
    }
    
    // Don't render anything if there's no more data
    return null;
  };

  const handleSearch = () => {
    // Dismiss keyboard
    Keyboard.dismiss();
    
    // Tìm kiếm cục bộ từ danh sách đã có
    if (!searchQuery.trim()) {
      // Nếu xóa tìm kiếm, hiển thị lại tất cả đơn hàng hiện tại
      setFilteredOrders(orders);
    } else {
      // Lọc dựa trên từ khóa tìm kiếm
      const filtered = orders.filter(
        order => 
          (order.orderID && order.orderID.slice(-4).includes(searchQuery.trim())) ||
          (order.customerID?.fullName || '').toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
          (order.customerID?.phoneNumber || '').includes(searchQuery.trim())
      );
      setFilteredOrders(filtered);
    }
    
    // Không cần reset trang hoặc tải lại từ API
    // setPage(1);
    // fetchOrders();
  };

  const navigateToOrderScreen = (status?: string) => {
    // @ts-ignore - ignore navigation type error
    navigation.navigate(Screen.BOTTOM_TAB, {status});
  };
  
  // Navigate to Filter Screen
  const navigateToFilterScreen = () => {
    // @ts-ignore - ignore navigation type error
    navigation.navigate(Screen.FILTERORDER, {
      existingFilter: currentFilter,
    });
  };

  const renderOrderItem = ({item}: {item: any}) => {
    const truncatedOrderId = item.orderID.slice(-4);
    return (
      <TouchableOpacity
        style={styles.orderItem}
        onPress={() =>
          // @ts-ignore - ignore navigation type error
          navigation.navigate(Screen.ORDER_DETAIL, {orderId: item._id})
        }>
        <View style={styles.orderHeader}>
          <DynamicText style={styles.orderNumber}>
            #{truncatedOrderId}
          </DynamicText>
          <DynamicText style={styles.orderAmount}>
            {item.totalAmount.toLocaleString()}đ
          </DynamicText>
        </View>
        <View style={styles.orderDetails}>
          <View>
            <DynamicText style={styles.customerName}>
              {item.customerID.fullName}
            </DynamicText>
            <DynamicText style={styles.customerPhone}>
              {item.customerID.phoneNumber}
            </DynamicText>
          </View>
          <DynamicText style={styles.orderDate}>
            {new Date(item.createdAt).toLocaleDateString()}
          </DynamicText>
        </View>
        <View style={styles.statusContainer}>
          <View style={styles.paymentStatusWrapper}>
            <DynamicText style={[
              styles.paymentStatusText,
              {
                color:
                  item.paymentStatus === 'paid'
                    ? 'green'
                    : item.paymentStatus === 'partpaid'
                    ? '#FF8C00'
                    : item.paymentStatus === 'unpaid'
                    ? '#FFB74D'
                    : color.accentColor.errorColor,
              },
            ]}>
              {item.paymentStatus === 'paid'
                ? 'Đã thanh toán'
                : item.paymentStatus === 'partpaid'
                ? 'Thanh toán một phần'
                : item.paymentStatus === 'unpaid'
                ? 'Chưa thanh toán'
                : 'Hoàn tiền'}
            </DynamicText>
          </View>
          <DynamicText
            style={[
              styles.statusText,
              {
                color:
                  item.status === 'pending'
                    ? color.primaryColor
                    : item.status === 'waiting'
                    ? '#FFB74D'
                    : item.status === 'processing'
                    ? '#FFA500'
                    : item.status === 'shipping'
                    ? '#4169E1'
                    : item.status === 'delivered'
                    ? 'green'
                    : item.status === 'canceled'
                    ? 'red'
                    : color.accentColor.grayColor,
              },
            ]}>
            {item.status === 'pending'
              ? 'Chưa xử lý'
              : item.status === 'waiting'
              ? 'Chờ xử lý'
              : item.status === 'processing'
              ? 'Đã xử lý'
              : item.status === 'canceled'
              ? 'Đã hủy'
              : item.status}
          </DynamicText>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <BaseLayout>
        <Header
          title="Danh sách hóa đơn"
          showBackIcon
          onPressBack={() => navigateToOrderScreen()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={color.primaryColor} />
        </View>
      </BaseLayout>
    );
  }

  return (
    <BaseLayout>
      <Header
        title="Danh sách Hóa đơn"
        showBackIcon
        onPressBack={() => navigateToOrderScreen()}
      />

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
            onPress={navigateToFilterScreen}>
            <Ionicons
              name="filter"
              size={moderateScale(10)}
              color={
                currentFilter ? color.primaryColor : color.accentColor.grayColor
              }
            />
            {currentFilter && <View style={styles.filterActiveIndicator} />}
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredOrders}
        renderItem={renderOrderItem}
        keyExtractor={item => item._id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[color.primaryColor]}
            tintColor={color.primaryColor}
          />
        }
        onEndReached={null}
        onEndReachedThreshold={0.3}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <DynamicText style={styles.emptyText}>
              {searchQuery.trim() || currentFilter
                ? 'Không tìm thấy Hóa đơn phù hợp'
                : 'Không có Hóa đơn nào'}
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
    shadowOffset: {width: 0, height: 2},
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
    shadowOffset: {width: 0, height: 2},
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
  customerPhone: {
    fontSize: moderateScale(12),
    color: color.accentColor.grayColor,
    marginTop: moderateScale(2),
  },
  orderDate: {
    fontSize: moderateScale(13),
    color: color.accentColor.grayColor,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentStatusWrapper: {
    flex: 1,
  },
  paymentStatusText: {
    fontSize: moderateScale(12),
    fontWeight: '500',
  },
  orderStatus: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: moderateScale(13),
    fontWeight: '500',
    textAlign: 'right',
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
  footerContainer: {
    paddingVertical: moderateScale(20),
    alignItems: 'center',
  },
  loadMoreButton: {
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(10),
    backgroundColor: color.primaryColor,
    borderRadius: moderateScale(8),
  },
  loadMoreText: {
    color: 'white',
    fontSize: moderateScale(14),
    fontWeight: '500',
  },
});

export default OrderListScreen;
