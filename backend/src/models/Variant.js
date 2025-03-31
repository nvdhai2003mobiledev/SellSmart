const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const VariantSchema = new Schema({
    name: {
        type: String,
        required: true, // Ví dụ: "Màu sắc", "Kích thước", "RAM"
    },
    values: {
        type: [String], // Ví dụ: ["Đỏ", "Xanh", "Đen"] hoặc ["14inch", "15inch"]
        required: true,
    },
    typeProductId: {
        type: Schema.Types.ObjectId,
        ref: 'TypeProduct', // Liên kết với danh mục
        required: true,
    },
}, { timestamps: true });

// Tạo composite index cho name và typeProductId để tăng tốc tìm kiếm
// Không sử dụng unique index để cho phép trùng tên biến thể ở các danh mục khác nhau
VariantSchema.index({ name: 1, typeProductId: 1 });

// Xóa index name_1 nếu tồn tại
const Variant = mongoose.model('Variant', VariantSchema);
Variant.collection.dropIndex('name_1')
    .then(() => console.log('Đã xóa index name_1 thành công'))
    .catch(err => {
        if (err.code !== 27) { // 27 là mã lỗi khi index không tồn tại
            console.error('Lỗi khi xóa index:', err);
        }
    });

module.exports = Variant;