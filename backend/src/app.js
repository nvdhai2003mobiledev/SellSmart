const express = require("express");
<<<<<<< HEAD
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const customerRoutes = require("./routes/CustomerRoutes"); // Import routes
const bodyParser = require("body-parser");
const path = require("path");

const connectDB = require("./config/db");

dotenv.config();

connectDB();

=======
const bodyParser = require("body-parser");
const path = require("path");
const cookieParser = require("cookie-parser");
const methodOverride = require("method-override");
const flash = require("connect-flash");
const session = require("express-session");
const connectDB = require("./config/db");
const routes = require("./routes");
// Khởi tạo ứng dụng
>>>>>>> 020b47ca46b2e2cab43ec38af5437ee7a01f20e2
const app = express();

// Cấu hình EJS làm view engine
app.set("views", path.join(__dirname, "views")); // Thư mục chứa file EJS
app.set("view engine", "ejs");

// Middleware
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false })); // Hỗ trợ xử lý form
app.use(express.static(path.join(__dirname, "public"))); // Tài nguyên tĩnh
<<<<<<< HEAD

// Import routes
app.use("/api", customerRoutes);

// Route hiển thị danh sách khách hàng (để dùng trong EJS hoặc frontend)
app.get("/customers", async (req, res) => {
  try {
    const customers = await mongoose.model("Customer").find();
    res.render("customers", { customers }); // Render trang EJS (nếu dùng)
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy danh sách khách hàng" });
  }
});

// Route xử lý form thêm khách hàng từ frontend
app.post("/customers", async (req, res) => {
  try {
    const { fullName, phoneNumber, email, address, birthDate, avatar } = req.body;

    if (!fullName || !phoneNumber || !email) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin" });
    }

    const newCustomer = new mongoose.model("Customer")({
      fullName,
      phoneNumber,
      email,
      address,
      birthDate,
      avatar,
    });

    await newCustomer.save();
    res.redirect("/customers"); // Sau khi thêm, quay lại danh sách
  } catch (error) {
    console.error("🔥 Lỗi thêm khách hàng:", error);
    res.status(500).json({ message: "Lỗi máy chủ khi thêm khách hàng!" });
  }
});


// Route xử lý form XÓA khách hàng từ frontend
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

app.put('/api/customers/:id', async (req, res) => {
  try {
      const { id } = req.params;
      const updateData = req.body;

      // Nếu birthDate rỗng, xóa nó khỏi dữ liệu cập nhật
      if (!updateData.birthDate) {
          delete updateData.birthDate;
      }

      const updatedCustomer = await Customer.findByIdAndUpdate(id, updateData, { new: true });

      res.json(updatedCustomer);
  } catch (error) {
      console.error("Lỗi cập nhật khách hàng:", error);
      res.status(500).json({ message: "Lỗi server" });
  }
});





// Middleware xử lý lỗi
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err.stack);
  res.status(500).json({ message: "Lỗi máy chủ nội bộ!" });
});

// Lắng nghe cổng
app.listen(port, () => {
  console.log(`🚀 Server is running on http://localhost:${port}`);
=======

// Cấu hình cookie-parser
app.use(cookieParser());

// Cấu hình method-override
app.use(methodOverride("_method"));

// Cấu hình express-session
app.use(
  session({
    secret: process.env.SESSION_SECRET,
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
// Lắng nghe cổng
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
>>>>>>> 020b47ca46b2e2cab43ec38af5437ee7a01f20e2
});

module.exports = app;
