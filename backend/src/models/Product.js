const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProductSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    thumbnail: {
        type: String,
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: 'TypeProduct',
        required: true,
    },
    providerId: {
        type: Schema.Types.ObjectId,
        ref: 'Provider',
        required: true,
    },
    status: {
        type: String,
        enum: ['available', 'unavailable'],
        default: 'available',
    },
    hasVariants: {
        type: Boolean,
        default: false,
    },
    isPublished: {
        type: Boolean,
        default: false,
    },
    price: {
        type: Number,
        min: 0, // Giá bán
    },
    original_price: {
        type: Number,
        min: 0, // Giá gốc từ kho hàng
    },
    inventory: {
        type: Number,
        min: 0, // Tồn kho mặc định nếu không có biến thể
    },
    inventoryId: {
        type: Schema.Types.ObjectId,
        ref: 'Inventory',
        required: true,
    },
    product_code: {
        type: String,
    },
    detailsVariants: [{
        attributes: Schema.Types.Mixed,
        price: Number,          // Giá bán
        original_price: Number, // Giá nhập
        inventory: Number
    }],
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);