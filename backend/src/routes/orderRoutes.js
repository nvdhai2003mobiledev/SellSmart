const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const orderService = require('../services/orderService');
const { protect } = require("../middleware/auth");

router.post('/', orderController.createOrder);
router.get('/', protect,orderController.getAllOrders);
// router.get('/:id', orderController.getOrderById);
router.put('/:id/status', orderController.updateOrderStatus);
router.delete('/:id',protect, orderController.deleteOrder);
router.get('/create',protect,orderController.createOrderScreen);


module.exports = router;
