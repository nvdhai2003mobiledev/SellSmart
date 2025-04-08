const express = require('express');
const router = express.Router();
const Document = require('../models/Document');
const Product = require('../models/Product');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const documentController = require('../controllers/DocumentController');
const PublicDocumentController = require('../controllers/PublicDocumentController');

// Trang quản lý tài liệu
router.get('/', protect, documentController.getAllDocuments);

// Thêm tài liệu mới
router.post('/add', protect, documentController.createDocument);

// Hiển thị form tạo tài liệu (tùy chọn)
router.get('/create', protect, documentController.createDocumentScreen);

// Hiển thị form chỉnh sửa
router.get('/edit/:id', protect, async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id).populate('product_id user_id');
        const products = await Product.find();
        const users = await User.find();
        res.render('edit_document', { 
            doc, 
            products, 
            users, 
            success_msg: req.flash('success'), 
            error_msg: req.flash('error') 
        });
    } catch (err) {
        req.flash('error', 'Không thể tải tài liệu');
        res.redirect('/document');
    }
});

// Cập nhật tài liệu
router.put('/edit/:id', protect, documentController.updateDocument);

// Xóa tài liệu
router.delete('/delete/:id', protect, documentController.deleteDocument);

// Route cho trang danh sách tài liệu công khai
router.get('/public', PublicDocumentController.getPublicDocuments);

// Route cho trang chi tiết tài liệu của sản phẩm
router.get('/product/:id', PublicDocumentController.getProductDocuments);

module.exports = router;