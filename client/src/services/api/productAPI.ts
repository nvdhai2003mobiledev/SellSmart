import { Api } from './api';
import { ApiEndpoint } from './api-endpoint';
import { rootStore } from '../../models/root-store';

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
  category: string;
  status: 'available' | 'unavailable';
  price: number;
  variants?: Array<{
    price: number;
    inventory: number;
  }>;
}

// Hàm lấy danh sách sản phẩm
export const fetchProducts = async () => {
  try {
    console.log('Đang lấy danh sách sản phẩm...');

    // Sử dụng đường dẫn API chính xác từ ApiEndpoint
    const response = await Api.get<ApiResponse<Product[]>>(ApiEndpoint.PRODUCTS);
    console.log('Response từ API sản phẩm:', {
      status: response.status,
      ok: response.ok,
      data: response.data
    });

    if (response.ok && response.data?.success) {
      console.log('Lấy sản phẩm thành công (format success):', response.data);
      return response.data.data || [];
    } else if (response.ok && Array.isArray(response.data?.data)) {
      // API trả về theo format cũ
      console.log('Lấy sản phẩm thành công (format array):', response.data);
      return response.data.data || [];
    } else if (response.ok && response.data?.status === 'Ok') {
      // API trả về theo format status: 'Ok'
      console.log('Lấy sản phẩm thành công (format Ok):', response.data);
      return response.data.data || [];
    } else {
      // Kiểm tra nếu là lỗi xác thực
      if (response.status === 401) {
        console.log('Phiên đăng nhập hết hạn, tiến hành refresh token...');
        const authStore = rootStore.auth;
        
        // Thử refresh token
        const refreshSuccess = await authStore.refreshAccessToken();
        console.log('Kết quả refresh token:', refreshSuccess);
        
        if (refreshSuccess) {
          // Thử lại request sau khi refresh token thành công
          console.log('Thử lại request sau khi refresh token thành công');
          const retryResponse = await Api.get<ApiResponse<Product[]>>(ApiEndpoint.PRODUCTS);
          console.log('Kết quả retry:', {
            status: retryResponse.status,
            ok: retryResponse.ok,
            data: retryResponse.data
          });
          
          if (retryResponse.ok && retryResponse.data?.success) {
            return retryResponse.data.data || [];
          } else if (retryResponse.ok && Array.isArray(retryResponse.data?.data)) {
            return retryResponse.data.data || [];
          } else if (retryResponse.ok && retryResponse.data?.status === 'Ok') {
            return retryResponse.data.data || [];
          } else {
            console.error('Vẫn không thể lấy sản phẩm sau khi refresh token:', retryResponse);
            throw new Error('Không thể tải danh sách sản phẩm sau khi làm mới phiên đăng nhập');
          }
        } else {
          // Nếu refresh token thất bại, clear auth và throw error
          console.error('Refresh token thất bại, đăng xuất người dùng');
          authStore.clearAuth();
          throw new Error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
        }
      }
      
      console.error('Không thể lấy danh sách sản phẩm:', response.problem, response.data);
      throw new Error(response.data?.message || 'Không thể lấy danh sách sản phẩm');
    }
  } catch (error) {
    console.error('Lỗi trong fetchProducts:', error);
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

export default {
  fetchProducts,
  addProduct,
};