import { create, ApiResponse } from 'apisauce';
import { Platform } from 'react-native';
import { CustomerResponse } from '../../models/customer/customer';
import { ApiEndpoint } from './api-endpoint';

// Define base URLs for different environments
const ANDROID_BASE_URL = 'http://10.0.2.2';  // Android emulator localhost
const IOS_BASE_URL = 'http://localhost';     // iOS simulator localhost
const DEFAULT_BASE_URL = 'http://localhost'; // Fallback
const TABLE_BASE_URL = 'http://192.168.50.241'; 
// List of ports to try
const PORTS = [5000, 3000, 8000, 8080];

// Generate all possible base URLs
const generateBaseUrls = (baseUrl: string) => {
  return PORTS.map(port => `${baseUrl}:${port}`);
};

// Get appropriate base URLs for current platform
const getBaseUrls = () => {
  if (Platform.OS === 'android') {
    return generateBaseUrls(TABLE_BASE_URL);
    // return generateBaseUrls(ANDROID_BASE_URL);
  } else if (Platform.OS === 'ios') {
    return generateBaseUrls(IOS_BASE_URL);
  }
  return generateBaseUrls(DEFAULT_BASE_URL);
};

// Start with first URL
let currentUrlIndex = 0;
const baseUrls = getBaseUrls();

// Current BASE_URL - will be updated if a port works
export const BASE_URL = baseUrls[currentUrlIndex];

// Store the active port when found
const saveActivePort = async (port: number) => {
  try {
    console.log(`🔄 Saved active API port: ${port}`);
  } catch (error) {
    console.error('❌ Failed to save active port:', error);
  }
};

// API functions
export const customerAPI = {
  // Lấy danh sách khách hàng
  getCustomers: async () => {
    // Create a new API instance
    const apiClient = create({
      baseURL: BASE_URL,
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000, // 30 seconds
    });
    
    return apiClient.get(ApiEndpoint.CUSTOMERS_PUBLIC);
  },
  
  // Thêm khách hàng mới
  addCustomer: (customerData: any) => {
    const apiClient = create({
      baseURL: BASE_URL,
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
    });
    
    console.log('Sending to endpoint:', '/customers/mobile/customers/add');
    console.log('Data:', JSON.stringify(customerData, null, 2));
    return apiClient.post('/customers/mobile/customers/add', customerData);
  },
  
  // Cập nhật khách hàng - Sử dụng endpoint đặc biệt cho mobile app
  updateCustomer: (customerId: string, customerData: any) => {
    const apiClient = create({
      baseURL: BASE_URL,
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
    });
    
    console.log('Updating customer at endpoint:', `/customers/mobile/customers/update/${customerId}`);
    console.log('Update data:', JSON.stringify(customerData, null, 2));
    return apiClient.put(`/customers/mobile/customers/update/${customerId}`, customerData);
  },
  
  // Xóa khách hàng
  deleteCustomer: (customerId: string) => {
    const apiClient = create({
      baseURL: BASE_URL,
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
    });
    
    return apiClient.delete(`/customers/${customerId}`);
  },
  
  // Tìm kiếm khách hàng theo số điện thoại
  searchCustomerByPhone: (phoneNumber: string) => {
    const apiClient = create({
      baseURL: BASE_URL,
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
    });
    
    return apiClient.get('/customers/search', { phoneNumber });
  },

  // Try the next available port if the current one fails
  tryNextPort: () => {
    currentUrlIndex = (currentUrlIndex + 1) % baseUrls.length;
    const newBaseUrl = baseUrls[currentUrlIndex];
    console.log(`🔄 Switching to next API URL: ${newBaseUrl}`);
    return newBaseUrl;
  }
};

