const express = require('express');
const router = express.Router();
const userControllerMobile = require('../controllers/UserControllerMobile');

router.post('/login', userControllerMobile.loginMobile);

module.exports = router;
