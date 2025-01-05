// Đơn hàng
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Order = new Schema(
  {
    orderID: {
      type: String,
      unique: true,
      required: true,
      default: () => `ORDER-${Date.now()}`,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    products: [
      {
        product: {
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
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "shipping", "delivered", "canceled"],
      default: "pending",
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
    shippingAddress: {
      type: String,
      required: true,
    },
    employeeID: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
    },
    notes: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", Order);
