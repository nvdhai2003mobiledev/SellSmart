import { Api, GeneralApiProblem } from './api';

/**
 * Đăng ký FCM token với server
 */
export const registerFCMToken = async (token: string, deviceInfo?: any): Promise<{ kind: string } | GeneralApiProblem> => {
  try {
    // Gọi API đăng ký token
    const response = await Api.post('/notifications/register-token', {
      token,
      deviceInfo: deviceInfo || {
        platform: 'android',
        model: 'unknown',
      },
    });

    // Kiểm tra kết quả
    if (!response.ok) {
      console.error('Lỗi đăng ký FCM token:', response.problem);
      return { kind: 'bad-data' };
    }

    console.log('Đăng ký FCM token thành công');
    return { kind: 'ok' };
  } catch (error) {
    console.error('Lỗi đăng ký FCM token:', error);
    return { kind: 'bad-data' };
  }
};

/**
 * Gửi thông báo test
 */
export const sendTestNotification = async (token?: string): Promise<{ kind: string } | GeneralApiProblem> => {
  try {
    // Gọi API gửi thông báo test
    const response = await Api.post('/notifications/send-test', {
      token, // Nếu không cung cấp token, server sẽ gửi đến tất cả thiết bị
    });

    // Kiểm tra kết quả
    if (!response.ok) {
      console.error('Lỗi gửi thông báo test:', response.problem);
      return { kind: 'bad-data' };
    }

    console.log('Gửi thông báo test thành công');
    return { kind: 'ok' };
  } catch (error) {
    console.error('Lỗi gửi thông báo test:', error);
    return { kind: 'bad-data' };
  }
};
