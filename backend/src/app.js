const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const customerRoutes = require("./routes/customer");
const bodyParser = require("body-parser");
const path = require("path");
const connectDB = require("./config/db");
const cookieParser = require("cookie-parser");
const methodOverride = require("method-override");
const flash = require("connect-flash");
const session = require("express-session");
const orderService = require('./services/orderService');
const routes = require("./routes");
const Customer = require('./models/Customer'); 
const Product = require('./models/Product');
const Order = require('./models/Order');

// const promotionRouter = require("./routes/PromotionRouter");

dotenv.config();
connectDB();

// Khởi tạo ứng dụng
const app = express();

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

// Import routes
app.use("/api", customerRoutes);
// app.use("/api", promotionRouter);
routes(app);
app.post("/orders", async (req, res) => {
  try {
      const { customerID, products, totalAmount, paymentMethod, shippingAddress, notes } = req.body;

      if (!customerID || !products || products.length === 0 || !totalAmount || !paymentMethod || !shippingAddress) {
          return res.status(400).json({ success: false, message: "Dữ liệu đơn hàng không hợp lệ" });
      }

      const newOrder = new Order({
          orderID: `ORD-${Date.now()}`,  // 🔹 Tạo orderID ngẫu nhiên
          customerID,
          products,
          totalAmount,
          paymentMethod,
          shippingAddress,
          notes
      });

      await newOrder.save();
      res.json({ success: true, message: "Đơn hàng đã được tạo thành công!", order: newOrder });

  } catch (error) {
      console.error("Lỗi khi tạo đơn hàng:", error);
      res.status(500).json({ success: false, message: "Lỗi server khi tạo đơn hàng" });
  }
});

app.get('/orders', async (req, res) => {
  try {
      const orders = await orderService.getAllOrders();
      console.log("✅ Lấy danh sách đơn hàng:", orders); // Kiểm tra dữ liệu lấy ra
      res.render('dashboard/orders', { orders });
  } catch (error) {
      console.error("🔥 Lỗi server khi lấy danh sách đơn hàng:", error);
      res.status(500).json({ message: "Lỗi máy chủ nội bộ!", error: error.message });
  }
});
app.get('/orders/create', async (req, res) => {
  try {
    const customers = await Customer.find();
    const products = await Product.find();
    console.log("📌 Customers:", customers);
    console.log("📌 Products:", products);
    res.render('dashboard/createOrder', { customers, products });
  } catch (error) {
    console.error("🔥 Lỗi khi tải trang tạo đơn hàng:", error);
    res.status(500).send("Lỗi server khi tải trang!");
  }
});

//======================================================== KHÁCH HÀNG =======================================
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
app.put("/api/customers/:id", async (req, res) => {
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

//======================================================== PROMOTION =======================================
// Thêm khuyến mãi
// app.post("/api/promotions", (req, res) => {
//   const newPromotion = req.body;
//   console.log("Dữ liệu nhận được:", newPromotion);
//   res.json({ message: "Khuyến mãi đã được thêm!", promotion: newPromotion });
// });

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