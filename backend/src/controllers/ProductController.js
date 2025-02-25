const productService = require('../services/ProductService');
const Product = require('../models/Product');

// Lấy danh sách sản phẩm
const getProduct = async (req, res) => {
    try {
        const products = await Product.find(); // Lấy tất cả sản phẩm
        res.render('product', { products });
        // res.json(products); // Gửi danh sách sản phẩm
    } catch (error) {
        console.error(error); // Ghi log lỗi
        res.status(500).json({ message: 'Lỗi khi lấy danh sách sản phẩm' });
    }
};

// Thêm sản phẩm
const addProduct = async (req, res) => {
    try {
        console.log('req.body', req.body);
        const { name, price, thumbnail, description, category, stockQuantity, status } = req.body;

        // Kiểm tra input
        if (!name || !price || !thumbnail || !description || !category || !stockQuantity || !status) {
            return res.status(400).json({
                status: 'ERR',
                message: 'The input is required',
            });
        }

        const result = await productService.addProduct(req.body);
        if (result.status === 'Error') {
            return res.status(400).json(result);
        }

        return res.status(200).json(result);
    } catch (e) {
        console.error('Error:', e);
        return res.status(500).json({
            message: e.message || 'An error occurred',
        });
    }
};

// Cập nhật sản phẩm
const updateProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const updatedData = req.body;

        if (!productId) {
            return res.status(400).json({
                status: 'ERR',
                message: 'Product ID is required',
            });
        }

        const result = await productService.updateProduct(productId, updatedData);
        return res.status(result.status === 'Error' ? 400 : 200).json(result);
    } catch (e) {
        console.error('Error:', e);
        return res.status(500).json({
            message: e.message || 'An error occurred',
        });
    }
};

// Xóa sản phẩm
const deleteProduct = async (req, res) => {
    try {
        const { productId } = req.params;

        if (!productId) {
            return res.status(400).json({
                status: 'ERR',
                message: 'Product ID is required',
            });
        }

        const result = await productService.deleteProduct(productId);
        return res.status(result.status === 'Error' ? 400 : 200).json(result);
    } catch (e) {
        console.error('Error:', e);
        return res.status(500).json({
            message: e.message || 'An error occurred',
        });
    }
};

module.exports = {
    getProduct,
    addProduct,
    updateProduct,
    deleteProduct,
};
