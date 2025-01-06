// Khách hàng
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Customer = new Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    confirmPassword: {
      type: String,
      required: true,
    },
    birthDate: {
      type: Date,
      required: true,
    },
    address: {
      type: String,
    },
    avatar: {
      type: String,
    },
    access_token: {
      type: String,
      // required : true,
      default: '', // Giá trị mặc định
    },
    refresh_token: {
      type: String,
      // required : true,
      default: '', // Giá trị mặc định
    },
  },
  { timestamps: true },
);
module.exports = mongoose.model('Customer', Customer);
