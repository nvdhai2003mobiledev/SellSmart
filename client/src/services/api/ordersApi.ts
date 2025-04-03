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

export const updateOrderStatus = async (id: string, status: string) => {
  try {
    console.log(`===== REQUEST START: Cập nhật trạng thái đơn hàng ${id} thành ${status} =====`);
    
    // Kiểm tra thông tin trước khi gửi
    console.log(`URL: ${ApiEndpoint.ORDERS}/${id}/status`);
    console.log(`Dữ liệu gửi: `, { status });
    
    const response = await Api.put(`${ApiEndpoint.ORDERS}/${id}/status`, {
      status: status
    });
    
    console.log(`===== RESPONSE RECEIVED =====`);
    console.log(`Status code: ${response.status}`);
    console.log(`Response data: `, response.data);
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