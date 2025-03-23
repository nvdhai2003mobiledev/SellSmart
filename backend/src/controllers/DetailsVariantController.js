const mongoose = require('mongoose');
const DetailsVariant = require('../models/DetailsVariant');
const Variant = require('../models/Variant');
const Product = require('../models/Product');

// Lấy tất cả chi tiết biến thể
const getAllDetailsVariants = async (req, res) => {
    try {
        console.log('Bắt đầu lấy danh sách chi tiết biến thể');
        const detailsVariants = await DetailsVariant.find()
            .populate({
                path: 'productId',
                populate: { path: 'providerId' }
            })
            .lean();

        // Populate thông tin biến thể
        for (let detailVariant of detailsVariants) {
            for (let detail of detailVariant.variantDetails) {
                const variantData = await Variant.findById(detail.variantId).lean();
                detail.variantName = variantData ? variantData.name : 'Unknown';
            }
        }

        console.log(`Tìm thấy ${detailsVariants.length} chi tiết biến thể`);
        res.status(200).json({
            status: 'Ok',
            data: detailsVariants
        });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách chi tiết biến thể:', {
            errorMessage: error.message,
            stack: error.stack
        });
        res.status(500).json({
            status: 'Error',
            message: 'Lỗi khi lấy danh sách chi tiết biến thể: ' + error.message
        });
    }
};

// Lấy chi tiết biến thể theo productId
const getDetailsByProduct = async (req, res) => {
    try {
        console.log('Bắt đầu lấy chi tiết biến thể theo productId', { productId: req.params.productId });

        const { productId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            console.warn('ID sản phẩm không hợp lệ', { productId });
            return res.status(400).json({
                status: 'Error',
                message: 'ID sản phẩm không hợp lệ'
            });
        }

        const product = await Product.findById(productId).lean();
        if (!product) {
            console.warn('Sản phẩm không tồn tại', { productId });
            return res.status(404).json({
                status: 'Error',
                message: 'Sản phẩm không tồn tại'
            });
        }

        // Lấy chi tiết biến thể từ DetailsVariant
        const detailsVariants = await DetailsVariant.find({ productId }).lean();
        for (let detailVariant of detailsVariants) {
            for (let detail of detailVariant.variantDetails) {
                const variantData = await Variant.findById(detail.variantId).lean();
                detail.variantName = variantData ? variantData.name : 'Unknown';
            }
        }

        console.log(`Tìm thấy ${detailsVariants.length} chi tiết biến thể cho productId: ${productId}`);
        res.status(200).json({
            status: 'Ok',
            data: detailsVariants
        });
    } catch (error) {
        console.error('Lỗi khi lấy chi tiết biến thể theo productId:', {
            productId: req.params.productId,
            errorMessage: error.message,
            stack: error.stack
        });
        res.status(500).json({
            status: 'Error',
            message: 'Lỗi khi lấy chi tiết biến thể theo productId: ' + error.message
        });
    }
};

