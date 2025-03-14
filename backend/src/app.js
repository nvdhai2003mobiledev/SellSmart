const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const cookieParser = require("cookie-parser");
const methodOverride = require("method-override");
const flash = require("connect-flash");
const session = require("express-session");
const connectDB = require("./config/db");
const routes = require("./routes");

// Khởi tạo ứng dụng
const app = express();

// Cấu hình EJS làm view engine
app.set("views", path.join(__dirname, "views")); // Thư mục chứa file EJS
app.set("view engine", "ejs");

// Middleware
app.use(express.json()); // Xử lý JSON
app.use(express.urlencoded({ extended: true })); // Xử lý form data
app.use(express.static(path.join(__dirname, "public"))); // Tài nguyên tĩnh

// Cấu hình cookie-parser
app.use(cookieParser());

// Cấu hình method-override
app.use(methodOverride("_method"));

// Cấu hình express-session
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'mysecret',
    resave: false,
    saveUninitialized: false,
  }),
);

// Cấu hình connect-flash
app.use(flash());

// Global variables
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success");
  res.locals.error_msg = req.flash("error");
  next();
});

// Import routes
routes(app);

// Kết nối MongoDB
connectDB();

// Middleware xử lý lỗi - đặt sau routes
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err.stack);
  res.status(500).json({ message: "Lỗi máy chủ nội bộ!" });
});

// Lắng nghe cổng
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;