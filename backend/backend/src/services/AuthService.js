const User = require("../models/User");

exports.mobileLogin = async (usernameOrEmail, password) => {
  if (!usernameOrEmail || !password) {
    throw new Error("Vui lòng cung cấp tên đăng nhập/email và mật khẩu");
  }

  // Tìm user theo email hoặc username
  const user = await User.findOne({
    $or: [{ email: usernameOrEmail }, { username: usernameOrEmail }],
  });

  if (!user) {
    throw new Error("Tài khoản không tồn tại");
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw new Error("Mật khẩu không đúng");
  }

  // Return user object without sensitive data
  return {
    _id: user._id,
    role: user.role,
    fullName: user.fullName,
    email: user.email,
    avatar: user.avatar || null,
    phoneNumber: user.phoneNumber || null,
    address: user.address || null,
    gender: user.gender || null,
    dob: user.dob ? user.dob.toISOString() : null,
  };
}; 