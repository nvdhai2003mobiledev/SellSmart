const mongoose = require('mongoose');
const Variant = require('../models/Variant');
const DetailsVariant = require('../models/DetailsVariant');

// Lấy danh sách biến thể kèm chi tiết biến thể
const getVariants = async (req, res) => {
    try {
        const variants = await Variant.find();
        const selectedVariantId = req.query.selectedVariantId; // Lấy từ query
        const variantsWithDetails = await Promise.all(variants.map(async (variant) => {
            const detailsVariants = await DetailsVariant.find({ variantId: variant._id });
            return { ...variant._doc, detailsVariants };
        }));
        res.render('dashboard/variants', { 
            variants: variantsWithDetails, 
            selectedVariantId // Truyền vào view
        });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách biến thể:', error);
        res.status(500).json({ message: 'Lỗi khi lấy danh sách biến thể' });
    }
};

// Các hàm khác giữ nguyên
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

const addVariant = async (req, res) => {
    try {
        console.log("Dữ liệu nhận được:", req.body);
        let { name, values, details } = req.body;

        if (!name || !values || !Array.isArray(values) || values.length === 0) {
            return res.status(400).json({
                status: 'Error',
                message: 'Tên và giá trị biến thể (danh sách) là bắt buộc'
            });
        }

        values = [...new Set(values.map(value => value.trim()))];
        const existingVariant = await Variant.findOne({ values: { $in: values } });
        if (existingVariant) {
            return res.status(400).json({
                status: 'Error',
                message: `Biến thể với một hoặc nhiều giá trị "${values.join(', ')}" đã tồn tại`
            });
        }

        const newVariant = await Variant.create({ name, values });
        const variantId = newVariant._id;

        const createdDetails = [];
        if (details && Array.isArray(details) && details.length > 0) {
            for (const detail of details) {
                const { value, price, compareAtPrice, inventory } = detail;
                if (!values.includes(value)) {
                    return res.status(400).json({
                        status: 'Error',
                        message: `Giá trị '${value}' không hợp lệ cho biến thể này`
                    });
                }
                const newDetail = new DetailsVariant({ variantId, value, price, compareAtPrice, inventory });
                await newDetail.save();
                createdDetails.push(newDetail);
            }
        }

        res.status(201).json({
            status: 'Ok',
            message: 'Biến thể và chi tiết được tạo thành công',
            data: { variant: newVariant, details: createdDetails }
        });
    } catch (error) {
        console.error("Lỗi:", error);
        res.status(500).json({
            status: 'Error',
            message: error.message
        });
    }
};

const deleteVariant = async (req, res) => {
    try {
        const { variantId } = req.params;
        await Variant.findByIdAndDelete(variantId);
        await DetailsVariant.deleteMany({ variantId });
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

const updateVariant = async (req, res) => {
    try {
        const { variantId } = req.params;
        const { name, values, details } = req.body;
        console.log('Dữ liệu nhận được:', { variantId, name, values, details });

        if (!mongoose.Types.ObjectId.isValid(variantId)) {
            return res.status(400).json({
                status: 'Error',
                message: 'ID biến thể không hợp lệ'
            });
        }

        if (!name || !values || !Array.isArray(values) || values.length === 0) {
            return res.status(400).json({
                status: 'Error',
                message: 'Tên và giá trị biến thể (danh sách) là bắt buộc'
            });
        }

        const updatedVariant = await Variant.findByIdAndUpdate(variantId, { name, values }, { new: true });
        if (!updatedVariant) {
            return res.status(404).json({ status: 'Error', message: 'Biến thể không tồn tại' });
        }

        if (details && Array.isArray(details)) {
            const existingDetails = await DetailsVariant.find({ variantId });
            const detailIdsToKeep = details.filter(d => d.id).map(d => d.id);

            await DetailsVariant.deleteMany({
                variantId,
                _id: { $nin: detailIdsToKeep }
            });

            const detailValues = details.map(d => d.value);
            if (new Set(detailValues).size !== detailValues.length) {
                return res.status(400).json({
                    status: 'Error',
                    message: 'Các giá trị trong chi tiết biến thể không được trùng lặp'
                });
            }

            for (const detail of details) {
                const { id, value, price, compareAtPrice, inventory } = detail;
                if (!values.includes(value)) {
                    return res.status(400).json({
                        status: 'Error',
                        message: `Giá trị '${value}' không hợp lệ cho biến thể này`
                    });
                }
                if (id) {
                    await DetailsVariant.findByIdAndUpdate(id, { value, price, compareAtPrice, inventory });
                } else {
                    const newDetail = new DetailsVariant({ variantId, value, price, compareAtPrice, inventory });
                    await newDetail.save();
                }
            }
        }

        res.status(200).json({
            status: 'Ok',
            message: 'Cập nhật biến thể và chi tiết thành công',
            data: updatedVariant
        });
    } catch (error) {
        console.error("Lỗi khi cập nhật biến thể:", error);
        res.status(500).json({
            status: 'Error',
            message: error.message || 'Lỗi server không xác định'
        });
    }
};

module.exports = {
    getVariants,
    getVariantsAsJson,
    addVariant,
    deleteVariant,
    updateVariant
};