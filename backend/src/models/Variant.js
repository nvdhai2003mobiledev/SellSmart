const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const VariantSchema = new Schema({
  productId: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  name: {
    type: String,
    required: true, // Ví dụ: "màu sắc", "kích thước", "chất liệu"
  },
  values: {
    type: [String], // Ví dụ: ["đỏ", "xanh", "đen"] hoặc ["14in", "15in", "16in"]
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model("Variant", VariantSchema);