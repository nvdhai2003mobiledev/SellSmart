const express = require('express');
const multer = require('multer');
const router = express.Router();
const ProfileController = require('../controllers/ProfileController');

// Cấu hình multer để lưu ảnh
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/avatars'); // Thư mục lưu ảnh
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Tên file
  },
});
const upload = multer({ storage });

// Route hiển thị thông tin cá nhân
router.get('/', ProfileController.renderProfiles);

// Route cập nhật thông tin cá nhân
router.post('/update/:id', upload.single('avatar'), ProfileController.updateProfile);

module.exports = router;