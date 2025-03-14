const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const orderService = require('../services/orderService');


router.post('/', orderController.createOrder);
router.get('/', orderController.renderOrdersPage);
router.get('/:id', orderController.getOrderById);
router.put('/:id/status', orderController.updateOrderStatus);
router.delete('/:id', orderController.deleteOrder);


module.exports = router;
