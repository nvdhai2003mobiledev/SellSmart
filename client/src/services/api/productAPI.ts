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

// Định nghĩa interface cho Category
interface Category {
  _id: string;
  name: string;
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

// Tạo instance API public không yêu cầu token
const publicApi = create({
  baseURL: "http://10.0.2.2:5000/",
  // baseURL: "http://192.168.86.43:5000/",
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  },
  timeout: 15000
});
// Hàm lấy danh sách sản phẩm
export const fetchProducts = async () => {
  try {
    console.log('=== ĐANG GỌI API LẤY DANH SÁCH SẢN PHẨM ===');
    const response = await publicApi.get<ApiResponse<Product[]>>('/products/json');
    
    console.log('=== PHẢN HỒI TỪ API ===', {
      status: response.status,
      ok: response.ok,
      problem: response.problem,
      headers: response.headers
    });
    
    if (response.ok && response.data?.status === 'Ok') {
      console.log('=== DỮ LIỆU API TRẢ VỀ ===', JSON.stringify(response.data, null, 2));
      
      if (Array.isArray(response.data.data)) {
        console.log('=== DỮ LIỆU SẢN PHẨM (MẢNG) ===');
        // Log chi tiết về cấu trúc dữ liệu sản phẩm
        response.data.data.forEach((product, index) => {
          if (index < 2) { // Chỉ log 2 sản phẩm đầu tiên để tránh quá nhiều
            console.log(`Sản phẩm ${index}:`, JSON.stringify(product, null, 2));
            
            // Log chi tiết về biến thể nếu có
            if (product.hasVariants && product.detailsVariants) {
              console.log(`Chi tiết biến thể của sản phẩm ${index}:`);
              product.detailsVariants.forEach((variant: any, vIndex: number) => {
                console.log(`Biến thể ${vIndex}:`, JSON.stringify(variant, null, 2));
                // Kiểm tra cấu trúc của thuộc tính biến thể
                console.log(`Loại dữ liệu của attributes:`, typeof variant.attributes);
                console.log(`Các key trong biến thể:`, Object.keys(variant));
              });
            }
          }
        });
        return response.data.data;
      }
      
      if ((response.data.data as any)?.productsWithPriceAndInventory) {
        console.log('=== DỮ LIỆU SẢN PHẨM (OBJECT) ===');
        const products = (response.data.data as any).productsWithPriceAndInventory;
        
        // Log chi tiết về cấu trúc dữ liệu sản phẩm
        products.forEach((product: any, index: number) => {
          if (index < 2) { // Chỉ log 2 sản phẩm đầu tiên để tránh quá nhiều
            console.log(`Sản phẩm ${index}:`, JSON.stringify(product, null, 2));
            
            // Log chi tiết về biến thể nếu có
            if (product.hasVariants && product.detailsVariants) {
              console.log(`Chi tiết biến thể của sản phẩm ${index}:`);
              product.detailsVariants.forEach((variant: any, vIndex: number) => {
                console.log(`Biến thể ${vIndex}:`, JSON.stringify(variant, null, 2));
                // Kiểm tra cấu trúc của thuộc tính biến thể
                console.log(`Loại dữ liệu của attributes:`, typeof variant.attributes);
                console.log(`Các key trong biến thể:`, Object.keys(variant));
              });
            }
          }
        });
        
        return products;
      }
      
      console.log('=== KHÔNG CÓ DỮ LIỆU SẢN PHẨM ===');
      return [];
    }
    
    console.error('=== LỖI KHI LẤY DỮ LIỆU SẢN PHẨM ===', response.data);
    throw new Error('Không thể lấy danh sách sản phẩm');
  } catch (error) {
    console.error('=== LỖI KHI GỌI API ===', error);
    throw error;
  }
};

