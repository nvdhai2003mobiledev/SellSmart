// Khuyến mãi
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Promotion = new Schema(
  {
    promotionID: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    discount: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    applicationProducts: [
      {
        productID: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        discount: {
          type: Number,
          required: true,
          min: 0,
          max: 100,
        },
      },
    ],
    status: {
      type: String,
      required: true,
      default: "active",
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
  },
  { timestamps }
);

module.exports = mongoose.model("Promotion", Promotion);
