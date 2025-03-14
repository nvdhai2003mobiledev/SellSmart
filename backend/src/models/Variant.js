const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const VariantSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    values: [{
        type: String,
        required: true
    }]
}, { timestamps: true });

module.exports = mongoose.model('Variant', VariantSchema);
