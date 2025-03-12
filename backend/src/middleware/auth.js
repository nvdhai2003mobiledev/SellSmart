const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).render("auth/login", {
      title: "Đăng nhập",
      error: "Bạn cần đăng nhập để truy cập trang này",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Lấy user từ database
    const user = await User.findById(decoded.id).select(
      "fullName email avatar role",
    );

    if (!user) {
      res.clearCookie("token");
      return res.status(401).render("auth/login", {
        title: "Đăng nhập",
        error: "Tài khoản không tồn tại",
      });
    }

    if (user.role !== "admin") {
      return res.status(403).render("auth/login", {
        title: "Đăng nhập",
        error: "Chỉ admin mới được truy cập",
      });
    }

    req.user = user; // Lưu thông tin user vào request
    res.locals.admin = user; // Gửi thông tin đến EJS để dùng trong template
    next();
  } catch (error) {
    res.clearCookie("token").status(401).render("auth/login", {
      title: "Đăng nhập",
      error: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn",
    });
  }
};

module.exports = { protect };
