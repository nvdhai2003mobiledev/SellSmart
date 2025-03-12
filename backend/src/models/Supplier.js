const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const SupplierSchema = new Schema(
  {
    fullName: {
      type: String,
      required: [true, "Tên đầy đủ là bắt buộc"],
      trim: true,
      minlength: [3, "Tên phải có ít nhất 3 ký tự"],
    },
    phoneNumber: {
      type: String,
      required: [true, "Số điện thoại là bắt buộc"],
      match: [/^(0|\+84)\d{9,10}$/, "Số điện thoại không hợp lệ"],
    },
    email: {
      type: String,
      required: [true, "Email là bắt buộc"],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Email không hợp lệ"],
    },
    address: {
      type: String,
      required: [true, "Địa chỉ là bắt buộc"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Supplier", SupplierSchema);
