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
    stockQuantity: {
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
