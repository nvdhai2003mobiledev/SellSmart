const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ProductSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
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
    hasVariants: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", ProductSchema);