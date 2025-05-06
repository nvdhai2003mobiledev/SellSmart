const express = require('express');
const router = express.Router();
const ProfileController = require('../controllers/ProfileController');

// Route hiển thị thông tin cá nhân
router.get('/', ProfileController.renderProfiles);

// Route cập nhật thông tin cá nhân
router.post('/update/:id', ProfileController.updateProfile);

module.exports = router;