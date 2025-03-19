const DetailsVariant = require('../models/DetailsVariant');
const Variant = require('../models/Variant');

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

const addDetailsVariant = async (req, res) => {
    try {
        console.log("Dữ liệu nhận được:", req.body);
        const { variantId, value, price, compareAtPrice, inventory } = req.body;
        
        const variant = await Variant.findById(variantId);
        if (!variant) {
            return res.status(400).json({
                status: 'Error',
                message: 'Biến thể không tồn tại'
            });
        }
        
        if (!variant.values.includes(value)) {
            return res.status(400).json({
                status: 'Error',
                message: `Giá trị '${value}' không hợp lệ cho biến thể này`
            });
        }
        
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