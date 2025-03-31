import { Api } from './api';
import { ApiEndpoint } from './api-endpoint';

export const fetchOrders = async () => {
  try {
    console.log('Fetching mobile orders...');
    
    // Use the orders mobile list endpoint
    const response = await Api.get(ApiEndpoint.ORDERS + '/mobile/list');
    
    if (response.ok && response.data) {
      console.log('Orders fetch successful:', response.data);
      
      // Use type assertion to safely access data properties
      const responseData = response.data as { data?: any[] } | any[];
      
      // Extract orders data, handling different possible response structures
      const ordersData = 'data' in responseData ? responseData.data : responseData;
      
      if (Array.isArray(ordersData)) {
        console.log(`Received ${ordersData.length} orders`);
        return ordersData;
      } else {
        console.warn('Unexpected orders data format:', ordersData);
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