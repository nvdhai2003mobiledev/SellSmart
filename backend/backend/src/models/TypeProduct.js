const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TypeProductSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    variants: [{
        type: Schema.Types.ObjectId,
        ref: 'Variant', // Tham chiếu đến các biến thể thuộc danh mục này
    }],
}, { timestamps: true });

module.exports = mongoose.model('TypeProduct', TypeProductSchema);