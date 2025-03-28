import {create, ApiResponse} from 'apisauce';
import {rootStore} from '../../models/root-store';
import {ApiEndpoint} from './api-endpoint';
import {EmployeeResponse} from '../../models/employee/employee';

const BASE_URL = "http://10.0.2.2:3000";

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
      console.log('rootStore or auth is not initialized yet');
      return;
    }
    
    // Kiểm tra nếu có tokenExpiryTime và token sắp hết hạn
    if (auth.tokenExpiryTime && Date.now() > auth.tokenExpiryTime - 300000) { // 5 phút
      console.log('Token sắp hết hạn, tiến hành refresh', {
        tokenExpiryTime: new Date(auth.tokenExpiryTime).toISOString(),
        currentTime: new Date().toISOString(),
        timeLeft: (auth.tokenExpiryTime - Date.now()) / 1000,
        requestUrl: request.url,
      });
      
      // Thử refresh token, nếu không thành công và token đã hết hạn thì clear auth
      if (auth.refreshToken) {
        try {
          // Tạo request mới để tránh vòng lặp vô hạn
          const refreshApi = create({
            baseURL: BASE_URL,
            headers: {'Content-Type': 'application/json'},
          });
          
          console.log('Gửi request refresh token');
          const response = await refreshApi.post('/refresh-token', {
            refreshToken: auth.refreshToken,
          });
          
          console.log('Nhận phản hồi refresh token:', {
            status: response.status,
            ok: response.ok,
            data: response.data,
          });
          
          const data = response.data as GeneralApiResponse;
          if (response.ok && data?.success) {
            console.log('Refresh token thành công, cập nhật token mới');
            const accessToken = data.data?.accessToken;
            auth.updateAccessToken(accessToken);
            // Lưu thông tin token mới được thực hiện trong action riêng
          } else {
            console.log('Refresh token thất bại, đăng xuất', {
              status: response.status,
              message: data?.message,
            });
            auth.clearAuth();
          }
        } catch (error) {
          console.error('Lỗi khi refresh token:', error);
          // Nếu token đã hết hạn, clear auth
          if (Date.now() > auth.tokenExpiryTime) {
            console.log('Token đã hết hạn, đăng xuất người dùng');
            auth.clearAuth();
          }
        }
      } else if (Date.now() > auth.tokenExpiryTime) {
        console.log('Token đã hết hạn và không có refresh token, đăng xuất');
        auth.clearAuth();
      }
    }
    
    const token = auth.accessToken;
    
    console.log('=== API REQUEST ===');
    console.log('URL:', request.url);
    console.log('Token:', token ? `${token.substring(0, 15)}...` : 'NO TOKEN');
    
    if (token && request.headers) {
      request.headers['Authorization'] = `Bearer ${token}`;
      console.log('Added token to request headers');
    } else {
      console.log('No token available or headers undefined');
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

    try {
      return {kind: 'ok'};
    } catch (error: any) {
      if (__DEV__) console.log(error.message);
      return {kind: 'bad-data'};
    }
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

    try {
      return {kind: 'ok'};
    } catch (error: any) {
      if (__DEV__) console.log(error.message);
      return {kind: 'bad-data'};
    }
  },

  async deleteEmployee(id: string): Promise<GeneralApiResult> {
    const response: ApiResponse<any> = await Api.delete(
      `${ApiEndpoint.EMPLOYEES}/${id}`,
    );

    if (!response.ok) {
      const problem = getGeneralApiProblem(response);
      if (problem) return problem;
    }

    try {
      return {kind: 'ok'};
    } catch (error: any) {
      if (__DEV__) console.log(error.message);
      return {kind: 'bad-data'};
    }
  }
};
