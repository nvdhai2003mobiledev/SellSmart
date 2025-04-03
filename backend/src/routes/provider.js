const express = require("express");
const router = express.Router();
const providerController = require("../controllers/ProviderController");
const { protect } = require("../middleware/auth");

// Lấy danh sách tất cả nhà cung cấp
router.get("/", protect, providerController.getAllProviders);

// Tìm kiếm nhà cung cấp theo số điện thoại
router.get("/search/phone", protect, providerController.searchProviderByPhone);

// Lấy thông tin một nhà cung cấp theo ID
router.get("/:id", protect, providerController.getProviderById);

// Thêm mới một nhà cung cấp
router.post("/", protect, providerController.createProvider);

// Cập nhật thông tin nhà cung cấp theo ID
router.put("/:id", protect, providerController.updateProvider);

// Xóa một nhà cung cấp theo ID
router.delete("/:id", protect, providerController.deleteProvider);

module.exports = router;
