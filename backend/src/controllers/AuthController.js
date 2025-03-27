const User = require("../models/User");
const jwt = require("jsonwebtoken");

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
        error: "Vui lòng cung cấp username và password",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).render("auth/login", {
        title: "Đăng nhập",
        error: "Email không tồn tại",
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
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp email và mật khẩu",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Email không tồn tại",
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Mật khẩu không đúng",
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

    res.json({
      success: true,
      data: {
        accessToken: token,
        tokenType: "Bearer",
        refreshToken: refreshToken,
        expiresIn: 3600, // 1 hour in seconds
        userId: user._id,
        role: user.role,
        fullName: user.fullName,
        email: user.email,
        avatar: user.avatar || null,
        phoneNumber: user.phoneNumber || null,
        address: user.address || null,
        gender: user.gender || null,
        dob: user.dob ? user.dob.toISOString() : null,
      },
    });
  } catch (error) {
    console.error("Lỗi đăng nhập:", error.message);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi đăng nhập",
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
