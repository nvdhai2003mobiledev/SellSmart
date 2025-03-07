const User = require('../models/User');
const bcrypt = require('bcrypt');
const { generalAccessToken } = require('./JwtService');

const loginUserMobile = (userLogin) => {
  return new Promise(async (resolve, reject) => {
    const { email, password } = userLogin;
    try {
      const checkUser = await User.findOne({ email }); // Tìm theo email
      if (!checkUser) {
        return resolve({ status: 'Error', message: 'Email không tồn tại' });
      }

      const isPasswordMatch = bcrypt.compareSync(password, checkUser.password);
      if (!isPasswordMatch) {
        return resolve({ status: 'Error', message: 'Mật khẩu không đúng' });
      }

      const access_token = await generalAccessToken({ id: checkUser.id, role: checkUser.role });

      resolve({
        status: 'Success',
        message: 'Đăng nhập thành công',
        access_token,
        role: checkUser.role,
      });
    } catch (error) {
      reject({ status: 'Error', message: 'Lỗi khi đăng nhập', error: error.message });
    }
  });
};

module.exports = { loginUserMobile };
