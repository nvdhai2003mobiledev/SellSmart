const express = require('express');
const router = express.Router();
const SupplierController = require('../controllers/SupplierController');

router.get('/', SupplierController.getAllSuppliers); //lấy danh sách
router.post('/create', SupplierController.createSupplier); // thêm 
router.delete('/:id', SupplierController.deleteSupplier); // xóa
router.get('/:id', SupplierController.getSupplierById); // tìm kiêm nhà cung cấp theo ID
router.put('/:id', SupplierController.updateSupplier); // cập nhật
module.exports = router;
