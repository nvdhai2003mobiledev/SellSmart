const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const VariantSchema = new Schema({
  name: {
    type: String,
    required: true, // Ví dụ: "màu sắc", "kích thước", "chất lượng"
    unique: true, // Đảm bảo tên biến thể là duy nhất
    index: true // Tăng hiệu suất tìm kiếm
  },
  values: {
    type: [String], // Ví dụ: ["đỏ", "xanh", "đen"] hoặc ["14inch", "15inch", "16inch"]
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model("Variant", VariantSchema);