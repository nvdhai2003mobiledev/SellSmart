const express = require("express");
const router = express.Router();
const orderController = require("../controllers/OrderController");
const orderService = require("../services/OrderService");
const { protect } = require("../middleware/auth");

router.post("/", orderController.createOrder);
router.get("/", protect, orderController.getAllOrders);
// router.get('/:id', orderController.getOrderById);
router.put("/:id/status", orderController.updateOrderStatus);
router.delete("/:id", orderController.deleteOrder);
router.get("/create", protect, orderController.createOrderScreen);
router.get("/:id/detail", protect, orderController.getOrderDetail);

module.exports = router;
