const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");
const connectDB = require("./config/db");
const cookieParser = require("cookie-parser");
const methodOverride = require("method-override");
const flash = require("connect-flash");
const session = require("express-session");
const cors = require("cors");

const routes = require("./routes");
const apiRoutes = require("./routes/api"); // Import API routes

const customerRouter = require("../../backend/src/routes/customer");


dotenv.config();
connectDB();

// Khởi tạo ứng dụng
const app = express();

// Cấu hình CORS
app.use(cors({
  origin: '*', // Cho phép tất cả các nguồn gốc truy cập API
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Cấu hình EJS làm view engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Middleware
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false })); // Hỗ trợ xử lý form
app.use(express.static(path.join(__dirname, "public"))); // Tài nguyên tĩnh
app.use(cookieParser());
app.use(methodOverride("_method"));

// Cấu hình express-session
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
  })
);

// Cấu hình connect-flash
app.use(flash());

// Global variables
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success");
  res.locals.error_msg = req.flash("error");
  next();
});

// Sử dụng API routes trước routes thông thường
app.use("/api", apiRoutes);

// Sử dụng web routes
routes(app);

// Sử dụng API routes
app.use("/customers", customerRouter);
app.use("/public", require('./routes/public')); // Thêm dòng này



// Middleware xử lý lỗi
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err.stack);
  
  // Kiểm tra nếu là API request
  if (req.path.includes('/api/')) {
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ nội bộ!",
      error: err.message
    });
  }
  
  // Flash message cho web request
  req.flash('error', 'Lỗi máy chủ nội bộ!');
  res.redirect('/');
});

// Lắng nghe cổng với xử lý lỗi port đã được sử dụng
const PORT = process.env.PORT || 5000;
const alternativePorts = [3000, 8000, 8080];
let currentPortIndex = 0;

function startServer(port) {
  const server = app.listen(port)
    .on('listening', () => {
      console.log(`🚀 Server is running on http://localhost:${port}`);
    })
    .on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`⚠️ Port ${port} is already in use.`);
        
        // Try alternative ports
        if (currentPortIndex < alternativePorts.length) {
          const nextPort = alternativePorts[currentPortIndex++];
          console.log(`⚠️ Trying alternative port ${nextPort}...`);
          startServer(nextPort);
        } else {
          console.error('❌ All ports are in use. Cannot start the server!');
          process.exit(1);
        }
      } else {
        console.error('❌ Server error:', err);
        process.exit(1);
      }
    });
}

startServer(PORT);

module.exports = app;