// Helper function to process API errors
export function getGeneralApiProblem(response: ApiResponse<any>) {
  console.error('❌ API ERROR:', response.problem, response.status, response.data);

  if (!response.ok) {
    switch (response.problem) {
      case 'NETWORK_ERROR':
        return { kind: 'network', message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và đảm bảo server đang chạy.' };
      case 'TIMEOUT_ERROR':
        return { kind: 'timeout', message: 'Kết nối đến máy chủ quá lâu. Vui lòng thử lại sau.' };
      case 'CONNECTION_ERROR':
        return { kind: 'connection', message: 'Lỗi kết nối đến máy chủ. Vui lòng thử lại sau.' };
      case 'CANCEL_ERROR':
        return { kind: 'cancel', message: 'Yêu cầu đã bị hủy.' };
      case 'SERVER_ERROR':
        return { kind: 'server', message: 'Máy chủ gặp lỗi. Vui lòng thử lại sau.' };
      default:
        // Xử lý các mã status HTTP
        switch (response.status) {
          case 401:
            return { kind: 'unauthorized', message: 'Bạn không có quyền truy cập.' };
          case 403:
            return { kind: 'forbidden', message: 'Truy cập bị từ chối.' };
          case 404:
            return { kind: 'not-found', message: 'Không tìm thấy tài nguyên.' };
          case 500:
          case 503:
            return { kind: 'server', message: 'Máy chủ gặp lỗi. Vui lòng thử lại sau.' };
          default:
            return { kind: 'unknown', message: 'Đã xảy ra lỗi không xác định.' };
        }
    }
  }
  
  return null;
}

// Main API Service object for customers
export const ApiService = {
  async getCustomers() {
    try {
      console.log('📌 Gọi API: Lấy danh sách khách hàng từ', ApiEndpoint.CUSTOMERS_PUBLIC);
      console.log('📌 URL đầy đủ:', `${BASE_URL}${ApiEndpoint.CUSTOMERS_PUBLIC}`);

      // Tạo API công khai không cần token
      const publicApi = create({
        baseURL: BASE_URL,
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      });

      // Gọi API
      const response = await publicApi.get(ApiEndpoint.CUSTOMERS_PUBLIC);
      
      // Ghi log phản hồi
      console.log('🔄 Response từ API:', response.status, response.problem);

      // Kiểm tra lỗi
      if (!response.ok) {
        const problem = getGeneralApiProblem(response);
        console.error('❌ Lỗi API:', problem);
        return problem || { kind: 'unknown', message: 'Lỗi không xác định' };
      }

      // Kiểm tra phản hồi JSON hợp lệ
      if (!response.data) {
        console.error('⚠️ API trả về dữ liệu không hợp lệ:', response.data);
        return { kind: 'bad-data', message: 'Dữ liệu không hợp lệ' };
      }

      // Log chi tiết để debug
      console.log('✅ API trả về dữ liệu:', response.data);
      
      // Trả về đúng định dạng cho store
      return { 
        kind: 'ok',
        customers: Array.isArray(response.data) ? response.data : []
      };
    } catch (error) {
      console.error('❌ Exception khi gọi API:', error);
      return { 
        kind: 'unknown', 
        message: error instanceof Error ? error.message : 'Lỗi không xác định'
      };
    }
  },
  
  async searchCustomersByPhone(phoneNumber: string) {
    try {
      if (!phoneNumber || phoneNumber.trim() === '') {
        return { kind: 'ok', customers: [] };
      }
      
      // Đường dẫn API search
      const searchEndpoint = '/customers/search';
      console.log('📱 Gọi API tìm kiếm khách hàng theo SĐT:', phoneNumber);
      console.log('📱 URL đầy đủ:', `${BASE_URL}${searchEndpoint}?phoneNumber=${phoneNumber}`);

      // Tạo API công khai không cần token
      const publicApi = create({
        baseURL: BASE_URL,
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      });

      // Gọi API với tham số tìm kiếm
      const response = await publicApi.get(searchEndpoint, { 
        phoneNumber // Đảm bảo sử dụng đúng tham số mà backend mong đợi
      });
      
      // Kiểm tra lỗi
      if (!response.ok) {
        const problem = getGeneralApiProblem(response);
        console.error('❌ Lỗi API tìm kiếm:', problem);
        return problem || { kind: 'unknown', message: 'Lỗi không xác định' };
      }

      // Kiểm tra phản hồi JSON hợp lệ
      if (!response.data) {
        console.error('⚠️ API tìm kiếm trả về dữ liệu không hợp lệ:', response.data);
        return { kind: 'bad-data', message: 'Dữ liệu không hợp lệ' };
      }
      
      // Xử lý dữ liệu trả về an toàn
      let customers: CustomerResponse[] = [];
      
      // Kiểm tra cấu trúc dữ liệu trả về
      if (typeof response.data === 'object') {
        if (response.data && 'customers' in response.data && Array.isArray(response.data.customers)) {
          customers = response.data.customers;
        } else if (Array.isArray(response.data)) {
          customers = response.data;
        }
      }
      
      return { kind: 'ok', customers };
    } catch (error) {
      console.error('❌ Exception khi gọi API tìm kiếm:', error);
      return { 
        kind: 'unknown', 
        message: error instanceof Error ? error.message : 'Lỗi không xác định'
      };
    }
  },
};

export default customerAPI;
