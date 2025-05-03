const express = require("express");
const router = express.Router();
const employeeRouter = require("./employee");
const customerRouter = require("../../routes/customer");
const providerRouter = require("../../routes/provider");
const warrantyRequestController = require('../../controllers/warrantyRequestController');

// API routes dành cho mobile app
router.use("/employees", employeeRouter);
router.use("/customers", customerRouter);
router.use("/providers", providerRouter);

// Warranty API routes
router.post('/check-warranty-match', warrantyRequestController.checkWarrantyMatch);

// Thêm các API route khác ở đây khi cần
// router.use('/products', productRouter);
// router.use('/orders', orderRouter);

module.exports = router;
