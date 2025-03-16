const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const Supplier = new Schema(
  {
    name: { type: String, required: true },
    contact: { type: String },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Supplier", Supplier);
