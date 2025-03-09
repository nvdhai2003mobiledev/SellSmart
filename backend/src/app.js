const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const customerRoutes = require("./routes/CustomerRoutes");
const bodyParser = require("body-parser");
const path = require("path");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const cookieParser = require("cookie-parser");
const methodOverride = require("method-override");
const flash = require("connect-flash");
const session = require("express-session");
const routes = require("./routes");

// Khởi tạo ứng dụng
const app = express();

// Cấu hình EJS làm view engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");




// Middleware
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
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



// Import routes Customer
app.use("/api", customerRoutes);
routes(app);


// router Promotion
const promotionRouter = require("./routes/PromotionRouter"); // Đảm bảo đường dẫn đúng
app.use("/api", promotionRouter); // Đảm bảo sử dụng đúng đường dẫn API




//========================================================KHÁCH HÀNG =======================================
// Route hiển thị danh sách khách hàng
app.get("/customers", async (req, res) => {
  try {
    const Customer = mongoose.model("Customer");
    const customers = await Customer.find();
    res.render("customers", { customers });
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy danh sách khách hàng" });
  }
});



// Route thêm khách hàng
app.post("/customers", async (req, res) => {
  try {
    const { fullName, phoneNumber, email, address, birthDate, avatar } = req.body;
    if (!fullName || !phoneNumber || !email) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin" });
    }

    const Customer = mongoose.model("Customer");
    const newCustomer = new Customer({ fullName, phoneNumber, email, address, birthDate, avatar });
    await newCustomer.save();

    res.redirect("/customers");
  } catch (error) {
    console.error("🔥 Lỗi thêm khách hàng:", error);
    res.status(500).json({ message: "Lỗi máy chủ khi thêm khách hàng!" });
  }
});

// Route xóa khách hàng
app.delete("/customers/delete/:id", async (req, res) => {
  try {
    const customerId = req.params.id;
    const Customer = mongoose.model("Customer");
    const deletedCustomer = await Customer.findByIdAndDelete(customerId);

    if (!deletedCustomer) {
      return res.status(404).json({ success: false, message: "Khách hàng không tồn tại!" });
    }

    res.json({ success: true, message: "Xóa khách hàng thành công!" });
  } catch (error) {
    console.error("🔥 Lỗi xóa khách hàng:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ khi xóa khách hàng!" });
  }
});

// Route cập nhật khách hàng
app.put('/api/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    if (!updateData.birthDate) delete updateData.birthDate;

    const Customer = mongoose.model("Customer");
    const updatedCustomer = await Customer.findByIdAndUpdate(id, updateData, { new: true });

    res.json(updatedCustomer);
  } catch (error) {
    console.error("Lỗi cập nhật khách hàng:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});


//======================================================== Promotion =======================================
// thêm khuyến mãi
app.post("/api/promotions", (req, res) => {
  const newPromotion = req.body;
  console.log("Dữ liệu nhận được:", newPromotion);
  res.json({ message: "Khuyến mãi đã được thêm!", promotion: newPromotion });
});





// Middleware xử lý lỗi
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err.stack);
  res.status(500).json({ message: "Lỗi máy chủ nội bộ!" });
});

// Lắng nghe cổng
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

module.exports = app;
