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
    
    const timestamp = Date.now();
    const response = await publicApi.get<ApiResponse<Category[]>>('/typeproduct/json', {}, {
      headers: {
        'X-Request-Time': timestamp.toString()
      }
    });
    
    if (response.ok && response.data?.status === 'Ok') {
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

// Hàm lấy danh sách nhà cung cấp
export const fetchProviders = async () => {
  try {
    console.log('Đang lấy danh sách nhà cung cấp...');
    
    const timestamp = Date.now();
    const response = await publicApi.get<ApiResponse<any[]>>('/providers/json', {}, {
      headers: {
        'X-Request-Time': timestamp.toString()
      }
    });
    
    if (response.ok && response.data?.status === 'Ok') {
      console.log('Lấy nhà cung cấp thành công');
      return response.data.data || [];
    } else {
      console.error('Không thể lấy danh sách nhà cung cấp:', response.problem);
      throw new Error('Không thể lấy danh sách nhà cung cấp');
    }
  } catch (error) {
    console.error('Lỗi trong fetchProviders:', error);
    throw error;
  }
};

// Add a new function to fetch inventory data for product selection
export const fetchInventoriesForProductSelection = async () => {
  try {
    console.log('Đang lấy dữ liệu tồn kho...');
    
    const timestamp = Date.now();
    const publicApi = create({
      baseURL: "http://10.0.2.2:5000/",
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Request-Time': timestamp.toString()
      },
      timeout: 15000
    });

    const response = await publicApi.get<ApiResponse<any[]>>('/inventory/available/json');
    
    if (response.ok && response.data?.status === 'Ok') {
      console.log('Lấy dữ liệu tồn kho thành công');
      return response.data.data || [];
    } else {
      console.error('Không thể lấy dữ liệu tồn kho:', response.problem);
      throw new Error(response.data?.message || 'Không thể lấy dữ liệu tồn kho');
    }
  } catch (error) {
    console.error('Lỗi trong fetchInventoriesForProductSelection:', error);
    throw error;
  }
};

export default {
  fetchProducts,
  addProduct,
  fetchCategories,
  fetchProviders,
  fetchInventoriesForProductSelection,
};