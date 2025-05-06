import {create, ApiResponse} from 'apisauce';
import {rootStore} from '../../models/root-store';
import {ApiEndpoint} from './api-endpoint';
import {EmployeeResponse} from '../../models/employee/employee';

// Cấu hình BASE_URL
// Sử dụng IP máy chủ trong mạng nội bộ
// const BASE_URL = 'http://192.168.0.126:5000/';

// Các tùy chọn khác (để khi cần thay đổi)
// const BASE_URL = 'http://10.0.2.2:3000/'; // Cho Android Emulator
const BASE_URL = 'http://192.168.1.170:5000/'; // Server IP (works on real devices)
// const BASE_URL = 'http://localhost:5000/'; // Cho máy local



// API response types
export interface GeneralApiResponse {
  success: boolean;
  message?: string;
  data?: any;
}

// Problem types
export type GeneralApiProblem =
  | {kind: 'timeout'; temporary: true}
  | {kind: 'cannot-connect'; temporary: true}
  | {kind: 'server'}
  | {kind: 'unauthorized'}
  | {kind: 'forbidden'}
  | {kind: 'not-found'}
  | {kind: 'rejected'}
  | {kind: 'unknown'; temporary: true}
  | {kind: 'bad-data'};

// Result types
export type GetEmployeesResult = 
  | {kind: 'ok'; employees: EmployeeResponse[]}
  | GeneralApiProblem;

export type GeneralApiResult = 
  | {kind: 'ok'}
  | GeneralApiProblem;

export type LoginResult = 
  | {kind: 'ok'; data: any}
  | GeneralApiProblem;

// Helper function to convert API errors into problem objects
export function getGeneralApiProblem(response: ApiResponse<any>): GeneralApiProblem | void {
  if (!response.ok) {
    switch (response.status) {
      case 401:
        return {kind: 'unauthorized'};
      case 403:
        return {kind: 'forbidden'};
      case 404:
        return {kind: 'not-found'};
      case 500:
        return {kind: 'server'};
      case 503:
        return {kind: 'server'};
      default:
        return {kind: 'unknown', temporary: true};
    }
  }
  return;
}

export const Api = create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 30000,
});

// Add request transform để thêm token vào header của request
Api.addRequestTransform(async request => {
  try {
    const {auth} = rootStore || {};
    
    if (!auth) {
      return;
    }
    
    // Nếu endpoint là refresh-token hoặc login, không cần thêm token
    if (request.url === ApiEndpoint.REFRESH_TOKEN || request.url === ApiEndpoint.LOGIN) {
      return;
    }
    
    // Kiểm tra nếu token sắp hết hạn thì refresh trước
    if (auth.shouldRefreshToken && auth.refreshToken) {
      await auth.refreshAccessToken();
    }
    
    const token = auth.accessToken;
    
    if (token && request.headers) {
      request.headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Error in request transform:', error);
  }
});

// Add response transform
Api.addResponseTransform(response => {
  try {
    console.log('API Full Response:', response);
    if (!response.ok) {
      // Xử lý các lỗi cụ thể
      let errorMessage = 'Đã xảy ra lỗi';
      if (response.status === 401) {
        errorMessage = 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại';
        // Nếu token không hợp lệ, clear auth
        if (rootStore && rootStore.auth) {
          rootStore.auth.clearAuth();
        }
      } else if (response.status === 403) {
        errorMessage = 'Bạn không có quyền truy cập tính năng này';
      }
      
      response.data = {
        success: false,
        message: response.data?.message || errorMessage,
        data: null,
      };
    }
  } catch (error) {
    console.error('Error in response transform:', error);
  }
});

// Add monitor for debugging
Api.addMonitor(response => {
  console.log('API Response:', {
    url: response.config?.url,
    method: response.config?.method,
    headers: response.config?.headers,
    status: response.status,
    data: response.data,
  });
});

// API Service object with all API methods
export const ApiService = {
  async getEmployees(): Promise<GetEmployeesResult> {
    const response: ApiResponse<any> = await Api.get(
      ApiEndpoint.EMPLOYEES,
    );

    if (!response.ok) {
      const problem = getGeneralApiProblem(response);
      if (problem) return problem;
    }

    try {
      const employees = response.data?.data || [];
      return {kind: 'ok', employees};
    } catch (error: any) {
      if (__DEV__) console.log(error.message);
      return {kind: 'bad-data'};
    }
  },

  async createEmployee(employeeData: any): Promise<GeneralApiResult> {
    const response: ApiResponse<any> = await Api.post(
      ApiEndpoint.EMPLOYEES,
      employeeData,
    );

    if (!response.ok) {
      const problem = getGeneralApiProblem(response);
      if (problem) return problem;
    }

    return {kind: 'ok'};
  },

  async updateEmployee(id: string, employeeData: any): Promise<GeneralApiResult> {
    const response: ApiResponse<any> = await Api.put(
      `${ApiEndpoint.EMPLOYEES}/${id}`,
      employeeData,
    );

    if (!response.ok) {
      const problem = getGeneralApiProblem(response);
      if (problem) return problem;
    }

    return {kind: 'ok'};
  },

  async deleteEmployee(id: string): Promise<GeneralApiResult> {
    const response: ApiResponse<any> = await Api.delete(
      `${ApiEndpoint.EMPLOYEES}/${id}`,
    );

    if (!response.ok) {
      const problem = getGeneralApiProblem(response);
      if (problem) return problem;
    }

    return {kind: 'ok'};
  }
};





