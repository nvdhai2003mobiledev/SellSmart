const Variant = require('../models/Variant');

// Lấy danh sách biến thể
const getVariants = async (req, res) => {
    try {
        const variants = await Variant.find(); // Lấy tất cả biến thể
        res.render('variants', { variants }); // Render ra view "variants.ejs"
    } catch (error) {
        console.error(error); // Ghi log lỗi
        res.status(500).json({ message: 'Lỗi khi lấy danh sách biến thể' });
    }
};

const getVariantsAsJson = async (req, res) => {
    try {
        const variants = await Variant.find();
        res.status(200).json({
            status: 'Ok',
            data: variants
        });
    } catch (error) {
        res.status(500).json({
            status: 'Error',
            message: error.message
        });
    }
};

// Thêm biến thể mới
const addVariant = async (req, res) => {
    try {
        const { name, values } = req.body;

        if (!name || !values || !Array.isArray(values)) {
            return res.status(400).json({
                status: 'Error',
                message: 'Tên và giá trị biến thể là bắt buộc và values phải là mảng'
            });
        }

        const existingVariant = await Variant.findOne({ name });
        if (existingVariant) {
            return res.status(400).json({
                status: 'Error',
                message: 'Biến thể đã tồn tại'
            });
        }

        const newVariant = await Variant.create({ name, values });

        res.status(201).json({
            status: 'Ok',
            message: 'Biến thể được tạo thành công',
            data: newVariant
        });
    } catch (error) {
        res.status(500).json({
            status: 'Error',
            message: error.message
        });
    }
};

// Xóa biến thể
const deleteVariant = async (req, res) => {
    try {
        const { variantId } = req.params;
        await Variant.findByIdAndDelete(variantId);
        res.status(200).json({
            status: 'Ok',
            message: 'Biến thể đã được xóa'
        });
    } catch (error) {
        res.status(500).json({
            status: 'Error',
            message: error.message
        });
    }
};

module.exports = {
    getVariants,
    addVariant,
    deleteVariant,
    getVariantsAsJson,
};
