import { Api } from './api';
import { ApiEndpoint } from './api-endpoint';

export const fetchOrders = async () => {
  try {
    console.log('Fetching mobile orders...');
    
    // Use the orders mobile list endpoint
    const response = await Api.get(ApiEndpoint.ORDERS + '/mobile/list');
    
    if (response.ok && response.data) {
      console.log('Orders fetch successful:', response.data);
      
      // Extract orders data, handling different possible response structures
      const ordersData = response.data.data || response.data;
      
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