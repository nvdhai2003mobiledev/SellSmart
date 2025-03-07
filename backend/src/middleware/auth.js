const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Kiểm tra đăng nhập
exports.protect = async (req, res, next) => {
  try {
    let token;
    // Kiểm tra token từ cookie
    if (req.cookies.token) {
      token = req.cookies.token;
    }

    // Nếu không  có token sẽ chuyển sang trang đăng nhập
    if (!token) {
      return res.redirect("/login");
    }

    // Xác thực token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Lấy thông tin user từ token
    req.user = await User.findById(decoded.id);

    next();
  } catch (error) {
    console.log(error);
    res.redirect("/login");
  }
};

// Kiểm tra quyền truy cập
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json("error/403", {
        title: "Không có quyền truy cập",
        message: "Bạn không có quyền truy cập trang này",
      });
    }
    next();
  };
};
