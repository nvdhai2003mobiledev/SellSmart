const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DetailsVariantSchema = new Schema({
    variantId: { 
        type: Schema.Types.ObjectId, 
        ref: 'Variant', 
        required: true 
    }, 
    value: { 
        type: String,
        required: true ,
    }, // Liên kết đến Value cụ thể
    price: {
        type: Number,
        required: true,
        min: 0
    },
    compareAtPrice: {
        type: Number,
        min: 0
    },
    inventory: {
        type: Number,
        default: 0,
        min: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('DetailsVariant', DetailsVariantSchema);
