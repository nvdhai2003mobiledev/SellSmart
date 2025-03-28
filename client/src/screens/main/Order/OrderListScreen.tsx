import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { observer } from 'mobx-react-lite';
import { BaseLayout, Header, DynamicText } from '../../../components';
import { rootStore } from '../../../models/root-store';
import { color, moderateScale, scaledSize } from '../../../utils';
import { Order } from '../../../models/Order/Order';

const OrderListScreen = observer(() => {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      await rootStore.orders.fetchOrders();
      
      // Sort orders by creation date in descending order (newest first)
      const sortedOrders = [...rootStore.orders.orders].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setOrders(sortedOrders);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setIsLoading(false);
    }
  };

  const renderOrderItem = ({ item }: { item: Order }) => {
    const truncatedOrderId = item.orderID.slice(-4);
    return(
    <TouchableOpacity style={styles.orderItem}>
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
      </View>
      <View style={styles.orderStatus}>
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
           item.status === 'processing' ? 'Đang xử lý' :
           item.status === 'shipping' ? 'Đang giao' :
           item.status === 'delivered' ? 'Đã giao' :
           item.status === 'canceled' ? 'Đã hủy' : item.status}
        </DynamicText>
      </View>
    </TouchableOpacity>
  )};

  if (isLoading) {
    return (
      <BaseLayout>
        <Header title="Danh sách đơn hàng" showBackIcon onPressBack={()=> navigation.goBack()} />
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
      <Header title="Danh sách đơn hàng" showBackIcon onPressBack={()=> navigation.goBack()} />
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item._id}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <DynamicText style={styles.emptyText}>
              Không có đơn hàng nào
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
    paddingBottom:moderateScale(20)
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
    fontSize: moderateScale(8),
    fontWeight: '600',
    color: color.accentColor.darkColor,
  },
  orderAmount: {
    fontSize: moderateScale(8),
    fontWeight: '600',
    color: color.primaryColor,
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: moderateScale(8),
  },
  customerName: {
    fontSize: moderateScale(6),
    color: color.accentColor.darkColor,
  },
  orderDate: {
    fontSize: moderateScale(6),
    color: color.accentColor.grayColor,
  },
  orderStatus: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: moderateScale(6),
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
    fontSize: moderateScale(6),
    color: color.accentColor.grayColor,
  },
});

export default OrderListScreen;