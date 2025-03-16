const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const VariantSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    values: {
        type: [String],  // Lưu dưới dạng mảng các chuỗi
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Variant', VariantSchema);
