const mongoose = require("mongoose");

const CustomerSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  phoneNumber: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false },
  confirmPassword: { type: String, required: false },
  birthDate: { type: Date, required: true },  // Nếu cần dạng Date, hãy dùng type: Date
  address: { type: String, required: false },
  avatar: { type: String, required: false }
});

// Xuất model
module.exports = mongoose.model("Customer", CustomerSchema);
