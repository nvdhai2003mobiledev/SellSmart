import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { observer } from 'mobx-react-lite';
import { BaseLayout, Header, DynamicText } from '../../../components';
import { color, moderateScale } from '../../../utils';
import { rootStore } from '../../../models/root-store';
import { format } from 'date-fns';

interface TimelineEvent {
  id: string;
  time: string;
  date: string;
  title: string;
  description: string;
  actor?: string;
  type: 'creation' | 'payment' | 'status_change' | 'refund';
  // Additional payment details
  paymentDetails?: {
    amount: number;
    method: string;
    paymentDate: Date;
    totalAmount?: number;
    remainingAmount?: number;
    isFullyPaid?: boolean;
  };
}

const OrderHistoryScreen = observer(() => {
  const navigation = useNavigation();
  const route = useRoute();
  const { orderId, orderNumber } = route.params as { orderId: string; orderNumber: string };
  
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  // Track expanded payment items
  const [expandedPaymentIds, setExpandedPaymentIds] = useState<string[]>([]);
  
  const navigateBack = () => {
    navigation.goBack();
  };
  
  // Toggle expanded state for payment items
  const togglePaymentDetails = (eventId: string) => {
    setExpandedPaymentIds(prev => {
      if (prev.includes(eventId)) {
        return prev.filter(id => id !== eventId);
      } else {
        return [...prev, eventId];
      }
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + 'đ';
  };
  
  // Fetch order details and construct timeline events
  useEffect(() => {
    const loadOrderHistory = async () => {
      try {
        setLoading(true);
        // Find order in store
        const order = rootStore.orders.orders.find((o: any) => o._id === orderId);
        
        if (order) {
          const timelineEvents: TimelineEvent[] = [];
          
          // Add order creation event
          const creationDate = new Date(order.createdAt);
          timelineEvents.push({
            id: `creation-${order._id}`,
            time: format(creationDate, 'HH:mm'),
            date: format(creationDate, 'dd/MM/yyyy'),
            title: 'Đã tạo đơn hàng',
            description: `Đã tạo đơn hàng từ đơn hàng nhập #${order.orderID.slice(-4)}`,
            actor: order.employeeID?.fullName || rootStore.auth.userFullName || 'Admin',
            type: 'creation'
          });
          
          // Add events based on paymentDetails if available
          if (order.paymentDetails && order.paymentDetails.length > 0) {
            // Calculate running total for each payment
            let runningTotal = 0;
            
            order.paymentDetails.forEach((payment: any, index: number) => {
              const paymentDate = new Date(payment.date);
              const isRefund = payment.isRefund;
              
              // Update running total
              runningTotal += payment.amount;
              const remainingAmount = order.totalAmount - runningTotal;
              const isFullyPaid = runningTotal >= order.totalAmount;
              
              timelineEvents.push({
                id: `payment-${index}`,
                time: format(paymentDate, 'HH:mm'),
                date: format(paymentDate, 'dd/MM/yyyy'),
                title: isRefund ? 'Đã hoàn lại tiền' : 'Đã xác nhận khoản thanh toán',
                description: `${isRefund ? 'Đã hoàn lại' : 'Đã xác nhận khoản thanh toán'} ${payment.amount.toLocaleString()} VND thông qua ${
                  payment.method === 'cash' ? 'Tiền mặt' : 
                  payment.method === 'credit card' ? 'Thẻ tín dụng' : 
                  payment.method === 'debit card' ? 'Thẻ ghi nợ' : 
                  payment.method === 'e-wallet' ? 'Ví điện tử' : payment.method
                }`,
                actor: order.employeeID?.fullName || rootStore.auth.userFullName || 'Admin',
                type: isRefund ? 'refund' : 'payment',
                paymentDetails: {
                  amount: payment.amount,
                  method: payment.method,
                  paymentDate: paymentDate,
                  totalAmount: order.totalAmount,
                  remainingAmount: remainingAmount > 0 ? remainingAmount : 0,
                  isFullyPaid: isFullyPaid
                }
              });
            });
          }
          
          // Add status change events
          // Note: This is a simplified implementation - in a real app, you'd have a status history
          // Here we're creating a synthetic history based on current status
          if (order.status === 'waiting') {
            // Order is partially paid and waiting
            const waitingDate = new Date(order.updatedAt);
            timelineEvents.push({
              id: `status-waiting`,
              time: format(waitingDate, 'HH:mm'),
              date: format(waitingDate, 'dd/MM/yyyy'),
              title: 'Chờ xử lý',
              description: 'Đơn hàng đã được thanh toán một phần và đang chờ thanh toán đủ',
              actor: order.employeeID?.fullName || rootStore.auth.userFullName || 'Admin',
              type: 'status_change'
            });
          } else if (order.status === 'processing') {
            // Assume processing happened after creation
            const processingDate = new Date(order.updatedAt);
            timelineEvents.push({
              id: `status-processing`,
              time: format(processingDate, 'HH:mm'),
              date: format(processingDate, 'dd/MM/yyyy'),
              title: 'Đã xử lý đơn hàng',
              description: 'Đơn hàng đã được xử lý',
              actor: order.employeeID?.fullName || rootStore.auth.userFullName || 'Admin',
              type: 'status_change'
            });
          } else if (order.status === 'shipping') {
            // Assume processing and shipping happened
            const processingDate = new Date(order.updatedAt);
            processingDate.setHours(processingDate.getHours() - 1); // Fake time 1 hour before
            
            timelineEvents.push({
              id: `status-processing`,
              time: format(processingDate, 'HH:mm'),
              date: format(processingDate, 'dd/MM/yyyy'),
              title: 'Đã xử lý đơn hàng',
              description: 'Đơn hàng đã được xử lý',
              actor: order.employeeID?.fullName || rootStore.auth.userFullName || 'Admin',
              type: 'status_change'
            });
            
            const shippingDate = new Date(order.updatedAt);
            timelineEvents.push({
              id: `status-shipping`,
              time: format(shippingDate, 'HH:mm'),
              date: format(shippingDate, 'dd/MM/yyyy'),
              title: 'Đang giao hàng',
              description: 'Đơn hàng đang trong quá trình giao đến khách hàng',
              actor: order.employeeID?.fullName || rootStore.auth.userFullName || 'Admin',
              type: 'status_change'
            });
          } else if (order.status === 'delivered') {
            // Assume full process occurred
            const baseDate = new Date(order.updatedAt);
            
            // If order has partial payment details, add waiting status
            const hasPartialPayment = order.paymentDetails?.some((p: any) => p.amount < order.totalAmount);
            
            if (hasPartialPayment) {
              // Add waiting event (payment was partial at some point)
              const waitingDate = new Date(baseDate);
              waitingDate.setHours(waitingDate.getHours() - 4);
              
              timelineEvents.push({
                id: `status-waiting`,
                time: format(waitingDate, 'HH:mm'),
                date: format(waitingDate, 'dd/MM/yyyy'),
                title: 'Chờ xử lý',
                description: 'Đơn hàng đã được thanh toán một phần và đang chờ thanh toán đủ',
                actor: order.employeeID?.fullName || rootStore.auth.userFullName || 'Admin',
                type: 'status_change'
              });
            }
            
            // Processing event
            const processingDate = new Date(baseDate);
            processingDate.setHours(processingDate.getHours() - 3);
            
            timelineEvents.push({
              id: `status-processing`,
              time: format(processingDate, 'HH:mm'),
              date: format(processingDate, 'dd/MM/yyyy'),
              title: 'Đã xử lý đơn hàng',
              description: 'Đơn hàng đã được xử lý',
              actor: order.employeeID?.fullName || rootStore.auth.userFullName || 'Admin',
              type: 'status_change'
            });
            
            // Shipping event
            const shippingDate = new Date(baseDate);
            shippingDate.setHours(shippingDate.getHours() - 2);
            
            timelineEvents.push({
              id: `status-shipping`,
              time: format(shippingDate, 'HH:mm'),
              date: format(shippingDate, 'dd/MM/yyyy'),
              title: 'Đang giao hàng',
              description: 'Đơn hàng đang trong quá trình giao đến khách hàng',
              actor: order.employeeID?.fullName || rootStore.auth.userFullName || 'Admin',
              type: 'status_change'
            });
            
            // Delivered event
            const deliveredDate = new Date(baseDate);
            
            timelineEvents.push({
              id: `status-delivered`,
              time: format(deliveredDate, 'HH:mm'),
              date: format(deliveredDate, 'dd/MM/yyyy'),
              title: 'Đã giao hàng',
              description: 'Đơn hàng đã được giao thành công cho khách hàng',
              actor: order.employeeID?.fullName || rootStore.auth.userFullName || 'Admin',
              type: 'status_change'
            });
          } else if (order.status === 'canceled') {
            // Add canceled event
            const cancelDate = new Date(order.updatedAt);
            
            timelineEvents.push({
              id: `status-canceled`,
              time: format(cancelDate, 'HH:mm'),
              date: format(cancelDate, 'dd/MM/yyyy'),
              title: 'Đã hủy đơn hàng',
              description: order.cancelReason 
                ? `Lý do: ${order.cancelReason}` 
                : 'Đơn hàng đã bị hủy',
              actor: order.employeeID?.fullName || rootStore.auth.userFullName || 'Admin',
              type: 'status_change'
            });
          }
          
          // Sort events by date and time (newest first)
          timelineEvents.sort((a, b) => {
            const dateA = new Date(`${a.date} ${a.time}`);
            const dateB = new Date(`${b.date} ${b.time}`);
            return dateB.getTime() - dateA.getTime();
          });
          
          setEvents(timelineEvents);
        } else {
          console.error(`Order with ID ${orderId} not found`);
        }
      } catch (error) {
        console.error('Error loading order history:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadOrderHistory();
  }, [orderId]);
  
  // Group events by date for the timeline display
  const groupedEvents = events.reduce((groups: {[date: string]: TimelineEvent[]}, event) => {
    if (!groups[event.date]) {
      groups[event.date] = [];
    }
    groups[event.date].push(event);
    return groups;
  }, {});
  
  // Convert to array for rendering
  const dateGroups = Object.keys(groupedEvents).map(date => ({
    date,
    events: groupedEvents[date]
  }));
  
  if (loading) {
    return (
      <BaseLayout>
        <Header
          title={`Lịch sử đơn hàng #${orderNumber}`}
          showBackIcon
          onPressBack={navigateBack}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={color.primaryColor} />
        </View>
      </BaseLayout>
    );
  }
  
  // Helper function to format payment method
  const formatPaymentMethod = (method: string) => {
    return method === 'cash' ? 'Tiền mặt' : 
           method === 'credit card' ? 'Thẻ tín dụng' : 
           method === 'debit card' ? 'Thẻ ghi nợ' : 
           method === 'e-wallet' ? 'Ví điện tử' : method;
  };
  
  return (
    <BaseLayout>
      <Header
        title={`Lịch sử đơn hàng #${orderNumber}`}
        showBackIcon
        onPressBack={navigateBack}
      />
      
      <ScrollView contentContainerStyle={styles.container}>
        {dateGroups.length === 0 ? (
          <View style={styles.emptyContainer}>
            <DynamicText style={styles.emptyText}>Không có lịch sử cho đơn hàng này</DynamicText>
          </View>
        ) : (
          dateGroups.map((group, groupIndex) => (
            <View key={`group-${groupIndex}`} style={styles.dateGroup}>
              <View style={styles.dateHeader}>
                <DynamicText style={styles.dateText}>{group.date}</DynamicText>
              </View>
              
              {group.events.map((event, eventIndex) => (
                <View key={event.id} style={styles.timelineItem}>
                  {/* Timeline elements */}
                  <View style={styles.timelineLeft}>
                    <DynamicText style={styles.timeText}>{event.time}</DynamicText>
                    <View style={[
                      styles.timelineDot,
                      event.type === 'creation' ? styles.creationDot : 
                      event.type === 'payment' ? styles.paymentDot :
                      event.type === 'refund' ? styles.refundDot :
                      styles.statusDot
                    ]} />
                    {eventIndex < group.events.length - 1 && (
                      <View style={styles.timelineLine} />
                    )}
                  </View>
                  
                  {/* Event content */}
                  <TouchableOpacity 
                    style={styles.eventContent}
                    onPress={() => event.type === 'payment' && event.paymentDetails && togglePaymentDetails(event.id)}
                    disabled={!event.paymentDetails}
                  >
                    <View style={styles.eventHeader}>
                      <DynamicText style={styles.eventTitle}>{event.title}</DynamicText>
                      {event.type === 'payment' && event.paymentDetails && (
                        <View style={styles.expandIcon}>
                          <DynamicText>
                            {expandedPaymentIds.includes(event.id) ? '▼' : '▶'}
                          </DynamicText>
                        </View>
                      )}
                    </View>
                    <DynamicText style={styles.eventDescription}>{event.description}</DynamicText>
                    
                    {/* Expanded payment details */}
                    {event.type === 'payment' && 
                     event.paymentDetails && 
                     expandedPaymentIds.includes(event.id) && (
                      <View style={styles.paymentDetailsContainer}>
                        <View style={styles.paymentDetailsDivider} />
                        
                        <View style={styles.paymentRow}>
                          <DynamicText style={styles.paymentLabel}>Số tiền thanh toán:</DynamicText>
                          <DynamicText style={styles.paymentValue}>
                            {formatCurrency(event.paymentDetails.amount)}
                          </DynamicText>
                        </View>
                        
                        <View style={styles.paymentRow}>
                          <DynamicText style={styles.paymentLabel}>Phương thức:</DynamicText>
                          <DynamicText style={styles.paymentValue}>
                            {formatPaymentMethod(event.paymentDetails.method)}
                          </DynamicText>
                        </View>
                        
                        <View style={styles.paymentRow}>
                          <DynamicText style={styles.paymentLabel}>Thời gian:</DynamicText>
                          <DynamicText style={styles.paymentValue}>
                            {format(event.paymentDetails.paymentDate, 'dd/MM/yyyy HH:mm')}
                          </DynamicText>
                        </View>
                        
                        {event.paymentDetails.isFullyPaid ? (
                          <View style={styles.paymentStatusContainer}>
                            <DynamicText style={styles.fullyPaidText}>
                              Đã thanh toán đủ
                            </DynamicText>
                          </View>
                        ) : (
                          <View style={styles.paymentRow}>
                            <DynamicText style={styles.paymentLabel}>Còn lại:</DynamicText>
                            <DynamicText style={styles.remainingAmount}>
                              {formatCurrency(event.paymentDetails.remainingAmount || 0)}
                            </DynamicText>
                          </View>
                        )}
                      </View>
                    )}
                    
                    {event.actor && (
                      <DynamicText style={styles.eventActor}>{event.actor}</DynamicText>
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </BaseLayout>
  );
});

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    padding: moderateScale(16),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(50),
  },
  emptyText: {
    fontSize: moderateScale(16),
    color: color.accentColor.grayColor,
    textAlign: 'center',
  },
  dateGroup: {
    marginBottom: moderateScale(20),
  },
  dateHeader: {
    backgroundColor: '#f5f5f5',
    padding: moderateScale(8),
    borderRadius: moderateScale(5),
    marginBottom: moderateScale(10),
  },
  dateText: {
    fontSize: moderateScale(14),
    fontWeight: 'bold',
    color: color.accentColor.darkColor,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: moderateScale(15),
  },
  timelineLeft: {
    width: moderateScale(50),
    alignItems: 'center',
    marginRight: moderateScale(10),
  },
  timeText: {
    fontSize: moderateScale(12),
    color: color.accentColor.grayColor,
    marginBottom: moderateScale(5),
  },
  timelineDot: {
    width: moderateScale(14),
    height: moderateScale(14),
    borderRadius: moderateScale(7),
    zIndex: 1,
  },
  creationDot: {
    backgroundColor: '#4CAF50', // Green for creation
  },
  paymentDot: {
    backgroundColor: '#2196F3', // Blue for payment
  },
  refundDot: {
    backgroundColor: '#FFC107', // Yellow for refund
  },
  statusDot: {
    backgroundColor: '#9C27B0', // Purple for status changes
  },
  timelineLine: {
    position: 'absolute',
    width: moderateScale(2),
    backgroundColor: '#E0E0E0',
    top: moderateScale(25),
    bottom: moderateScale(-15),
    zIndex: 0,
  },
  eventContent: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventTitle: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: color.accentColor.darkColor,
    marginBottom: moderateScale(4),
    flex: 1,
  },
  expandIcon: {
    width: moderateScale(20),
    alignItems: 'center',
  },
  eventDescription: {
    fontSize: moderateScale(14),
    color: color.accentColor.darkColor,
    marginBottom: moderateScale(4),
  },
  eventActor: {
    fontSize: moderateScale(12),
    color: color.accentColor.grayColor,
    fontStyle: 'italic',
  },
  paymentDetailsContainer: {
    marginTop: moderateScale(8),
    marginBottom: moderateScale(8),
  },
  paymentDetailsDivider: {
    height: moderateScale(1),
    backgroundColor: '#E0E0E0',
    marginVertical: moderateScale(8),
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: moderateScale(6),
  },
  paymentLabel: {
    fontSize: moderateScale(13),
    color: color.accentColor.grayColor,
  },
  paymentValue: {
    fontSize: moderateScale(13),
    color: color.accentColor.darkColor,
    fontWeight: '500',
  },
  paymentStatusContainer: {
    backgroundColor: '#e6f7ff',
    borderRadius: moderateScale(4),
    padding: moderateScale(6),
    marginTop: moderateScale(4),
    alignItems: 'center',
  },
  fullyPaidText: {
    color: '#1890ff',
    fontSize: moderateScale(13),
    fontWeight: '600',
  },
  remainingAmount: {
    fontSize: moderateScale(13),
    color: '#ff4d4f',
    fontWeight: '500',
  },
});

export default OrderHistoryScreen; 