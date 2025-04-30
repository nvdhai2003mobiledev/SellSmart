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

export const fetchPaginatedOrders = async (page: number = 1, limit: number = 15, filters: any = {}) => {
  try {
    console.log(`Fetching paginated orders: page ${page}, limit ${limit}`);
    
    // Construct the endpoint with query parameters
    let endpoint = `${ApiEndpoint.ORDERS}/mobile/list?page=${page}&limit=${limit}`;
    
    // Add any filters to the request if they exist
    if (filters) {
      if (filters.status) {
        endpoint += `&status=${filters.status}`;
      } else if (!('includeDrafts' in filters) || !filters.includeDrafts) {
        // Explicitly exclude draft orders by default unless requested
        endpoint += `&excludeStatus=draft`;
      }
      
      if (filters.paymentStatus) {
        endpoint += `&paymentStatus=${filters.paymentStatus}`;
      }
      if (filters.startDate) {
        endpoint += `&startDate=${filters.startDate}`;
      }
      if (filters.endDate) {
        endpoint += `&endDate=${filters.endDate}`;
      }
      // Add more filters as needed
    } else {
      // Default behavior: exclude draft orders
      endpoint += `&excludeStatus=draft`;
    }
    
    console.log(`API endpoint: ${endpoint}`);
    const response = await Api.get(endpoint);
    
    if (response.ok && response.data) {
      console.log('Paginated orders fetch successful:', response.data);
      
      // Handle different response formats
      let orders: any[] = [];
      let totalPages = 0;
      let totalOrders = 0;
      
      if (Array.isArray(response.data)) {
        // Simple array response - we don't have pagination info in this case
        orders = response.data;
        // Return with estimated pagination data
        return {
          orders,
          page,
          totalPages: page + (orders.length >= limit ? 1 : 0), // Assume there's more if we got a full page
          totalOrders: page * limit + (orders.length >= limit ? limit : 0),
          hasMore: orders.length >= limit
        };
      } else if (typeof response.data === 'object' && response.data !== null) {
        // Try to extract pagination info from the response
        const responseData = response.data as Record<string, any>;
        
        if ('data' in responseData) {
          // Format: { data: [...orders], totalPages, totalOrders, currentPage }
          if (Array.isArray(responseData.data)) {
            orders = responseData.data;
          } else if (responseData.data && typeof responseData.data === 'object' && 'orders' in responseData.data) {
            const dataObj = responseData.data as Record<string, any>;
            if (Array.isArray(dataObj.orders)) {
              orders = dataObj.orders;
            }
          }
          
          totalPages = responseData.totalPages || 
                      (responseData.data && typeof responseData.data === 'object' ? 
                       (responseData.data as Record<string, any>).totalPages : 0) || 0;
                       
          totalOrders = responseData.totalOrders || 
                      (responseData.data && typeof responseData.data === 'object' ? 
                       (responseData.data as Record<string, any>).totalOrders : 0) || 0;
          
          return {
            orders,
            page: responseData.currentPage || page,
            totalPages,
            totalOrders,
            hasMore: page < totalPages
          };
        } else {
          // If we don't have a clear data structure, try to make our best guess
          // Format might be { orders: [...], totalPages, totalOrders }
          if ('orders' in responseData && Array.isArray(responseData.orders)) {
            orders = responseData.orders;
            totalPages = responseData.totalPages || 0;
            totalOrders = responseData.totalOrders || 0;
          } else {
            // Attempt to find an array in the response
            const possibleArrays = Object.values(responseData).filter(value => Array.isArray(value));
            if (possibleArrays.length > 0) {
              orders = possibleArrays[0] as any[];
            }
          }
          
          return {
            orders,
            page,
            totalPages: totalPages || page + (orders.length >= limit ? 1 : 0),
            totalOrders: totalOrders || page * limit + (orders.length >= limit ? limit : 0),
            hasMore: totalPages ? page < totalPages : orders.length >= limit
          };
        }
      }
      
      // Fallback to a simple response
      return {
        orders: [],
        page,
        totalPages: 0,
        totalOrders: 0,
        hasMore: false
      };
    } else {
      console.error('Failed to fetch paginated orders:', response.problem);
      if (response.data) {
        console.error('Error response data:', response.data);
      }
      return {
        orders: [],
        page,
        totalPages: 0,
        totalOrders: 0,
        hasMore: false
      };
    }
  } catch (error) {
    console.error('Exception in fetchPaginatedOrders:', error);
    return {
      orders: [],
      page,
      totalPages: 0, 
      totalOrders: 0,
      hasMore: false
    };
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
      status?: string;
    } = {
      paymentStatus: isPartialPayment ? 'partpaid' : 'paid',
      paymentMethod: paymentMethod
    };
    
    // Include amount only if provided
    if (amount !== undefined) {
      paymentData.amount = amount;
    }
    
    // Update status to 'waiting' if it's a partial payment or 'processing' if it's fully paid
    // The backend will handle setting this status based on the order's current state
    if (isPartialPayment) {
      paymentData.status = 'waiting';
    } else {
      paymentData.status = 'processing';
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
        console.log(`- Full response data: ${JSON.stringify(response.data)}`);
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