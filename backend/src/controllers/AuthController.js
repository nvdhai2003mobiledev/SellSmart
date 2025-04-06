const User = require("../models/User");
const jwt = require("jsonwebtoken");
const AuthService = require("../services/AuthService");

// Render trang đăng nhập
exports.getLogin = (req, res) => {
  res.render("auth/login", { title: "Đăng nhập" });
};

// Xử lý đăng nhập cho backend (chỉ admin)
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).render("auth/login", {
        title: "Đăng nhập",
        error: "Vui lòng cung cấp username/email và password",
      });
    }

    // Tìm user theo email hoặc username
    const user = await User.findOne({ 
      $or: [
        { email: email },
        { username: email }
      ]
    });
    
    if (!user) {
      return res.status(401).render("auth/login", {
        title: "Đăng nhập",
        error: "Tài khoản không tồn tại",
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).render("auth/login", {
        title: "Đăng nhập",
        error: "Mật khẩu không đúng",
      });
    }

    // Chỉ cho phép admin đăng nhập vào backend
    if (user.role !== "admin") {
      return res.status(403).render("auth/login", {
        title: "Đăng nhập",
        error: "Chỉ admin mới được phép đăng nhập vào hệ thống quản trị",
      });
    }

    // Generate access token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    // Save refresh token to user
    user.refreshToken = refreshToken;
    await user.save();

    // Set cookies
    res.cookie("token", token, { httpOnly: true, maxAge: 3600000 }); // 1 hour
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    }); // 7 days

    res.redirect("/dashboard");
  } catch (error) {
    console.error("Lỗi đăng nhập:", error.message);
    res.status(500).render("auth/login", {
      title: "Đăng nhập",
      error: "Đã xảy ra lỗi khi đăng nhập",
    });
  }
};

// Xử lý đăng nhập cho mobile app (cho phép cả admin và employee)
exports.mobileLogin = async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;
    const user = await AuthService.mobileLogin(usernameOrEmail, password);

    // Chuyển đổi TOKEN_EXPIRY từ string thành number
    const tokenExpiry = parseInt(process.env.TOKEN_EXPIRY);
    const refreshTokenExpiry = parseInt(process.env.REFRESH_TOKEN_EXPIRY);

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: tokenExpiry }
    );

    const refreshToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: refreshTokenExpiry }
    );

    return res.json({
      status: true,
      message: "Đăng nhập thành công",
      data: user,
      token,
      refreshToken,
      expiresIn: tokenExpiry,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      status: false,
      message: error.message || "Đăng nhập không thành công",
    });
  }
};

exports.mobileLogout = async (req, res) => {
  try {
    // Token blacklisting could be implemented here for enhanced security
    return res.json({
      status: true,
      message: "Đăng xuất thành công",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error.message || "Đăng xuất không thành công",
    });
  }
};

// Đăng xuất
exports.logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      const user = await User.findOne({ refreshToken });
      if (user) {
        user.refreshToken = null;
        await user.save();
      }
    }

    res.clearCookie("token");
    res.clearCookie("refreshToken");
    res.redirect("/login");
  } catch (error) {
    console.error("Lỗi đăng xuất:", error.message);
    res.redirect("/login");
  }
};
