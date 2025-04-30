import { Api } from './api';
import { ApiEndpoint } from './api-endpoint';
import { rootStore } from '../../models/root-store';
import { create } from 'apisauce';

// Định nghĩa interface cho response
interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data?: T;
  status?: string;
}

// Định nghĩa interface cho Product
interface Product {
  _id: string;
  name: string;
  thumbnail?: string;
  category: string | {
    _id: string;
    name: string;
  };
  providerId: string | {
    _id: string;
    fullName: string;
  };
  status: 'available' | 'unavailable';
  price?: number;
  inventory?: number;
  variants?: Array<{
    price: number;
    inventory: number;
  }>;
  detailsVariants?: Array<any>;
}

// Hàm lấy danh sách sản phẩm
export const fetchProducts = async () => {
  try {
    console.log('Đang lấy danh sách sản phẩm...');

    // Tạo timestamp để tránh cache
    const timestamp = Date.now();

    // Tạo instance API mới không yêu cầu token
    const publicApi = create({
      baseURL: "http://10.0.2.2:5000/", // Cho Android Emulator
      // baseURL: "http://192.168.50.241:5000/", // Cho máy tablet có ip wifi
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Request-Time': timestamp.toString()
      },
      timeout: 15000 // Tăng timeout lên 15 giây
    });

    // Kiểm tra kết nối trước khi lấy dữ liệu
    let connectionRetries = 3; // Tăng số lần thử
    let connected = false;
    let response;
    
    while (connectionRetries > 0 && !connected) {
      try {
        // Thử ping server với timeout ngắn để kiểm tra kết nối
        console.log(`Thử kết nối lần ${4 - connectionRetries}...`);
        const pingResponse = await publicApi.get('ping', {}, { timeout: 5000 });
        if (pingResponse.ok) {
          connected = true;
          console.log('Kết nối thành công, tiếp tục lấy dữ liệu...');
        } else {
          console.log(`Không thể kết nối tới server, thử lại (còn ${connectionRetries - 1} lần)`);
          connectionRetries--;
          // Đợi 2 giây trước khi thử lại
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (pingError) {
        console.log(`Lỗi kết nối: ${pingError}`);
        connectionRetries--;
        if (connectionRetries > 0) {
          console.log(`Thử lại sau 2 giây (còn ${connectionRetries} lần)...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    if (!connected) {
      console.error('Không thể kết nối tới server sau nhiều lần thử');
      throw new Error('Không thể kết nối tới server, vui lòng kiểm tra kết nối mạng');
    }

    try {
      // Sử dụng đường dẫn API chính xác từ ApiEndpoint với tham số timestamp để tránh cache
      response = await publicApi.get<ApiResponse<Product[]>>(`${ApiEndpoint.PRODUCTS}?_=${timestamp}`);
    } catch (fetchError) {
      console.error('Lỗi trong quá trình lấy dữ liệu:', fetchError);
      throw new Error('Không thể kết nối tới server, vui lòng kiểm tra kết nối mạng');
    }
    
    console.log('Response từ API sản phẩm:', {
      status: response.status,
      ok: response.ok
    });

    if (response.ok && response.data?.success) {
      console.log('Lấy sản phẩm thành công (format success)');
      return response.data.data || [];
    } else if (response.ok && Array.isArray(response.data?.data)) {
      // API trả về theo format cũ
      console.log('Lấy sản phẩm thành công (format array)');
      return response.data.data || [];
    } else if (response.ok && response.data?.status === 'Ok') {
      // API trả về theo format status: 'Ok'
      console.log('Lấy sản phẩm thành công (format Ok)');
      return response.data.data || [];
    } else if (response.ok && Array.isArray(response.data)) {
      // API trả về mảng trực tiếp
      console.log('Lấy sản phẩm thành công (format array direct)');
      return response.data || [];
    } else {
      console.error('Không thể lấy danh sách sản phẩm:', response.problem, response.data);
      if (response.problem === 'NETWORK_ERROR') {
        throw new Error('Không thể kết nối tới server, vui lòng kiểm tra kết nối mạng');
      } else if (response.problem === 'TIMEOUT_ERROR') {
        throw new Error('Máy chủ phản hồi quá chậm, vui lòng thử lại sau');
      } else if (response.problem === 'SERVER_ERROR') {
        throw new Error('Máy chủ gặp sự cố, vui lòng thử lại sau');
      } else {
        throw new Error(response.data?.message || 'Không thể lấy danh sách sản phẩm');
      }
    }
  } catch (error) {
    console.error('Lỗi trong fetchProducts:', error);
    throw error instanceof Error
      ? new Error(`Exception in fetchProducts: ${error.message}`)
      : new Error('Không thể kết nối tới server, vui lòng kiểm tra kết nối mạng');
  }
};

// Hàm thêm sản phẩm mới
export const addProduct = async (productData: any) => {
  try {
    console.log('Đang thêm sản phẩm mới:', productData);

    const response = await Api.post<ApiResponse<Product>>(ApiEndpoint.PRODUCTS, productData);

    if (response.ok && response.data?.success) {
      console.log('Thêm sản phẩm thành công:', response.data);
      return response.data.data;
    } else {
      // Kiểm tra nếu là lỗi xác thực
      if (response.status === 401) {
        console.log('Phiên đăng nhập hết hạn, tiến hành refresh token...');
        const authStore = rootStore.auth;
        
        // Thử refresh token
        const refreshSuccess = await authStore.refreshAccessToken();
        
        if (refreshSuccess) {
          // Thử lại request sau khi refresh token thành công
          const retryResponse = await Api.post<ApiResponse<Product>>(ApiEndpoint.PRODUCTS, productData);
          if (retryResponse.ok && retryResponse.data?.success) {
            return retryResponse.data.data;
          }
        } else {
          // Nếu refresh token thất bại, clear auth và throw error
          authStore.clearAuth();
          throw new Error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
        }
      }
      
      console.error('Không thể thêm sản phẩm:', response.problem);
      throw new Error(response.data?.message || 'Không thể thêm sản phẩm');
    }
  } catch (error) {
    console.error('Lỗi trong addProduct:', error);
    throw error;
  }
};

// Hàm lấy danh sách danh mục sản phẩm
export const fetchCategories = async () => {
  try {
    console.log('Đang lấy danh sách danh mục sản phẩm...');
    
    // Tạo timestamp để tránh cache
    const timestamp = Date.now();
    
    // Sử dụng đường dẫn API chính xác 
    const response = await Api.get(`/typeproduct?_=${timestamp}`);
    
    if (response.ok && response.data) {
      console.log('Lấy danh mục thành công');
      return response.data.data || [];
    } else {
      console.error('Không thể lấy danh sách danh mục:', response.problem);
      throw new Error('Không thể lấy danh sách danh mục sản phẩm');
    }
  } catch (error) {
    console.error('Lỗi trong fetchCategories:', error);
    throw error;
  }
};

// Add a new function to fetch inventory data for product selection
export const fetchInventoriesForProductSelection = async () => {
  try {
    console.log('Fetching inventory data for product selection...');
    
    // Create timestamp to avoid cache
    const timestamp = Date.now();
    
    // Use the API instance to get inventory data
    const response = await Api.get(`/inventory/available?_=${timestamp}`);
    
    console.log('Inventory API response:', {
      status: response.status,
      ok: response.ok,
      problem: response.problem,
      data: response.data
    });
    
    if (!response.ok) {
      console.error('API Error:', response.problem, response.data);
      throw new Error(
        (response.data as any)?.message || 
        `API error: ${response.problem}`
      );
    }

    // Handle different response formats
    const data = response.data as any;
    
    if (data && data.success && Array.isArray(data.data)) {
      console.log('Successfully fetched inventory data');
      return data.data;
    } else if (data && Array.isArray(data.data)) {
      console.log('Successfully fetched inventory data (alternative format)');
      return data.data;
    } else if (data && data.status === 'Ok' && Array.isArray(data.data)) {
      console.log('Successfully fetched inventory data (Ok format)');
      return data.data;
    } else if (Array.isArray(data)) {
      console.log('Successfully fetched inventory data (direct array)');
      return data;
    } else {
      console.error('Invalid response format:', data);
      throw new Error('Invalid response format from server');
    }
  } catch (error) {
    console.error('Exception in fetchInventoriesForProductSelection:', error);
    throw error;
  }
};

export default {
  fetchProducts,
  addProduct,
  fetchCategories,
  fetchInventoriesForProductSelection,
};