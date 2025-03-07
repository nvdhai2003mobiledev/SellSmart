const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Tạo và gửi token vào cookie
const sendTokenResponse = (user, res, redirectUrl) => {
  // Tạo token
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });

  // Thiết lập cookie
  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") {
    options.secure = true;
  }

  res.status(200).cookie("token", token, options).redirect(redirectUrl);
};

// @desc    Hiển thị form đăng nhập
// @route   GET /login
exports.loginForm = (req, res) => {
  res.render("auth/login", {
    title: "Đăng nhập",
  });
};

// @desc    Xử lý đăng nhập
// @route   POST /login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Xác thực email, password
    if (!email || !password) {
      return res.render("auth/login", {
        title: "Đăng nhập",
        error: "Vui lòng cung cấp email và mật khẩu",
        email,
      });
    }

    // Kiểm tra xem user có tồn tại không
    const user = await User.findOne({ email });

    if (!user) {
      return res.render("auth/login", {
        title: "Đăng nhập",
        error: "Thông tin đăng nhập không chính xác",
        email,
      });
    }

    // Kiểm tra nếu chỉ cho phép admin đăng nhập
    if (user.role !== "admin") {
      return res.render("auth/login", {
        title: "Đăng nhập",
        error: "Chỉ admin mới có quyền truy cập hệ thống quản trị",
        email,
      });
    }

    // Kiểm tra mật khẩu
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.render("auth/login", {
        title: "Đăng nhập",
        error: "Thông tin đăng nhập không chính xác",
        email,
      });
    }

    // Đăng nhập thành công - gửi token qua cookie
    sendTokenResponse(user, res, "/employees");
  } catch (error) {
    console.error(error);
    res.render("auth/login", {
      title: "Đăng nhập",
      error: "Đã xảy ra lỗi trong quá trình đăng nhập",
      email: req.body.email,
    });
  }
};

// @desc    Đăng xuất
// @route   GET /logout
exports.logout = (req, res) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.redirect("/login");
};
