const admin = require('firebase-admin');
const path = require('path');

// Đường dẫn tới file serviceAccountKey.json
const serviceAccount = require('./serviceAccountKey.json');

// Khởi tạo Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = admin;