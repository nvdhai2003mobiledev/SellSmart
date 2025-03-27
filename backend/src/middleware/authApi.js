const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Middleware bảo vệ API cho mobile app
 * Kiểm tra JWT token từ Authorization header (Bearer token)
 */
exports.protectApi = async (req, res, next) => {
  let token;

  // Kiểm tra header Authorization có Bearer token không
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    // Lấy token từ header Authorization
    token = req.headers.authorization.split(" ")[1];
  }

  // Nếu không có token, trả về lỗi 401
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Không có quyền truy cập. Vui lòng đăng nhập",
    });
  }

  try {
    // Xác thực token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Tìm user theo ID trong token
    const user = await User.findById(decoded.id).select("-password");

    // Nếu không tìm thấy user
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Người dùng không tồn tại",
      });
    }

    // Lưu thông tin user vào request
    req.user = user;
    next();
  } catch (error) {
    console.error("API Auth Error:", error.message);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token đã hết hạn. Vui lòng đăng nhập lại",
        expired: true,
      });
    }

    return res.status(401).json({
      success: false,
      message: "Token không hợp lệ. Vui lòng đăng nhập lại",
    });
  }
};

/**
 * API endpoint để refresh token
 */
exports.refreshToken = async (req, res) => {
  console.log("Nhận request refresh token:", {
    body: req.body,
    hasRefreshToken: !!req.body.refreshToken,
    timestamp: new Date().toISOString(),
  });

  const { refreshToken } = req.body;

  if (!refreshToken) {
    console.log("Refresh token không được cung cấp");
    return res.status(400).json({
      success: false,
      message: "Refresh token không được cung cấp",
    });
  }

  try {
    // Xác thực refresh token
    console.log("Đang xác thực refresh token");
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    console.log("Refresh token hợp lệ, decoded:", {
      userId: decoded.id,
      exp: decoded.exp,
      iat: decoded.iat,
    });

    // Tìm user có refresh token này
    const user = await User.findOne({
      _id: decoded.id,
      refreshToken: refreshToken,
    });

    if (!user) {
      console.log("Không tìm thấy user với refresh token này", {
        userId: decoded.id,
      });
      return res.status(401).json({
        success: false,
        message: "Refresh token không hợp lệ hoặc đã hết hạn",
      });
    }

    console.log("Tìm thấy user cho refresh token", {
      userId: user._id,
      username: user.username,
      role: user.role,
    });

    // Tạo access token mới
    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Tạo refresh token mới (tùy chọn, có thể giữ nguyên refresh token cũ)
    const newRefreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    // Cập nhật refresh token mới vào database
    user.refreshToken = newRefreshToken;
    await user.save();

    console.log("Đã tạo token mới thành công", {
      userId: user._id,
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!newRefreshToken,
    });

    return res.status(200).json({
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: 3600, // 1 giờ tính bằng giây
      },
    });
  } catch (error) {
    console.error("Refresh Token Error:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Refresh token đã hết hạn, vui lòng đăng nhập lại",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Refresh token không hợp lệ hoặc đã hết hạn",
    });
  }
};
