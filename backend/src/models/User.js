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
