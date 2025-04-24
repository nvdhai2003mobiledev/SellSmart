import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { observer } from 'mobx-react-lite';
import { DynamicText, Header } from '../../../components';
import { updateOrderStatus } from '../../../services/api/ordersApi';
import { rootStore } from '../../../models/root-store';

const OrderCancelScreen = observer(() => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { orderId, orderNumber } = route.params || {};
  const [cancelReason, setCancelReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập lý do hủy đơn hàng');
      return;
    }

    // Hiển thị xác nhận trước khi hủy
    Alert.alert(
      'Xác nhận hủy đơn hàng',
      `Bạn đang hủy đơn hàng #${orderNumber || 'N/A'}\n\nKhi hủy đơn hàng, hệ thống sẽ:\n• Cập nhật trạng thái đơn hàng thành "Đã hủy"\n• Tự động hoàn trả số lượng tồn kho cho tất cả sản phẩm trong đơn\n\nBạn có chắc chắn muốn hủy đơn hàng này?`,
      [
        {
          text: 'Hủy thao tác',
          style: 'cancel',
        },
        {
          text: 'Xác nhận hủy',
          style: 'destructive',
          onPress: async () => {
            await processCancelOrder();
          },
        },
      ]
    );
  };

  const processCancelOrder = async () => {
    setIsSubmitting(true);
    try {
      console.log(`===== BẮT ĐẦU HỦY ĐƠN HÀNG =====`);
      console.log(`Đơn hàng ID: ${orderId} (#${orderNumber || 'N/A'})`);
      console.log(`Lý do hủy đơn: ${cancelReason}`);
      
      // Gửi lý do hủy đơn hàng tới API
      const response = await updateOrderStatus(orderId, 'canceled', cancelReason);
      
      console.log('Kết quả cập nhật trạng thái:', response);
      
      if (response.ok) {
        // Cập nhật lại danh sách đơn hàng để đảm bảo lý do hủy được cập nhật
        await rootStore.orders.fetchOrders();
        
        // Kiểm tra xem lý do hủy đã được cập nhật trong đơn hàng chưa
        const updatedOrder = rootStore.orders.orders.find(order => order._id === orderId);
        if (updatedOrder) {
          console.log(`Đơn hàng sau khi hủy: ${updatedOrder._id}`);
          console.log(`Trạng thái: ${updatedOrder.status}`);
          console.log(`Lý do hủy: ${updatedOrder.cancelReason || 'Không có'}`);
          
          if (!updatedOrder.cancelReason) {
            console.warn('Lý do hủy đơn không được cập nhật trong đơn hàng!');
          }
        }
        
        // Hiển thị thông báo thành công với chi tiết
        Alert.alert(
          'Hủy đơn hàng thành công',
          `Đơn hàng #${orderNumber || 'N/A'} đã được hủy thành công và tồn kho đã được hoàn trả tự động. Tổng tiền đơn hàng đã được đặt về 0đ.`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Quay lại màn hình chi tiết đơn hàng
                navigation.goBack();
              },
            },
          ]
        );
      } else {
        const errorData = response.data as { message?: string } | undefined;
        const errorMessage = errorData?.message || 'Không thể hủy đơn hàng. Vui lòng thử lại sau.';
        Alert.alert('Lỗi', errorMessage);
        console.error('Lỗi khi hủy đơn hàng:', errorMessage);
      }
    } catch (error) {
      console.error('Exception khi hủy đơn hàng:', error);
      Alert.alert(
        'Lỗi hệ thống', 
        'Đã xảy ra lỗi khi hủy đơn hàng. Vui lòng thử lại sau hoặc liên hệ bộ phận hỗ trợ.'
      );
    } finally {
      setIsSubmitting(false);
      console.log(`===== KẾT THÚC HỦY ĐƠN HÀNG =====`);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title={`Hủy đơn hàng ${orderNumber ? '#' + orderNumber : ''}`}
        showBackIcon
        onPressBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.mainContent}>
          <View style={styles.card}>
            <DynamicText style={styles.title}>Lý do hủy đơn</DynamicText>
            <TextInput
              style={styles.input}
              placeholder="Nhập lý do hủy đơn hàng..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              value={cancelReason}
              onChangeText={setCancelReason}
              maxLength={200}
            />
            <DynamicText style={styles.charCount}>
              {cancelReason.length}/200 ký tự
            </DynamicText>
          </View>
          
          <View style={styles.infoCard}>
            <DynamicText style={styles.infoTitle}>Thông tin quan trọng</DynamicText>
            <DynamicText style={styles.infoText}>
              • Khi hủy đơn hàng, tất cả sản phẩm trong đơn sẽ được hoàn trả vào tồn kho.
            </DynamicText>
            <DynamicText style={styles.infoText}>
              • Đơn hàng đã hủy không thể khôi phục lại.
            </DynamicText>
            <DynamicText style={styles.infoText}>
              • Lý do hủy đơn sẽ được lưu lại trong hệ thống.
            </DynamicText>
          </View>
          
          <View style={styles.warningCard}>
            <DynamicText style={styles.warningText}>
              Lưu ý: Việc hủy đơn hàng không thể hoàn tác. Vui lòng xác nhận kỹ trước khi tiếp tục.
            </DynamicText>
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.cancelButton, !cancelReason.trim() && styles.disabledButton]}
          onPress={handleCancelOrder}
          disabled={isSubmitting || !cancelReason.trim()}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <DynamicText style={styles.buttonText}>Hủy đơn hàng</DynamicText>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          disabled={isSubmitting}
        >
          <DynamicText style={styles.backButtonText}>Quay lại</DynamicText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    flexGrow: 1,
  },
  mainContent: {
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
    padding: 12,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#ddd',
    height: 120,
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: '#e6f7ff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#1890ff',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1890ff',
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
    lineHeight: 20,
  },
  warningCard: {
    backgroundColor: '#fff2e8',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ff4d4f',
  },
  warningText: {
    fontSize: 14,
    color: '#ff4d4f',
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 10,
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  cancelButton: {
    backgroundColor: '#ff4d4f',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginRight: 8,
  },
  disabledButton: {
    backgroundColor: '#ffccc7',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  backButton: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  backButtonText: {
    color: '#555',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default OrderCancelScreen; 