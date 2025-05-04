const axios = require('axios');

// Token mẫu - bạn có thể thay đổi thành token thực từ thiết bị của bạn nếu có
const sampleToken = 'fcm_sample_token_' + Date.now();

// URL của API đăng ký token
const apiUrl = 'http://localhost:5000/notifications/create-sample-token';

// Gọi API đăng ký token
async function registerSampleToken() {
  try {
    console.log('Đăng ký token mẫu:', sampleToken);
    
    const response = await axios.post(apiUrl, { token: sampleToken });
    
    console.log('Kết quả đăng ký token mẫu:', response.data);
    console.log('\nToken đã được đăng ký thành công!');
    console.log('Bây giờ bạn có thể tạo sản phẩm mới và thông báo sẽ được gửi đến token này.');
  } catch (error) {
    console.error('Lỗi khi đăng ký token mẫu:', error.response ? error.response.data : error.message);
  }
}

// Thực thi hàm đăng ký token
registerSampleToken();
