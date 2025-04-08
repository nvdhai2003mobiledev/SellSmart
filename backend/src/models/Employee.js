const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Employee = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    position: {
      type: String,
      required: true,
      trim: true,
    },
    salary: {
      type: Number,
      required: true,
    },
    hireDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    workStatus: {
      type: String,
      enum: ["active", "inactive", "leave"],
      default: "active",
    },
    bankAccount: {
      bankName: String,
      accountNumber: String,
      accountHolder: String,
    },
  },
  { timestamps: true },
);

// Virtual để tính số năm làm việc
Employee.virtual("yearsOfService").get(function () {
  const now = new Date();
  const hireDate = this.hireDate;
  const diffTime = Math.abs(now - hireDate);
  const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
  return Math.floor(diffYears);
});

// Đảm bảo virtuals được bao gồm khi chuyển đổi sang JSON
Employee.set("toJSON", { virtuals: true });
Employee.set("toObject", { virtuals: true });

module.exports = mongoose.model("Employee", Employee);
