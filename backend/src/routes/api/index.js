const express = require("express");
const router = express.Router();
const employeeRouter = require("./employee");

// API routes dành cho mobile app
router.use("/employees", employeeRouter);

// Thêm các API route khác ở đây khi cần
// router.use('/products', productRouter);
// router.use('/customers', customerRouter);
// router.use('/orders', orderRouter);

module.exports = router;
