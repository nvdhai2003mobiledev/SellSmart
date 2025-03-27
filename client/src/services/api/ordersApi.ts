import { Api, checkApiEndpoints } from './api';

// Config object to track which API endpoints to use
let apiConfig = {
  useApiPrefix: false,
  returnsJson: false,
  initialized: false
};

// Initialize API configuration
const initApiConfig = async () => {
  if (!apiConfig.initialized) {
    try {
      const config = await checkApiEndpoints();
      apiConfig = { ...config, initialized: true };
      console.log('API configuration:', apiConfig);
    } catch (error) {
      console.error('Failed to initialize API config:', error);
    }
  }
  return apiConfig;
};

// Transform real order data to match the expected structure
const transformOrder = (order: any) => {
  try {
    // Handle potential missing or undefined fields with defaults
    return {
      _id: order._id || '',
      orderID: order.orderID || `ORD-${Date.now()}`,
      customerID: {
        _id: order.customerID?._id || order.customerID || 'unknown',
        fullName: order.customerID?.fullName || 'Khách hàng',
        phoneNumber: order.customerID?.phoneNumber || '',
        email: order.customerID?.email || '',
        address: order.customerID?.address || order.shippingAddress || ''
      },
      products: (order.products || []).map((product: any) => ({
        productID: product.productID?._id || product.productID || '',
        name: product.name || 'Sản phẩm không xác định',
        inventory: product.inventory || 0,
        price: product.price || 0,
        quantity: product.quantity || 1,
        attributes: (product.attributes || []).map((attr: any) => ({
          name: typeof attr.name === 'object' ? 'Thuộc tính' : attr.name,
          value: Array.isArray(attr.value) ? attr.value : [attr.value || 'Không xác định']
        }))
      })),
      totalAmount: order.totalAmount || 0,
      status: order.status || 'pending',
      paymentMethod: order.paymentMethod || 'cash',
      paymentStatus: order.paymentStatus || 'paid',
      shippingAddress: order.shippingAddress || 'Không có địa chỉ',
      employeeID: order.employeeID || null,
      notes: order.notes || '',
      createdAt: order.createdAt ? 
        (typeof order.createdAt === 'string' 
          ? order.createdAt 
          : order.createdAt.toISOString()) 
        : new Date().toISOString(),
      updatedAt: order.updatedAt ? 
        (typeof order.updatedAt === 'string' 
          ? order.updatedAt 
          : order.updatedAt.toISOString()) 
        : new Date().toISOString()
    };
  } catch (error) {
    console.error('Error transforming order:', error);
    return null;
  }
};

// Special API adapter for orders
export const fetchOrders = async () => {
  try {
    console.log('Fetching mobile orders...');
    
    // Sử dụng endpoint mới cho mobile
    const response = await Api.get('/orders/mobile/list');
    
    if (response.ok && response.data) {
      console.log('Orders fetch successful:', response.data);
      
      // Kiểm tra và trích xuất dữ liệu
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
    // Fix the endpoint to match the backend route
    const response = await Api.delete(`/orders/${id}`);
    
    // Add logging to troubleshoot issues
    console.log(`Delete order response for ID ${id}:`, response);
    
    return response;
  } catch (error) {
    console.error('Error deleting order:', error);
    throw error;
  }
};

