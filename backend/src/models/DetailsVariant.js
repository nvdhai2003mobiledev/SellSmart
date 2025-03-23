const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const DetailsVariantSchema = new Schema({
  productId: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  variantDetails: [
    {
      variantId: {
        type: Schema.Types.ObjectId,
        ref: "Variant",
        required: true,
      },
      value: {
        type: String,
        required: true, // Ví dụ: "đỏ", "14inch", "thường"
      },
    },
  ],
  price: {
    type: Number,
    required: true,
    min: 0, // Giá riêng cho từng phiên bản
  },
  compareAtPrice: {
    type: Number,
    min: 0, // Giá so sánh (giá gốc)
  },
  inventory: {
    type: Number,
    default: 0,
    min: 0, // Số lượng tồn kho riêng cho từng phiên bản
  },
}, { timestamps: true });

module.exports = mongoose.model("DetailsVariant", DetailsVariantSchema);