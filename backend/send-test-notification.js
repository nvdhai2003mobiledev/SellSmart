const axios = require('axios');

// URL cu1ee7a API gu1eedi thu00f4ng bu00e1o test
const apiUrl = 'http://localhost:8000/notifications/create-sample-token';
const testNotificationUrl = 'http://localhost:8000/notifications/send-test';

// Lu1ea5y token tu1eeb command line arguments hou1eb7c su1eed du1ee5ng token mu1eabu
// Hu00e3y thay token mu1eabu bu1eb1ng token thu1ef1c tu1ebf tu1eeb thiu1ebft bu1ecb cu1ee7a bu1ea1n
const sampleToken = process.argv[2] || 'YOUR_DEVICE_FCM_TOKEN_HERE';

// Gu1ecdi API u0111u0103ng ku00fd token vu00e0 gu1eedi thu00f4ng bu00e1o test
async function sendTestNotification() {
  try {
    console.log('Bu1eaft u0111u1ea7u gu1eedi thu00f4ng bu00e1o test...');
    
    // u0110u1ea3m bu1ea3o token u0111u00e3 u0111u01b0u1ee3c u0111u0103ng ku00fd
    console.log('Su1eed du1ee5ng token:', sampleToken);
    
    try {
      const registerResponse = await axios.post(apiUrl, { token: sampleToken });
      console.log('u0110u0103ng ku00fd token thu00e0nh cu00f4ng:', registerResponse.data);
    } catch (registerError) {
      console.error('Lu1ed7i khi u0111u0103ng ku00fd token:', registerError.message);
    }
    
    // Gu1eedi thu00f4ng bu00e1o test
    console.log('\nGu1eedi thu00f4ng bu00e1o test...');
    
    // URL hu00ecnh u1ea3nh mu1eabu cho thu00f4ng bu00e1o - hu00e3y thay u0111u1ed5i URL nu00e0y thu00e0nh URL hu00ecnh u1ea3nh thu1ef1c tu1ebf
    const imageUrl = 'https://firebasestorage.googleapis.com/v0/b/sellsmart-app.appspot.com/o/product_images%2Fcamera.jpg?alt=media';
    
    const testNotification = {
      title: 'Su1ea3n phu1ea9m mu1edbi: Camera Sony A7',
      body: 'u0110iu1ec7n tu1eed - Cu00f4ng ty Apodio - 5.000.000 u0111',
      data: {
        screen: 'ProductDetail',
        productId: '123456789',
        type: 'NEW_PRODUCT',
        timestamp: Date.now().toString(),
        // Thu00eam URL hu00ecnh u1ea3nh
        imageUrl: imageUrl,
        // Thu00eam chu1ebf u0111u1ed9 hiu1ec3n thu1ecb
        display_mode: 'dialog',
        importance: 'high',
        priority: 'high',
        // Thu00eam thu00f4ng tin su1ea3n phu1ea9m
        productName: 'Camera Sony A7',
        productCategory: 'u0110iu1ec7n tu1eed',
        productProvider: 'Cu00f4ng ty Apodio',
        productPrice: '5000000'
      },
      token: sampleToken // Gu1eedi u0111u1ebfn token cu1ee5 thu1ec3
    };
    
    const response = await axios.post(testNotificationUrl, testNotification);
    
    console.log('Ku1ebft quu1ea3 gu1eedi thu00f4ng bu00e1o test:', response.data);
    console.log('\nThu00f4ng bu00e1o u0111u00e3 u0111u01b0u1ee3c gu1eedi!');
    console.log('Hu01b0u1edbng du1eabn:');
    console.log('1. Kiu1ec3m tra thiu1ebft bu1ecb cu1ee7a bu1ea1n u0111u1ec3 xem thu00f4ng bu00e1o');
    console.log('2. Nu1ebfu khu00f4ng thu1ea5y thu00f4ng bu00e1o, hu00e3y kiu1ec3m tra:');
    console.log('   - Quyu1ec1n thu00f4ng bu00e1o u0111u00e3 u0111u01b0u1ee3c cu1ea5p cho u1ee9ng du1ee5ng');
    console.log('   - Ku1ebft nu1ed1i internet');
    console.log('   - Cu1ea5u hu00ecnh Firebase');
    console.log('3. u0110u1ec3 su1eed du1ee5ng token thu1ef1c tu1ebf tu1eeb thiu1ebft bu1ecb:');
    console.log('   node send-test-notification.js YOUR_DEVICE_TOKEN');
  } catch (error) {
    console.error('Lu1ed7i khi gu1eedi thu00f4ng bu00e1o test:', error.response ? error.response.data : error.message);
  }
}

// Thu1ef1c thi hu00e0m gu1eedi thu00f4ng bu00e1o test
sendTestNotification();
