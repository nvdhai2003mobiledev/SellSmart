const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DetailsVariantSchema = new Schema({
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    variantDetails: [{
        variantId: {
            type: Schema.Types.ObjectId,
            ref: 'Variant',
            required: true,
        },
        value: {
            type: String,
            required: true, // Ví dụ: "Đỏ", "14inch", "8GB"
        },
    }],
    price: {
        type: Number,
        required: true,
        min: 0, // Giá riêng cho tổ hợp biến thể
    },
    compareAtPrice: {
        type: Number,
        min: 0, // Giá so sánh (giá gốc)
    },
    inventory: {
        type: Number,
        default: 0,
        min: 0, // Tồn kho riêng cho tổ hợp biến thể
    },
}, { timestamps: true });

module.exports = mongoose.model('DetailsVariant', DetailsVariantSchema);