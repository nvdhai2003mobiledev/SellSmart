const Variant = require('../models/Variant');

// Lấy danh sách biến thể
const getVariants = async (req, res) => {
    try {
        const variants = await Variant.find();
        res.render('variants', { variants });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi lấy danh sách biến thể' });
    }
};

// Lấy danh sách biến thể dưới dạng JSON
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

// Thêm biến thể mới, chỉ kiểm tra trùng values, name có thể trùng
const addVariant = async (req, res) => {
    try {
        console.log("Dữ liệu nhận được:", req.body);

        let { name, values } = req.body;
        if (!name || !values || !Array.isArray(values) || values.length === 0) {
            return res.status(400).json({
                status: 'Error',
                message: 'Tên và giá trị biến thể (danh sách) là bắt buộc'
            });
        }

        // Chuẩn hóa giá trị của biến thể thành mảng không trùng lặp
        values = [...new Set(values.map(value => value.trim()))];

        // Kiểm tra xem bất kỳ biến thể nào đã có values này chưa
        const existingVariant = await Variant.findOne({ values: { $in: values } });
        if (existingVariant) {
            return res.status(400).json({
                status: 'Error',
                message: `Biến thể với một hoặc nhiều giá trị "${values.join(', ')}" đã tồn tại`
            });
        }

        // Nếu chưa tồn tại, tạo biến thể mới
        const newVariant = await Variant.create({ name, values });

        res.status(201).json({
            status: 'Ok',
            message: 'Biến thể được tạo thành công',
            data: newVariant
        });
    } catch (error) {
        console.error("Lỗi:", error);
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
    getVariantsAsJson,
    addVariant,
    deleteVariant,
};
