import { create, ApiResponse } from 'apisauce';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define base URLs for different environments
const ANDROID_BASE_URL = 'http://10.0.2.2';  // Android emulator localhost
const IOS_BASE_URL = 'http://localhost';     // iOS simulator localhost
const DEFAULT_BASE_URL = 'http://localhost'; // Fallback

// List of ports to try
const PORTS = [5000, 3000, 8000, 8080];

// Generate all possible base URLs
const generateBaseUrls = (baseUrl: string) => {
  return PORTS.map(port => `${baseUrl}:${port}`);
};

// Get appropriate base URLs for current platform
const getBaseUrls = () => {
  if (Platform.OS === 'android') {
    return generateBaseUrls(ANDROID_BASE_URL);
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
    await AsyncStorage.setItem('active_api_port', port.toString());
    console.log(`🔄 Saved active API port: ${port}`);
  } catch (error) {
    console.error('❌ Failed to save active port:', error);
  }
};

// Try to load the last working port
const loadActivePort = async (): Promise<string | null> => {
  try {
    const port = await AsyncStorage.getItem('active_api_port');
    if (port) {
      console.log(`🔄 Loaded previously working port: ${port}`);
      const baseUrl = Platform.OS === 'android' ? ANDROID_BASE_URL : 
                     (Platform.OS === 'ios' ? IOS_BASE_URL : DEFAULT_BASE_URL);
      return `${baseUrl}:${port}`;
    }
  } catch (error) {
    console.error('❌ Failed to load active port:', error);
  }
  return null;
};

// Tạo API client với các cấu hình mặc định
const apiClient = create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000, // 30 seconds
});

// Các API functions
export const customerAPI = {
  // Lấy danh sách khách hàng
  getCustomers: async () => {
    return apiClient.get('/customers/json');
  },
  
  // Thêm khách hàng mới
  addCustomer: (customerData) => {
    console.log('Sending to endpoint:', '/customers/mobile/customers/add');
    console.log('Data:', JSON.stringify(customerData, null, 2));
    return apiClient.post('/customers/mobile/customers/add', customerData);
  },
  
  // Cập nhật khách hàng - Sử dụng endpoint đặc biệt cho mobile app
  updateCustomer: (customerId, customerData) => {
    console.log('Updating customer at endpoint:', `/customers/mobile/customers/update/${customerId}`);
    console.log('Update data:', JSON.stringify(customerData, null, 2));
    return apiClient.put(`/customers/mobile/customers/update/${customerId}`, customerData);
  },
  
  // Xóa khách hàng
  deleteCustomer: (customerId) => {
    return apiClient.delete(`/customers/${customerId}`);
  },
  
  // Tìm kiếm khách hàng theo số điện thoại
  searchCustomerByPhone: (phoneNumber) => {
    return apiClient.get('/customers/search', { phoneNumber });
  },

  // Try the next available port if the current one fails
  tryNextPort: () => {
    currentUrlIndex = (currentUrlIndex + 1) % baseUrls.length;
    const newBaseUrl = baseUrls[currentUrlIndex];
    apiClient.setBaseURL(newBaseUrl);
    console.log(`🔄 Switching to next API URL: ${newBaseUrl}`);
    return newBaseUrl;
  },
  
  // Initialize with stored port if available
  initializeApi: async () => {
    const storedBaseUrl = await loadActivePort();
    if (storedBaseUrl) {
      apiClient.setBaseURL(storedBaseUrl);
      console.log(`🔄 Using stored API URL: ${storedBaseUrl}`);
      return storedBaseUrl;
    }
    return BASE_URL;
  }
};

// Setup API monitor to detect and handle port issues
apiClient.addMonitor((response) => {
  if (response.problem === 'NETWORK_ERROR' || response.problem === 'CONNECTION_ERROR') {
    // Try next port on next request
    customerAPI.tryNextPort();
  } else if (response.ok) {
    // Extract port from successful URL
    const url = response.config?.baseURL;
    if (url) {
      const portMatch = url.match(/:(\d+)/);
      if (portMatch && portMatch[1]) {
        const port = parseInt(portMatch[1], 10);
        saveActivePort(port);
      }
    }
  }
});

// Initialize the API with the stored port
customerAPI.initializeApi();

export default customerAPI; 