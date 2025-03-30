const express = require("express");
const router = express.Router();
const orderController = require("../controllers/OrderController");
const orderService = require("../services/OrderService");
const { protect } = require("../middleware/auth");

router.post("/", orderController.createOrder);
router.get("/", protect, orderController.getAllOrders);
// router.get('/:id', orderController.getOrderById);
router.put("/:id/status", orderController.updateOrderStatus);
router.put("/:id/payment", orderController.updateOrderPayment);
router.delete("/:id", orderController.deleteOrder);
router.get("/create", protect, orderController.createOrderScreen);
router.get("/:id/detail", protect, orderController.getOrderDetail);



// Thêm API endpoints dành cho mobile, bỏ middleware protect
router.get("/orders", orderController.getOrdersJson); // API JSON cho mobile
router.get("/mobile/list", orderController.getMobileOrdersList);
module.exports = router;