// hàm lấy danh sách sản phẩm cho order
export const fetchProductsfororder= async () => {
  try {
    console.log('Đang lấy danh sách sản phẩm cho order...');

    // Tạo timestamp để tránh cache
    const timestamp = Date.now();

    // Tạo instance API mới không yêu cầu token
    const publicApi = create({
      baseURL: "http://10.0.2.2:5000/", // Cho Android Emulator
      // baseURL: "http://192.168.86.43:5000/", // Cho máy tablet có ip wifi
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

    // Thử nhiều endpoints để lấy dữ liệu sản phẩm
    const endpoints = [
      '/products/json',
      '/products',
      ApiEndpoint.PRODUCTS
    ];

    let response = null;
    let connected = false;
    let connectionRetries = 3;

    // Thử kết nối trước khi lấy dữ liệu
    while (connectionRetries > 0 && !connected) {
      try {
        console.log(`Thử kết nối lần ${4 - connectionRetries}...`);
        const pingResponse = await publicApi.get('ping', {}, { timeout: 5000 });
        if (pingResponse.ok) {
          connected = true;
          console.log('Kết nối thành công, tiếp tục lấy dữ liệu...');
        } else {
          console.log(`Không thể kết nối tới server, thử lại (còn ${connectionRetries - 1} lần)`);
          connectionRetries--;
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

    // Thử từng endpoint cho đến khi thành công
    for (const endpoint of endpoints) {
      try {
        console.log(`Thử lấy dữ liệu từ endpoint: ${endpoint}`);
        response = await publicApi.get<ApiResponse<Product[]>>(`${endpoint}?_=${timestamp}`);
        
        if (response.ok) {
          console.log(`Lấy dữ liệu thành công từ endpoint: ${endpoint}`);
          break; // Thoát khỏi vòng lặp nếu thành công
        }
      } catch (fetchError) {
        console.log(`Không thể lấy dữ liệu từ endpoint ${endpoint}:`, fetchError);
        // Tiếp tục với endpoint tiếp theo
      }
    }
    
    if (!response || !response.ok) {
      console.error('Đã thử tất cả các endpoints nhưng không thành công');
      throw new Error('Không thể lấy dữ liệu sản phẩm, vui lòng thử lại sau');
    }

    console.log('Response từ API sản phẩm:', {
      status: response.status,
      ok: response.ok
    });

    // Xử lý các định dạng response khác nhau
    if (response.ok && response.data?.success && Array.isArray(response.data.data)) {
      console.log('Lấy sản phẩm thành công (format success)');
      return response.data.data || [];
    } else if (response.ok && Array.isArray(response.data?.data)) {
      // API trả về theo format cũ
      console.log('Lấy sản phẩm thành công (format array)');
      return response.data.data || [];
    } else if (response.ok && response.data?.status === 'Ok' && Array.isArray(response.data.data)) {
      // API trả về theo format status: 'Ok'
      console.log('Lấy sản phẩm thành công (format Ok)');
      return response.data.data || [];
    } else if (response.ok && Array.isArray(response.data)) {
      // API trả về mảng trực tiếp
      console.log('Lấy sản phẩm thành công (format array direct)');
      return response.data || [];
    } else if (response.ok && response.data && typeof response.data === 'object') {
      // Trả về trong trường hợp định dạng không rõ ràng nhưng có dữ liệu
      console.log('Nhận được dữ liệu với định dạng khác, cố gắng xử lý...');
      
      // Kiểm tra xem có định dạng đặc biệt nào không
      if (response.data.productsWithPriceAndInventory && Array.isArray(response.data.productsWithPriceAndInventory)) {
        return response.data.productsWithPriceAndInventory;
      } else if (response.data.products && Array.isArray(response.data.products)) {
        return response.data.products;
      }
      
      // Nếu không tìm thấy định dạng nào phù hợp, trả về đối tượng chính
      return response.data;
    } else {
      console.error('Không thể lấy danh sách sản phẩm:', response.problem, response.data);
      throw new Error('Định dạng dữ liệu không hợp lệ');
    }
  } catch (error) {
    console.error('Lỗi trong fetchProductsfororder:', error);
    throw error instanceof Error
      ? new Error(`Exception in fetchProductsfororder: ${error.message}`)
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

// Hàm lấy danh sách danh mục
export const fetchCategories = async (cacheParams: string = '') => {
  try {
    console.log('Đang tải danh mục với cache-busting:', cacheParams);
    const response = await Api.get(`/categories${cacheParams}`);
    if (response.ok && response.data?.status === 'Ok') {
      console.log(`Đã tải thành công ${response.data.data.length} danh mục`);
      return response.data.data;
    }
    console.warn('Không thể tải danh mục:', response.problem);
    return [];
  } catch (error) {
    console.error('Lỗi khi lấy danh mục:', error);
    return [];
  }
};

// Hàm lấy danh sách nhà cung cấp
export const fetchProviders = async (cacheParams: string = '') => {
  try {
    console.log('Đang tải nhà cung cấp với cache-busting:', cacheParams);
    const response = await Api.get(`/providers${cacheParams}`);
    if (response.ok && response.data?.status === 'Ok') {
      console.log(`Đã tải thành công ${response.data.data.length} nhà cung cấp`);
      return response.data.data;
    }
    console.warn('Không thể tải nhà cung cấp:', response.problem);
    return [];
  } catch (error) {
    console.error('Lỗi khi lấy nhà cung cấp:', error);
    return [];
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
  fetchProductsfororder,
  addProduct,
  fetchCategories,
  fetchProviders,
  fetchInventoriesForProductSelection,
  fetchProducts,
};