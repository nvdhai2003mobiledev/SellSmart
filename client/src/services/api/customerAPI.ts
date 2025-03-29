import { create, ApiResponse } from 'apisauce';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { rootStore } from '../../models/root-store';
import { ApiEndpoint } from './api-endpoint';
import { Platform } from 'react-native';
import { CustomerResponse } from '../../models/customer/customer';

// Choose the right BASE_URL based on the platform
// For Android emulator, use 10.0.2.2 which maps to host machine's localhost
// For iOS simulator, use localhost
// For real devices, you would use the actual IP or domain
const BASE_URL = Platform.select({
  android: 'http://10.0.2.2:3000',
  ios: 'http://localhost:3000',
  default: 'http://localhost:3000',
});

console.log('🔌 API Base URL:', BASE_URL);

/**
 * 🛠️ Xử lý lỗi chung cho API
 */
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

/**
 * 🎯 Khởi tạo API chính với cấu hình nâng cao
 */
export const Api = create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15000, // 15 seconds timeout - not too long, not too short
});

/**
 * 🧐 Monitor phản hồi API
 */
Api.addMonitor(response => {
  console.log('📢 API Response:', JSON.stringify({
    url: response.config?.url,
    method: response.config?.method,
    status: response.status,
    data: response.data,
    problem: response.problem,
  }, null, 2));
});

/**
 * 🔍 Check if the server is reachable before making actual API calls
 */
const checkServerConnectivity = async () => {
  try {
    const pingApi = create({
      baseURL: BASE_URL,
      timeout: 5000, // Short timeout for ping
    });
    
    console.log('🏓 Pinging server at:', BASE_URL);
    const response = await pingApi.get('/');
    
    // Even if we get a 404, it means the server is up
    console.log('🏓 Ping response:', response.status, response.problem);
    return response.status !== 0;
  } catch (error) {
    console.error('🏓 Ping failed:', error);
    return false;
  }
};

/**
 * 🚀 **Gọi API: Lấy danh sách khách hàng**
 */
export const ApiService = {
  async getCustomers() {
    try {
      // Check server connectivity first
      const isServerReachable = await checkServerConnectivity();
      if (!isServerReachable) {
        console.error('❌ Server không thể kết nối được');
        return { 
          kind: 'network', 
          message: 'Không thể kết nối đến máy chủ. Vui lòng đảm bảo server đang chạy và kết nối mạng ổn định.' 
        };
      }
      
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
      console.log('🔄 Response từ API:', response);
      console.log('🔄 Response status:', response.status);
      console.log('🔄 Response problem:', response.problem);

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
      
      // Check server connectivity first
      const isServerReachable = await checkServerConnectivity();
      if (!isServerReachable) {
        console.error('❌ Server không thể kết nối được');
        return { 
          kind: 'network', 
          message: 'Không thể kết nối đến máy chủ. Vui lòng đảm bảo server đang chạy và kết nối mạng ổn định.' 
        };
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
      
      // Ghi log phản hồi
      console.log('🔄 Response từ API tìm kiếm:', response);
      console.log('🔄 Response status:', response.status);
      console.log('🔄 Response problem:', response.problem);

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

      // Log chi tiết để debug
      console.log('✅ API tìm kiếm trả về dữ liệu:', response.data);
      
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
  }
};
