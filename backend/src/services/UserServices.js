const Customer = require('../models/Customer');
const bcrypt = require('bcrypt');
const { generalAccessToken } = require('./JwtService');

const createUser = (newUser) => {
  return new Promise(async (resolve, reject) => {
    const {
      fullName,
      phoneNumber,
      email,
      password,
      confirmPassword,
      birthDate,
      address,
      avatar,
    } = newUser;
    try {
      const checkUser = await Customer.findOne({
        email: email,
      });
      if (checkUser !== null) {
        resolve({
          status: 'Ok',
          message: 'email is already',
        });
      }
      const existingUser = await Customer.findOne({ phoneNumber });
      if (existingUser) {
        return res.status(400).json({
          status: 'Error',
          message: 'Phone number already exists',
        });
      }
      const hash = bcrypt.hashSync(password, 10);
      const createUser = await Customer.create({
        fullName,
        phoneNumber,
        email,
        password: hash,
        confirmPassword: hash,
        birthDate,
        address,
        avatar,
      });

      if (createUser) {
        resolve({
          status: 'Ok',
          message: 'Success',
          data: createUser,
        });
      }
    } catch (error) {
      console.error('Database Error:', error); // Thêm log cụ thể
      reject({
        status: 'Error',
        message: 'Failed to create user',
        error: error.message, // Log lỗi cụ thể
      });
    }
  });
};

const loginUser = (userLogin) => {
  return new Promise(async (resolve, reject) => {
    const { email, password } = userLogin;
    try {
      const checkUser = await Customer.findOne({
        email: email,
      });
      if (checkUser === null) {
        resolve({
          status: 'Ok',
          message: 'email is not defined',
        });
      }
      const comparePassword = bcrypt.compareSync(password, checkUser.password);
      console.log('comparePassword', comparePassword);

      if (!comparePassword) {
        resolve({
          status: 'Ok',
          message: 'The password and username is incorrect',
        });
      }
      const access_token = await generalAccessToken({
        id: checkUser.id,
      });
      // const refresh_token = await generalRefreshToken({
      //     id : checkUser.id,

      // })
      console.log('access_token :', access_token);

      resolve({
        status: 'Ok',
        message: 'Success',
        access_token,
        // refresh_token
      });
    } catch (error) {
      console.error('Database Error:', error); // Thêm log cụ thể
      reject({
        status: 'Error',
        message: 'Failed to login',
        error: error.message, // Log lỗi cụ thể
      });
    }
  });
};
const updateUser = (id, data) => {
  return new Promise(async (resolve, reject) => {
    try {
      const checkUser = await Customer.findOne({ _id: id });
      if (checkUser === null) {
        reject({
          status: 'Error',
          message: 'id is undifined',
          error: error.message,
        });
      }

      const updateUser = await Customer.findByIdAndUpdate(id, data);
      console.log('update : ', updateUser);

      resolve({
        status: 'Ok',
        message: 'Success',
        data: updateUser,
      });
    } catch (error) {
      console.error('Database Error:', error); // Thêm log cụ thể
      reject({
        status: 'Error',
        message: 'Failed to login',
        error: error.message, // Log lỗi cụ thể
      });
    }
  });
};
module.exports = {
  createUser,
  loginUser,
  updateUser,
};
