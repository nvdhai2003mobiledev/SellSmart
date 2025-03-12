const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Render trang đăng nhập
exports.getLogin = (req, res) => {
  res.render("login", { title: "Đăng nhập" });
};

// Xử lý đăng nhập
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).render("login", {
        title: "Đăng nhập",
        error: "Vui lòng cung cấp username và password",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).render("login", {
        title: "Đăng nhập",
        error: "Username không tồn tại",
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).render("login", {
        title: "Đăng nhập",
        error: "Mật khẩu không đúng",
      });
    }

    if (user.role !== "admin") {
      return res.status(403).render("login", {
        title: "Đăng nhập",
        error: "Chỉ admin mới được phép đăng nhập",
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );
    res.cookie("token", token, { httpOnly: true, maxAge: 3600000 }); // 1 giờ
    res.redirect("/employees");
  } catch (error) {
    console.error("Lỗi đăng nhập:", error.message);
    res.status(500).render("login", {
      title: "Đăng nhập",
      error: "Đã xảy ra lỗi khi đăng nhập",
    });
  }
};

// Đăng xuất
exports.logout = (req, res) => {
  res.clearCookie("token");
  res.redirect("login");
};
