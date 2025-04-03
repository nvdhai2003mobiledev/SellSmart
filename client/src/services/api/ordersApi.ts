import { Api } from './api';
import { ApiEndpoint } from './api-endpoint';

interface OrderResponse {
  success: boolean;
  count: number;
  data: any[];
}

export const fetchOrders = async () => {
  try {
    console.log('Fetching mobile orders...');
    
    const response = await Api.get(ApiEndpoint.ORDERS + '/mobile/list');
    
    if (response.ok && response.data) {
      console.log('Orders fetch successful:', response.data);
      
      // Handle different response formats
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (typeof response.data === 'object' && 'data' in response.data) {
        const orderResponse = response.data as OrderResponse;
        return orderResponse.data;
      } else {
        console.warn('Unexpected response format:', response.data);
        return [];
      }
    } else {
      console.error('Failed to fetch orders:', response.problem);
      return [];
    }
  } catch (error) {
    console.error('Exception in fetchOrders:', error);
    return [];
  }
};

export const deleteOrder = async (id: string) => {
  try {
    const response = await Api.delete(`${ApiEndpoint.ORDERS}/${id}`);
    
    console.log(`Delete order response for ID ${id}:`, response);
    
    return response;
  } catch (error) {
    console.error('Error deleting order:', error);
    throw error;
  }
};

export const createOrder = async (orderData: any) => {
  try {
    console.log('Creating order with data:', JSON.stringify(orderData, null, 2));
    
    const response = await Api.post(ApiEndpoint.ORDERS, orderData);
    
    console.log('Create order response:', response);
    
    if (!response.ok) {
      console.error('Error response data:', response.data);
      console.error('Status code:', response.status);
      console.error('Problem:', response.problem);
    }
    
    return response;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

export const updateOrderPayment = async (id: string, paymentMethod: string) => {
  try {
    console.log(`Updating order payment for ID ${id} with method ${paymentMethod}`);
    
    // When receiving payment for an order, update:
    // 1. paymentStatus to 'paid'
    // 2. paymentMethod to the selected method
    // 3. status is updated to 'processing' automatically in the backend when changing from unpaid to paid
    const response = await Api.put(`${ApiEndpoint.ORDERS}/${id}/payment`, {
      paymentStatus: 'paid',
      paymentMethod: paymentMethod
    });
    
    console.log('Update order payment response:', response);
    
    if (!response.ok) {
      console.error('Error updating order payment:', response.problem);
      // We know response exists but TypeScript doesn't recognize the data property
      // Use any to bypass the type checking when we know the property exists
      if (response && response.data) {
        const errorData = response.data as any;
        console.error('Error details:', errorData);
      }
    }
    
    return response;
  } catch (error) {
    console.error('Error updating order payment:', error);
    throw error;
  }
};

export const updateOrderStatus = async (id: string, status: string, cancelReason?: string) => {
  try {
    console.log(`===== REQUEST START: Cập nhật trạng thái đơn hàng ${id} thành ${status} =====`);
    
    // Kiểm tra thông tin trước khi gửi
    console.log(`URL: ${ApiEndpoint.ORDERS}/${id}/status`);
    
    // Chuẩn bị dữ liệu gửi đi
    const requestData: { status: string; cancelReason?: string } = { status };
    
    // Thêm lý do nếu là hủy đơn hàng và có lý do
    if (status === 'canceled' && cancelReason) {
      console.log(`Lý do hủy đơn: ${cancelReason}`);
      requestData.cancelReason = cancelReason;
    }
    
    console.log(`Dữ liệu gửi: `, requestData);
    
    const response = await Api.put(`${ApiEndpoint.ORDERS}/${id}/status`, requestData);
    
    console.log(`===== RESPONSE RECEIVED =====`);
    console.log(`Status code: ${response.status}`);
    console.log(`Response data: `, response.data);
    
    // Chi tiết hơn về phản hồi khi hủy đơn hàng
    if (status === 'canceled') {
      console.log(`THÔNG TIN CHI TIẾT SAU KHI HỦY ĐƠN HÀNG:`);
      
      if (response.data) {
        // Sử dụng type assertion để truy cập các thuộc tính
        const orderData = response.data as {
          totalAmount?: number;
          status?: string;
          cancelReason?: string | null;
        };
        
        console.log(`- Tổng tiền hiện tại: ${orderData.totalAmount !== undefined ? orderData.totalAmount : 'Không có thông tin'}`);
        console.log(`- Trạng thái: ${orderData.status || 'Không có thông tin'}`);
        console.log(`- Lý do hủy: ${orderData.cancelReason || 'Không có'}`);
      }
    }
    
    console.log(`Problem?: ${response.problem || 'Không có'}`);
    
    if (!response.ok) {
      console.error('Error status code:', response.status);
      console.error('Error response:', response.data);
    }
    
    return response;
  } catch (error) {
    console.error('EXCEPTION in updateOrderStatus:', error);
    // In chi tiết lỗi
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    } else {
      console.error('Unknown error type:', error);
    }
    throw error;
  }
};