const DetailsVariant = require('../models/DetailsVariant');
const Variant = require('../models/Variant');

// Lấy danh sách tất cả DetailsVariant
const getAllDetailsVariants = async (req, res) => {
    try {
        const detailsVariants = await DetailsVariant.find().populate('variantId');
        res.status(200).json({
            status: 'Ok',
            data: detailsVariants
        });
    } catch (error) {
        res.status(500).json({
            status: 'Error',
            message: error.message
        });
    }
};

// Lấy danh sách DetailsVariant theo variantId
const getDetailsByVariant = async (req, res) => {
    try {
        const { variantId } = req.params;
        const detailsVariants = await DetailsVariant.find({ variantId }).populate('variantId');
        res.status(200).json({
            status: 'Ok',
            data: detailsVariants
        });
    } catch (error) {
        res.status(500).json({
            status: 'Error',
            message: error.message
        });
    }
};

// Thêm một DetailsVariant mới
const addDetailsVariant = async (req, res) => {
    try {
        console.log("Dữ liệu nhận được:", req.body);
        
        const { variantId, value, price, compareAtPrice, inventory } = req.body;
        
        // Kiểm tra xem variant có tồn tại không
        const variant = await Variant.findById(variantId);
        if (!variant) {
            return res.status(400).json({
                status: 'Error',
                message: 'Biến thể không tồn tại'
            });
        }
        
        // Kiểm tra giá trị value có nằm trong danh sách của Variant không
        if (!variant.values.includes(value)) {
            return res.status(400).json({
                status: 'Error',
                message: `Giá trị '${value}' không hợp lệ cho biến thể này`
            });
        }
        
        // Tạo mới DetailsVariant
        const newDetailsVariant = new DetailsVariant({
            variantId,
            value,
            price,
            compareAtPrice,
            inventory
        });

        await newDetailsVariant.save();
        res.status(201).json({
            status: 'Ok',
            message: 'DetailsVariant được tạo thành công',
            data: newDetailsVariant
        });
    } catch (error) {
        console.error("Lỗi:", error);
        res.status(500).json({
            status: 'Error',
            message: error.message
        });
    }
};

// Xóa một DetailsVariant
const deleteDetailsVariant = async (req, res) => {
    try {
        const { detailsVariantId } = req.params;
        await DetailsVariant.findByIdAndDelete(detailsVariantId);
        res.status(200).json({
            status: 'Ok',
            message: 'DetailsVariant đã được xóa'
        });
    } catch (error) {
        res.status(500).json({
            status: 'Error',
            message: error.message
        });
    }
};

module.exports = {
    getAllDetailsVariants,
    getDetailsByVariant,
    addDetailsVariant,
    deleteDetailsVariant
};
