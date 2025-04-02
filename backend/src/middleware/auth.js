const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  // Kiểm tra token từ cookie (web) hoặc header Authorization (mobile app)
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    // Lấy token từ header Authorization: Bearer TOKEN
    token = req.headers.authorization.split(' ')[1];
  }

  const refreshToken = req.cookies?.refreshToken;

  // Nếu không có token
  if (!token) {
    // Kiểm tra API request (từ app mobile)
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(401).json({ 
        message: "Bạn không có quyền thực hiện chức năng này. Vui lòng đăng nhập lại." 
      });
    }

    // Nếu có refreshToken, thử dùng refreshToken
    if (refreshToken) {
      return verifyRefreshToken(req, res, next);
    }

    // Đối với web request
    return res.status(401).render("auth/login", {
      title: "Đăng nhập",
      error: "Bạn cần đăng nhập để truy cập trang này",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Lấy user từ database
    const user = await User.findById(decoded.id).select(
      "fullName email avatar role"
    );

    if (!user) {
      // Xử lý response dựa vào loại request
      if (req.originalUrl.startsWith('/api/')) {
        return res.status(401).json({ 
          message: "Tài khoản không tồn tại" 
        });
      }
      
      res.clearCookie("token");
      return res.status(401).render("auth/login", {
        title: "Đăng nhập",
        error: "Tài khoản không tồn tại",
      });
    }

    // Kiểm tra role cho web interface (không phải API)
    // Cho phép cả admin và employee truy cập API promotions
    if (user.role !== "admin" && 
        !req.originalUrl.startsWith('/api/') && 
        !req.originalUrl.includes('/promotions/api/')) {
      return res.status(403).render("auth/login", {
        title: "Đăng nhập",
        error: "Chỉ admin mới được truy cập",
      });
    }

    req.user = user; // Lưu thông tin user vào request
    res.locals.admin = user; // Gửi thông tin đến EJS để dùng trong template
    next();
  } catch (error) {
    console.error("Lỗi xác thực:", error.message);
    
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(401).json({ 
        message: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn" 
      });
    }
    
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