// Thêm chi tiết biến thể (Đồng bộ với Product.variants)
const addDetailsVariant = async (req, res) => {
    try {
        console.log('Bắt đầu thêm chi tiết biến thể', { body: req.body });

        const { productId, variantDetails, price, compareAtPrice, inventory } = req.body;

        // Kiểm tra dữ liệu đầu vào
        if (!productId || !variantDetails || !Array.isArray(variantDetails) || !price || !inventory) {
            console.warn('Dữ liệu đầu vào không hợp lệ', { productId, variantDetails, price, inventory });
            return res.status(400).json({
                status: 'Error',
                message: 'Product ID, chi tiết biến thể, giá và số lượng là bắt buộc'
            });
        }

        if (price < 0 || inventory < 0) {
            console.warn('Giá hoặc tồn kho không hợp lệ', { price, inventory });
            return res.status(400).json({
                status: 'Error',
                message: 'Giá và tồn kho phải là số không âm'
            });
        }

        if (compareAtPrice && compareAtPrice < 0) {
            console.warn('Giá so sánh không hợp lệ', { compareAtPrice });
            return res.status(400).json({
                status: 'Error',
                message: 'Giá so sánh phải là số không âm'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            console.warn('ID sản phẩm không hợp lệ', { productId });
            return res.status(400).json({
                status: 'Error',
                message: 'ID sản phẩm không hợp lệ'
            });
        }

        const product = await Product.findById(productId);
        if (!product) {
            console.warn('Sản phẩm không tồn tại', { productId });
            return res.status(404).json({
                status: 'Error',
                message: 'Sản phẩm không tồn tại'
            });
        }

        // Kiểm tra variantDetails
        for (const detail of variantDetails) {
            const variantId = detail.variantId;

            if (!mongoose.Types.ObjectId.isValid(variantId)) {
                console.warn('ID biến thể không hợp lệ', { variantId });
                return res.status(400).json({
                    status: 'Error',
                    message: `ID biến thể không hợp lệ: ${variantId}`
                });
            }

            const variant = await Variant.findById(variantId);
            if (!variant) {
                console.warn('Biến thể không tồn tại', { variantId });
                return res.status(404).json({
                    status: 'Error',
                    message: `Biến thể không tồn tại: ${variantId}`
                });
            }

            if (!variant.values.includes(detail.value)) {
                console.warn('Giá trị biến thể không hợp lệ', { variantId, value: detail.value });
                return res.status(400).json({
                    status: 'Error',
                    message: `Giá trị '${detail.value}' không hợp lệ cho biến thể '${variantId}'`
                });
            }
        }

        // Kiểm tra trùng lặp tổ hợp biến thể trong Product.variants
        const existingVariants = product.variants || [];
        const newCombination = variantDetails.map(v => `${v.variantId}:${v.value}`).sort().join('|');
        const existingCombinations = existingVariants.map(variant =>
            variant.variantDetails.map(v => `${v.variantId}:${v.value}`).sort().join('|')
        );

        if (existingCombinations.includes(newCombination)) {
            console.warn('Tổ hợp biến thể đã tồn tại', { newCombination });
            return res.status(400).json({
                status: 'Error',
                message: 'Tổ hợp biến thể này đã tồn tại cho sản phẩm'
            });
        }

        // Thêm vào Product.variants
        const newVariant = {
            variantDetails,
            price: Number(price),
            inventory: Number(inventory),
        };
        product.variants.push(newVariant);
        product.hasVariants = true;
        await product.save();

        // Thêm vào DetailsVariant
        const newDetailsVariant = await DetailsVariant.create({
            productId,
            variantDetails,
            price: Number(price),
            inventory: Number(inventory),
            compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
        });

        console.log('Chi tiết biến thể đã được thêm thành công', { productId, detailsVariantId: newDetailsVariant._id });
        res.status(201).json({
            status: 'Ok',
            message: 'Chi tiết biến thể được thêm thành công',
            data: newDetailsVariant
        });
    } catch (error) {
        console.error('Lỗi khi thêm chi tiết biến thể:', {
            body: req.body,
            errorMessage: error.message,
            stack: error.stack
        });
        res.status(500).json({
            status: 'Error',
            message: 'Lỗi khi thêm chi tiết biến thể: ' + error.message
        });
    }
};

// Cập nhật chi tiết biến thể
const updateDetailsVariant = async (req, res) => {
    try {
        console.log('Bắt đầu cập nhật chi tiết biến thể', { detailsVariantId: req.params.detailsVariantId, body: req.body });

        const { detailsVariantId } = req.params;
        const { productId, variantDetails, price, compareAtPrice, inventory } = req.body;

        if (!mongoose.Types.ObjectId.isValid(detailsVariantId)) {
            console.warn('ID chi tiết biến thể không hợp lệ', { detailsVariantId });
            return res.status(400).json({
                status: 'Error',
                message: 'ID chi tiết biến thể không hợp lệ'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            console.warn('ID sản phẩm không hợp lệ', { productId });
            return res.status(400).json({
                status: 'Error',
                message: 'ID sản phẩm không hợp lệ'
            });
        }

        const product = await Product.findById(productId);
        if (!product) {
            console.warn('Sản phẩm không tồn tại', { productId });
            return res.status(404).json({
                status: 'Error',
                message: 'Sản phẩm không tồn tại'
            });
        }

        // Tìm biến thể trong Product.variants
        const variantIndex = product.variants.findIndex(v => v._id.toString() === detailsVariantId);
        if (variantIndex === -1) {
            console.warn('Chi tiết biến thể không tồn tại trong sản phẩm', { detailsVariantId });
            return res.status(404).json({
                status: 'Error',
                message: 'Chi tiết biến thể không tồn tại trong sản phẩm'
            });
        }

        // Kiểm tra dữ liệu đầu vào
        if (!variantDetails || !Array.isArray(variantDetails) || !price || !inventory) {
            console.warn('Dữ liệu đầu vào không hợp lệ', { variantDetails, price, inventory });
            return res.status(400).json({
                status: 'Error',
                message: 'Chi tiết biến thể, giá và số lượng là bắt buộc'
            });
        }

        if (price < 0 || inventory < 0) {
            console.warn('Giá hoặc tồn kho không hợp lệ', { price, inventory });
            return res.status(400).json({
                status: 'Error',
                message: 'Giá và tồn kho phải là số không âm'
            });
        }

        if (compareAtPrice && compareAtPrice < 0) {
            console.warn('Giá so sánh không hợp lệ', { compareAtPrice });
            return res.status(400).json({
                status: 'Error',
                message: 'Giá so sánh phải là số không âm'
            });
        }

        // Kiểm tra variantDetails
        for (const detail of variantDetails) {
            const variantId = detail.variantId;

            if (!mongoose.Types.ObjectId.isValid(variantId)) {
                console.warn('ID biến thể không hợp lệ', { variantId });
                return res.status(400).json({
                    status: 'Error',
                    message: `ID biến thể không hợp lệ: ${variantId}`
                });
            }

            const variant = await Variant.findById(variantId);
            if (!variant) {
                console.warn('Biến thể không tồn tại', { variantId });
                return res.status(404).json({
                    status: 'Error',
                    message: `Biến thể không tồn tại: ${variantId}`
                });
            }

            if (!variant.values.includes(detail.value)) {
                console.warn('Giá trị biến thể không hợp lệ', { variantId, value: detail.value });
                return res.status(400).json({
                    status: 'Error',
                    message: `Giá trị '${detail.value}' không hợp lệ cho biến thể '${variantId}'`
                });
            }
        }

        // Kiểm tra trùng lặp tổ hợp biến thể (trừ chính bản ghi đang cập nhật)
        const existingVariants = product.variants.filter(v => v._id.toString() !== detailsVariantId);
        const newCombination = variantDetails.map(v => `${v.variantId}:${v.value}`).sort().join('|');
        const existingCombinations = existingVariants.map(variant =>
            variant.variantDetails.map(v => `${v.variantId}:${v.value}`).sort().join('|')
        );

        if (existingCombinations.includes(newCombination)) {
            console.warn('Tổ hợp biến thể đã tồn tại', { newCombination });
            return res.status(400).json({
                status: 'Error',
                message: 'Tổ hợp biến thể này đã tồn tại cho sản phẩm'
            });
        }

        // Cập nhật chi tiết biến thể trong Product.variants
        product.variants[variantIndex] = {
            variantDetails,
            price: Number(price),
            inventory: Number(inventory),
        };
        await product.save();

        // Cập nhật DetailsVariant
        const updatedDetailsVariant = await DetailsVariant.findOneAndUpdate(
            { productId, _id: detailsVariantId },
            {
                variantDetails,
                price: Number(price),
                inventory: Number(inventory),
                compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
            },
            { new: true, runValidators: true }
        );

        if (!updatedDetailsVariant) {
            console.warn('Chi tiết biến thể không tồn tại trong DetailsVariant', { detailsVariantId });
            return res.status(404).json({
                status: 'Error',
                message: 'Chi tiết biến thể không tồn tại trong DetailsVariant'
            });
        }

        console.log('Chi tiết biến thể đã được cập nhật thành công', { detailsVariantId });
        res.status(200).json({
            status: 'Ok',
            message: 'Chi tiết biến thể đã được cập nhật thành công',
            data: updatedDetailsVariant
        });
    } catch (error) {
        console.error('Lỗi khi cập nhật chi tiết biến thể:', {
            detailsVariantId: req.params.detailsVariantId,
            body: req.body,
            errorMessage: error.message,
            stack: error.stack
        });
        res.status(500).json({
            status: 'Error',
            message: 'Lỗi khi cập nhật chi tiết biến thể: ' + error.message
        });
    }
};

// Xóa chi tiết biến thể
const deleteDetailsVariant = async (req, res) => {
    try {
        console.log('Bắt đầu xóa chi tiết biến thể', { detailsVariantId: req.params.detailsVariantId });

        const { detailsVariantId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(detailsVariantId)) {
            console.warn('ID chi tiết biến thể không hợp lệ', { detailsVariantId });
            return res.status(400).json({
                status: 'Error',
                message: 'ID chi tiết biến thể không hợp lệ'
            });
        }

        // Tìm sản phẩm chứa biến thể
        const product = await Product.findOne({ 'variants._id': detailsVariantId });
        if (!product) {
            console.warn('Chi tiết biến thể không tồn tại trong Product', { detailsVariantId });
            return res.status(404).json({
                status: 'Error',
                message: 'Chi tiết biến thể không tồn tại trong Product'
            });
        }

        // Xóa biến thể khỏi Product.variants
        product.variants = product.variants.filter(v => v._id.toString() !== detailsVariantId);
        if (product.variants.length === 0) {
            product.hasVariants = false;
        }
        await product.save();

        // Xóa khỏi DetailsVariant
        const deletedDetailsVariant = await DetailsVariant.findByIdAndDelete(detailsVariantId);
        if (!deletedDetailsVariant) {
            console.warn('Chi tiết biến thể không tồn tại trong DetailsVariant', { detailsVariantId });
            return res.status(404).json({
                status: 'Error',
                message: 'Chi tiết biến thể không tồn tại trong DetailsVariant'
            });
        }

        console.log('Chi tiết biến thể đã được xóa thành công', { detailsVariantId });
        res.status(200).json({
            status: 'Ok',
            message: 'Chi tiết biến thể đã được xóa thành công'
        });
    } catch (error) {
        console.error('Lỗi khi xóa chi tiết biến thể:', {
            detailsVariantId: req.params.detailsVariantId,
            errorMessage: error.message,
            stack: error.stack
        });
        res.status(500).json({
            status: 'Error',
            message: 'Lỗi khi xóa chi tiết biến thể: ' + error.message
        });
    }
};

module.exports = {
    getAllDetailsVariants,
    getDetailsByProduct,
    addDetailsVariant,
    updateDetailsVariant,
    deleteDetailsVariant
};