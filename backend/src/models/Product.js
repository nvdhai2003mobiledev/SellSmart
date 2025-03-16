<<<<<<< HEAD
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Product = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    inventory: {
      type: Number,
      default: 0,
      min: 0,
    },
    thumbnail: {
      type: String,
    },
    description: {
      type: String,
    },
    brand: {
      type: String,
    },
    category: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      default: "available",
    },
    attributes: [
      {
        name: { type: String, required: true }, // Tên thuộc tính (VD: size, color)
        values: [{ type: String, required: true }], // Danh sách các giá trị (VD: S, M, L)
        variantId: {
          type: Schema.Types.ObjectId,
          ref: 'Variant',
        },
      },
    ],
    // Thêm trường để dễ dàng tham chiếu đến các biến thể
    hasVariants: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", Product);
=======
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Product = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    thumbnail: {
      type: String,
    },
    description: {
      type: String,
    },
    category: {
      type: String,
      required: true,
    },
    inventory: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      required: true,
      default: "available",
    },
    attributes: [
      {
        name: { type: String, required: true }, // Tên thuộc tính (VD: size, color)
        values: [{ type: String, required: true }], // Danh sách các giá trị (VD: S, M, L)
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Product", Product);
>>>>>>> 8347d70a9ae74fd06d2a5a20acf614f3cda610d2
