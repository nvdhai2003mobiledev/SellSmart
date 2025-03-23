const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProductSchema = new Schema({
    name: { type: String, required: true },
    thumbnail: { type: String },
    category: { type: String, required: true },
    providerId: { type: Schema.Types.ObjectId, ref: 'Provider', required: true },
    status: { type: String, enum: ['available', 'unavailable'], default: 'available' },
    hasVariants: { type: Boolean, default: false },
    price: { type: Number },
    inventory: { type: Number },
    variants: [{
        variantDetails: [{
            variantId: { type: Schema.Types.ObjectId, ref: 'Variant', required: true },
            value: { type: String, required: true }
        }],
        price: { type: Number, required: true },
        inventory: { type: Number, required: true }
    }],
    detailsVariants: [{
        variantDetails: [{
            variantId: { type: Schema.Types.ObjectId, ref: 'Variant', required: true },
            value: { type: String, required: true }
        }],
        price: { type: Number },
        inventory: { type: Number }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);