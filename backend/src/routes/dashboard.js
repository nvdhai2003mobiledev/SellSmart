const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");

// Tất cả routes ở đây đều yêu cầu đăng nhập và phải là admin
router.use(protect);
router.use(authorize("admin"));

// Định nghĩa routes
// router.get("/", getDashboard);

module.exports = router;
