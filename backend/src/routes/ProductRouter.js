const express = require('express');
const router = express.Router();
const productController = require('../../src/controllers/ProductController');

// Lấy danh sách sản phẩm
router.get('/', productController.getProduct);
router.get('/json/', productController.getProduct);

// Thêm sản phẩm
router.post('/create', productController.addProduct);

// Cập nhật sản phẩm
router.put('/update/:productId', productController.updateProduct);

// Xóa sản phẩm
router.delete('/delete/:productId', productController.deleteProduct);

module.exports = router;
