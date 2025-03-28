const express = require("express");
const router = express.Router();
const customerController = require("../controllers/CustomerController");
const { protect } = require("../middleware/auth");

// 📌 Lấy danh sách khách hàng
router.get("/", protect, customerController.getCustomers);
router.get("/json", customerController.getCustomerAsJson);
router.get("/customers/json", customerController.getCustomerAsJson);


// 📌 Lấy khách hàng theo ID
router.get(
  "/customers/:customerId",
  protect,
  customerController.getCustomerById,
);
router.post("/", customerController.createCustomerFromOrder);

// 📌 Thêm khách hàng (POST)
router.post("/", protect, customerController.addCustomer);

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

// 📌 Tìm kiếm khách hàng theo số điện thoại
router.get("/customers/search", protect, customerController.searchCustomerByPhone);


module.exports = router;
