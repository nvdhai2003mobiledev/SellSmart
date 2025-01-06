// src/config/db.js
// config connect database

const mongoose = require("mongoose");

const { MONGODB_URI } = process.env;

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  } catch (error) {
    console.error("Connect database failure: ", error);
    process.exit(1);
  }
};

module.exports = connectDB;
