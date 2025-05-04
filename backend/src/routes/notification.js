const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/NotificationController");
const { protect } = require("../middleware/auth");

// Route đăng ký token FCM - không yêu cầu xác thực để hỗ trợ thiết bị chưa đăng nhập
router.post("/register-token", notificationController.registerToken);

// Route tạo token FCM mẫu để test - không yêu cầu xác thực để dễ dàng sử dụng
router.post("/create-sample-token", notificationController.createSampleToken);

// Route test gửi thông báo - không yêu cầu xác thực để hỗ trợ thiết bị chưa đăng nhập
router.post("/send-test", notificationController.sendTestNotification);

module.exports = router;