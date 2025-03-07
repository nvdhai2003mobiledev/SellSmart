const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const routes = require('./routes');
const bodyParser = require('body-parser');
const path = require('path');
const connectDB=require('./config/db')
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Cấu hình EJS làm view engine
app.set('views', path.join(__dirname, 'views')); // Thư mục chứa file EJS
app.set('view engine', 'ejs');

// Middleware
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false })); // Hỗ trợ xử lý form
app.use(express.static(path.join(__dirname, 'public'))); // Tài nguyên tĩnh

// Import routes
routes(app);

// Trang chủ
// app.get("/", (req, res) => {
//   res.render("index", { title: "Trang Chủ", message: "Duong Duc Duy" });
// });

// Kết nối MongoDB
connectDB();
// Lắng nghe cổng
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  
});

module.exports = app;
