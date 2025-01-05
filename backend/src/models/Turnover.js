// Doanh thu
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Turnover = new Schema(
  {
    orderID: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    products: [
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
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    employeeID: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    customerID: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "credit card", "debit card", "e-wallet"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["paid", "unpaid", "refunded"],
      default: "paid",
    },
    period: {
      type: String,
      enum: ["daily", "weekly", "monthly", "yearly"],
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Turnover", Turnover);
