const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const orderService = require("../services/OrderService");
const { protect } = require("../middleware/auth");

// POST routes
router.post("/", orderController.createOrder);

// PUT routes
router.put("/:id/status", orderController.updateOrderStatus);
router.put("/:id/payment", orderController.updateOrderPayment);

// DELETE routes
router.delete("/:id", orderController.deleteOrder);

// GET routes - specific endpoints first (no parameters)
router.get("/", protect, orderController.renderOrdersPage);
router.get("/create", protect, orderController.createOrderScreen);
router.get("/payment-stats", orderController.getPaymentStats);
router.get("/order-distribution", orderController.getOrderDistribution);
router.get("/employee-performance", orderController.getEmployeePerformance);
router.get("/daily-revenue", orderController.getDailyRevenue);
router.get("/list-json", orderController.getOrdersForDashboard);
router.get("/orders", orderController.getOrdersJson);
router.get("/mobile/list", orderController.getMobileOrdersList);

// Routes with ID parameters (must come after specific routes)
router.get("/:id/detail", protect, orderController.getOrderDetail);
router.get("/:id/detail-json", orderController.getOrderDetailJson);
router.get("/:id/json", orderController.getOrderDetailJson);

module.exports = router;
