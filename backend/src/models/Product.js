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
    price: {
        type: Number,
        min: 0, // Giá mặc định nếu không có biến thể
    },
    inventory: {
        type: Number,
        min: 0, // Tồn kho mặc định nếu không có biến thể
    },
    detailsVariants: [{
        type: Schema.Types.ObjectId,
        ref: 'DetailsVariant', // Tham chiếu đến các biến thể cụ thể của sản phẩm
    }],
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);