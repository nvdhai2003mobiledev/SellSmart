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
      
      // Kiểm tra và log các thông tin thanh toán trong mỗi đơn hàng
      if (Array.isArray(response.data)) {
        console.log(`Phân tích thông tin thanh toán cho ${response.data.length} đơn hàng:`);
        response.data.forEach((order, index) => {
          console.log(`Đơn hàng ${index + 1} (ID: ${order._id || 'N/A'}):`);
          console.log(`- Tổng tiền: ${order.totalAmount}`);
          console.log(`- Trạng thái thanh toán: ${order.paymentStatus}`);
          console.log(`- Số tiền đã thanh toán: ${order.paidAmount !== undefined ? order.paidAmount : 'Không có thông tin'}`);
          console.log(`- Có chi tiết thanh toán: ${order.paymentDetails ? 'Có' : 'Không'}`);
          if (order.paymentDetails && order.paymentDetails.length > 0) {
            console.log(`- Chi tiết thanh toán:`, JSON.stringify(order.paymentDetails));
          }
        });
      } else if (typeof response.data === 'object' && 'data' in response.data) {
        const orderData = response.data as OrderResponse;
        console.log(`Phân tích thông tin thanh toán cho ${orderData.data.length} đơn hàng (từ data property):`);
        orderData.data.forEach((order, index) => {
          console.log(`Đơn hàng ${index + 1} (ID: ${order._id || 'N/A'}):`);
          console.log(`- Tổng tiền: ${order.totalAmount}`);
          console.log(`- Trạng thái thanh toán: ${order.paymentStatus}`);
          console.log(`- Số tiền đã thanh toán: ${order.paidAmount !== undefined ? order.paidAmount : 'Không có thông tin'}`);
          console.log(`- Có chi tiết thanh toán: ${order.paymentDetails ? 'Có' : 'Không'}`);
          if (order.paymentDetails && order.paymentDetails.length > 0) {
            console.log(`- Chi tiết thanh toán:`, JSON.stringify(order.paymentDetails));
          }
        });
      }
      
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
      if (response.data) {
        console.error('Error response data:', response.data);
      }
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

export const updateOrderPayment = async (
  id: string, 
  paymentMethod: string, 
  amount?: number, 
  isPartialPayment?: boolean
) => {
  try {
    console.log(`Updating order payment for ID ${id} with method ${paymentMethod}`);
    if (amount) {
      console.log(`Payment amount: ${amount}`);
    }
    console.log(`Is partial payment: ${isPartialPayment ? 'Yes' : 'No'}`);
    
    // Prepare payment data
    const paymentData: {
      paymentStatus: string;
      paymentMethod: string;
      amount?: number;
    } = {
      paymentStatus: isPartialPayment ? 'partpaid' : 'paid',
      paymentMethod: paymentMethod
    };
    
    // Include amount only if provided
    if (amount !== undefined) {
      paymentData.amount = amount;
    }
    
    console.log('Payment data being sent:', paymentData);
    
    const response = await Api.put(`${ApiEndpoint.ORDERS}/${id}/payment`, paymentData);
    
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