const express = require("express");
const router = express.Router();
const providerController = require("../controllers/ProviderController");
const { protect } = require("../middleware/auth");

// Lấy danh sách tất cả nhà cung cấp
router.get("/", protect, providerController.getAllProviders);

// Lấy thông tin một nhà cung cấp theo ID
router.get("/:id", providerController.getProviderById);

// Thêm mới một nhà cung cấp
router.post("/", providerController.createProvider);

// Cập nhật thông tin nhà cung cấp theo ID
router.put("/:id", providerController.updateProvider);

// Xóa một nhà cung cấp theo ID
router.delete("/:id", providerController.deleteProvider);

// Tìm kiếm nhà cung cấp theo số điện thoại
router.get("/search/phone", providerController.searchProviderByPhone);

module.exports = router;
