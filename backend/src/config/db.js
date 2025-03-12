const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;

    if (!mongoURI) {
      console.error("Error: MONGO_URI is not defined in environment variables");
      console.log(
        "Please create a .env file with MONGO_URI=your_connection_string",
      );
      process.exit(1);
    }

    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

mongoose.connection.on("connected", () => {
  console.log("Mongoose connected to database");
});

mongoose.connection.on("error", (err) => {
  console.error(`Mongoose connection error: ${err}`);
});

mongoose.connection.on("disconnected", () => {
  console.log("Mongoose disconnected");
});

process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("Mongoose connection closed through app termination");
  process.exit(0);
});



module.exports = connectDB;


