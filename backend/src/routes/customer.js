const express = require("express");
const router = express.Router();
const customerController = require("../controllers/CustomerController");
const { protect, authorize } = require("../middleware/auth");
router.use(protect);
router.use(authorize("admin"));
// 📌 Lấy danh sách khách hàng
router.get("/customers", customerController.getCustomers);
router.get("/customers/json", customerController.getCustomerAsJson);

// 📌 Lấy khách hàng theo ID
router.get("/customers/:customerId", customerController.getCustomerById);

// 📌 Thêm khách hàng (POST)
router.post("/customers", customerController.addCustomer);

// 📌 Cập nhật khách hàng (PUT)
router.put("/customers/:customerId", customerController.updateCustomer);

// 📌 Xóa khách hàng (DELETE)
router.delete("/customers/:customerId", customerController.deleteCustomer);

module.exports = router;
