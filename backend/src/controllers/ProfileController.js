const User = require('../models/User'); // Import model User

// Hàm render giao diện thông tin cá nhân
const renderProfiles = async (req, res) => {
  try {
    const user = await User.findOne({ role: 'admin' }); // Lấy thông tin Admin từ bảng User
    res.render('profile', { user, message: null }); // Render file EJS và truyền dữ liệu
  } catch (error) {
    console.error('Error in renderProfiles:', error);
    res.status(500).send('Không thể hiển thị thông tin cá nhân');
  }
};

// Hàm cập nhật thông tin cá nhân
const updateProfile = async (req, res) => {
  try {
    const updatedData = {
      fullName: req.body.fullName,
      email: req.body.email,
      phoneNumber: req.body.phoneNumber,
      address: req.body.address,
    };

    await User.findByIdAndUpdate(req.params.id, updatedData, { new: true }); // Cập nhật thông tin User

    // Trả về thông báo thành công
    const user = await User.findById(req.params.id); // Lấy lại thông tin mới
    res.render('profile', { user, message: 'Cập nhật thông tin thành công!' });
  } catch (error) {
    console.error('Error in updateProfile:', error);
    res.status(500).send('Không thể cập nhật thông tin cá nhân');
  }
};

module.exports = {
  renderProfiles,
  updateProfile,
};