// Nhân viên
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Employee = new Schema(
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
    hireDate: {
      type: Date,
      required: true,
    },
    position: {
      type: String,
      required: true,
    },
    salary: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      required: true,
      default: "active",
    },
    role: {
      type: String,
      required: true,
      default: "staff",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Employee", Employee);
