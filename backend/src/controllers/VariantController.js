const mongoose = require('mongoose');
const Variant = require('../models/Variant');
const Product = require('../models/Product');

// Lấy danh sách biến thể dạng JSON
const getVariantsAsJson = async (req, res) => {
    try {
        console.log('Bắt đầu lấy danh sách biến thể dạng JSON');
        const { page = 1, limit = 10, name } = req.query;
        const query = name ? { name: { $regex: name, $options: 'i' } } : {};

        const variants = await Variant.find(query)
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean();
        const total = await Variant.countDocuments(query);

        console.log(`Tìm thấy ${variants.length} biến thể, tổng: ${total}`);
        res.status(200).json({
            status: 'Ok',
            data: variants,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách biến thể:', {
            errorMessage: error.message,
            stack: error.stack
        });
        res.status(500).json({
            status: 'Error',
            message: 'Lỗi khi lấy danh sách biến thể: ' + error.message
        });
    }
};

// Thêm biến thể
const addVariant = async (req, res) => {
    try {
        console.log('Bắt đầu thêm biến thể mới', { body: req.body });

        const { name, values } = req.body;

        // Kiểm tra dữ liệu đầu vào
        if (!name || !values || !Array.isArray(values) || values.length === 0) {
            console.warn('Dữ liệu đầu vào không hợp lệ', { name, values });
            return res.status(400).json({
                status: 'Error',
                message: 'Tên và giá trị biến thể (danh sách) là bắt buộc'
            });
        }

        // Loại bỏ các giá trị trùng lặp, trim và kiểm tra giá trị hợp lệ
        const uniqueValues = [...new Set(values.map(value => {
            if (typeof value !== 'string') {
                throw new Error('Giá trị biến thể phải là chuỗi');
            }
            return value.trim();
        }))].filter(value => value.length > 0);

        if (uniqueValues.length === 0) {
            console.warn('Không có giá trị hợp lệ sau khi xử lý', { values });
            return res.status(400).json({
                status: 'Error',
                message: 'Danh sách giá trị biến thể không được rỗng sau khi xử lý'
            });
        }

        console.log('Dữ liệu sau khi xử lý', { name, uniqueValues });

        // Tạo biến thể mới
        const newVariant = await Variant.create({ name, values: uniqueValues });
        console.log('Biến thể đã được tạo thành công', { variantId: newVariant._id, name: newVariant.name });

        res.status(201).json({
            status: 'Ok',
            message: 'Biến thể được tạo thành công',
            data: newVariant
        });
    } catch (error) {
        console.error('Lỗi khi thêm biến thể:', {
            body: req.body,
            errorMessage: error.message,
            stack: error.stack
        });
        if (error.code === 11000) {
            return res.status(400).json({
                status: 'Error',
                message: 'Tên biến thể đã tồn tại'
            });
        }
        res.status(500).json({
            status: 'Error',
            message: 'Lỗi khi thêm biến thể: ' + error.message
        });
    }
};

// Xóa biến thể
const deleteVariant = async (req, res) => {
    try {
        console.log('Bắt đầu xóa biến thể', { variantId: req.params.variantId });

        const { variantId } = req.params;

        // Kiểm tra tính hợp lệ của variantId
        if (!mongoose.Types.ObjectId.isValid(variantId)) {
            console.warn('ID biến thể không hợp lệ', { variantId });
            return res.status(400).json({
                status: 'Error',
                message: 'ID biến thể không hợp lệ'
            });
        }

        // Kiểm tra xem biến thể có đang được sử dụng bởi sản phẩm nào không
        const productsUsingVariant = await Product.find({
            'variants.variantDetails.variantId': variantId
        }).lean();

        if (productsUsingVariant.length > 0) {
            console.warn('Biến thể đang được sử dụng bởi sản phẩm', { variantId, products: productsUsingVariant.length });
            return res.status(400).json({
                status: 'Error',
                message: 'Không thể xóa biến thể vì đang được sử dụng bởi một số sản phẩm'
            });
        }

        // Xóa biến thể
        const variant = await Variant.findByIdAndDelete(variantId);
        if (!variant) {
            console.warn('Biến thể không tồn tại', { variantId });
            return res.status(404).json({
                status: 'Error',
                message: 'Biến thể không tồn tại'
            });
        }

        console.log('Biến thể đã được xóa thành công', { variantId });
        res.status(200).json({
            status: 'Ok',
            message: 'Biến thể đã được xóa thành công'
        });
    } catch (error) {
        console.error('Lỗi khi xóa biến thể:', {
            variantId: req.params.variantId,
            errorMessage: error.message,
            stack: error.stack
        });
        res.status(500).json({
            status: 'Error',
            message: 'Lỗi khi xóa biến thể: ' + error.message
        });
    }
};

// Cập nhật biến thể
const updateVariant = async (req, res) => {
    try {
        console.log('Bắt đầu cập nhật biến thể', {
            variantId: req.params.variantId,
            body: req.body
        });

        const { variantId } = req.params;
        const { name, values } = req.body;

        // Kiểm tra tính hợp lệ của variantId
        if (!mongoose.Types.ObjectId.isValid(variantId)) {
            console.warn('ID biến thể không hợp lệ', { variantId });
            return res.status(400).json({
                status: 'Error',
                message: 'ID biến thể không hợp lệ'
            });
        }

        // Kiểm tra dữ liệu đầu vào
        if (!name || !values || !Array.isArray(values) || values.length === 0) {
            console.warn('Dữ liệu đầu vào không hợp lệ', { name, values });
            return res.status(400).json({
                status: 'Error',
                message: 'Tên và giá trị biến thể (danh sách) là bắt buộc'
            });
        }

        // Loại bỏ các giá trị trùng lặp, trim và kiểm tra giá trị hợp lệ
        const uniqueValues = [...new Set(values.map(value => {
            if (typeof value !== 'string') {
                throw new Error('Giá trị biến thể phải là chuỗi');
            }
            return value.trim();
        }))].filter(value => value.length > 0);

        if (uniqueValues.length === 0) {
            console.warn('Không có giá trị hợp lệ sau khi xử lý', { values });
            return res.status(400).json({
                status: 'Error',
                message: 'Danh sách giá trị biến thể không được rỗng sau khi xử lý'
            });
        }

        console.log('Dữ liệu sau khi xử lý', { name, uniqueValues });

        // Cập nhật biến thể
        const updatedVariant = await Variant.findByIdAndUpdate(
            variantId,
            { name, values: uniqueValues },
            { new: true, runValidators: true }
        );

        if (!updatedVariant) {
            console.warn('Biến thể không tồn tại', { variantId });
            return res.status(404).json({
                status: 'Error',
                message: 'Biến thể không tồn tại'
            });
        }

        console.log('Biến thể đã được cập nhật thành công', { variantId, name: updatedVariant.name });
        res.status(200).json({
            status: 'Ok',
            message: 'Cập nhật biến thể thành công',
            data: updatedVariant
        });
    } catch (error) {
        console.error('Lỗi khi cập nhật biến thể:', {
            variantId: req.params.variantId,
            body: req.body,
            errorMessage: error.message,
            stack: error.stack
        });
        if (error.code === 11000) {
            return res.status(400).json({
                status: 'Error',
                message: 'Tên biến thể đã tồn tại'
            });
        }
        res.status(500).json({
            status: 'Error',
            message: 'Lỗi khi cập nhật biến thể: ' + error.message
        });
    }
};

module.exports = {
    getVariantsAsJson,
    addVariant,
    deleteVariant,
    updateVariant
};