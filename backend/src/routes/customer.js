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

// 📌 Thêm khách hàng (POST) - Route cũ yêu cầu xác thực
router.post("/", protect, customerController.addCustomer);

// 📌 Thêm khách hàng không cần xác thực (POST cho mobile app)
router.post("/api/customers", customerController.addCustomer);

// 📌 Route thêm khách hàng đơn giản không yêu cầu xác thực
router.post("/", customerController.addCustomer);

// 📌 Route mới thêm khách hàng cho mobile app (không cần xác thực)
router.post("/customers", customerController.addCustomer);

// 📌 ROUTE MOBILE KHÔNG YÊU CẦU XÁC THỰC - THÊM KHÁCH HÀNG
router.post("/mobile/customers/add", customerController.addCustomer);

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
router.get("/customers/search", customerController.searchCustomerByPhone);
router.get("/api/customers/search", customerController.searchCustomerByPhone);

// 📌 API cập nhật khách hàng công khai (không cần xác thực)
router.put("/update/:customerId", customerController.updateCustomer);

// 📌 Route cập nhật khách hàng công khai theo đường dẫn mới
router.put("/customers/update/:customerId", customerController.updateCustomer);

// 📌 ROUTE DÀNH CHO MOBILE APP - KHÔNG YÊU CẦU XÁC THỰC
router.put("/mobile/customers/update/:customerId", customerController.updateCustomer); // Cập nhật không xác thực

// 📌 Route mới cho mobile app - API endpoints - KHÔNG YÊU CẦU XÁC THỰC
router.post("/api/customers", customerController.addCustomer); // Thêm khách hàng
router.put("/api/customers/:customerId", customerController.updateCustomer); // Cập nhật khách hàng
router.get("/api/customers", customerController.getCustomerAsJson); // Lấy danh sách
router.get("/api/customers/:customerId", customerController.getCustomerById); // Lấy chi tiết

module.exports = router;
