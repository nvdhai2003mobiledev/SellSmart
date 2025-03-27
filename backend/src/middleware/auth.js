const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  const token = req.cookies.token;
  const refreshToken = req.cookies.refreshToken;

  if (!token) {
    if (!refreshToken) {
      return res.status(401).render("auth/login", {
        title: "Đăng nhập",
        error: "Bạn cần đăng nhập để truy cập trang này",
      });
    }
    return verifyRefreshToken(req, res, next);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Lấy user từ database
    const user = await User.findById(decoded.id).select(
      "fullName email avatar role"
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
    if (refreshToken) {
      return verifyRefreshToken(req, res, next);
    }
    res.clearCookie("token").status(401).render("auth/login", {
      title: "Đăng nhập",
      error: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn",
    });
  }
};

const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  const refreshToken = req.cookies.refreshToken;

  if (!token) {
    if (!refreshToken) {
      return res.redirect("/login");
    }
    return verifyRefreshToken(req, res, next);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (refreshToken) {
      return verifyRefreshToken(req, res, next);
    }
    return res.redirect("/login");
  }
};

const verifyRefreshToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res.redirect("/login");
    }

    // Generate new access token
    const newToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Set new access token in cookie
    res.cookie("token", newToken, { httpOnly: true, maxAge: 3600000 }); // 1 hour
    req.user = decoded;
    next();
  } catch (error) {
    return res.redirect("/login");
  }
};

module.exports = { protect, verifyToken };
