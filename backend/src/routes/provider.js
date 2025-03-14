const express = require('express');
const router = express.Router();
const providerController = require('../controllers/ProviderController');

// Lấy danh sách tất cả nhà cung cấp
router.get('/', providerController.getAllProviders);

// Lấy thông tin một nhà cung cấp theo ID
router.get('/:id', providerController.getProviderById);

// Thêm mới một nhà cung cấp
router.post('/', providerController.createProvider);

// Cập nhật thông tin nhà cung cấp theo ID
router.put('/:id', providerController.updateProvider);

// Xóa một nhà cung cấp theo ID
router.delete('/:id', providerController.deleteProvider);

module.exports = router;
