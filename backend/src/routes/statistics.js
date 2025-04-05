const express = require("express");
const router = express.Router();
const statisticsController = require("../controllers/StatisticsController");
const { protect } = require("../middleware/auth");

// Thống kê sản phẩm
router.get("/products", protect, statisticsController.getProductStatistics);
router.get("/products/inventory", protect, statisticsController.getInventoryProducts);
router.get("/products/best-selling", protect, statisticsController.getBestSellingProducts);

// Thống kê doanh thu
router.get("/revenue", protect, statisticsController.getRevenueStatistics);

// Thống kê thanh toán
router.get("/payments", protect, statisticsController.getPaymentStatistics);

module.exports = router; 