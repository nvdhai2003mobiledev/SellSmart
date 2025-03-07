<<<<<<< HEAD
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: false }, // Không bắt buộc với mobile
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phoneNumber: { type: String, required: false },
    gender: { type: String, required: false },
    dateOfBirth: { type: Date, required: false },
    role: { type: String, enum: ['admin', 'employee'], default: 'employee' }, // Phân quyền
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
=======
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Schema = mongoose.Schema;

const User = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    gender: {
      type: String,
      enum: ["male", "female"],
      required: true,
    },
    dob: {
      type: Date,
      required: true,
      default: Date.now,
    },
    avatar: {
      type: String,
    },
    address: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      sparse: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "employee"],
      default: "admin",
    },
  },
  { timestamps: true },
);

// Mã hóa mật khẩu trước khi lưu
User.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Phương thức kiểm tra mật khẩu
User.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", User);
>>>>>>> 020b47ca46b2e2cab43ec38af5437ee7a01f20e2
