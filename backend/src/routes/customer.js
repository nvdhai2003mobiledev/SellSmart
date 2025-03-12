const express = require("express");
const router = express.Router();
const customerController = require("../controllers/CustomerController");
const { protect } = require("../middleware/auth");

// 📌 Lấy danh sách khách hàng
router.get("/", protect, customerController.getCustomers);
router.get("/customers/json", customerController.getCustomerAsJson);

// 📌 Lấy khách hàng theo ID
router.get(
  "/customers/:customerId",
  protect,
  customerController.getCustomerById,
);

// 📌 Thêm khách hàng (POST)
router.post("/customers", protect, customerController.addCustomer);

// 📌 Cập nhật khách hàng (PUT)
router.put(
  "/customers/:customerId",
  protect,
  customerController.updateCustomer,
);

// 📌 Xóa khách hàng (DELETE)
router.delete(
  "/customers/:customerId",
  protect,
  customerController.deleteCustomer,
);

module.exports = router;
