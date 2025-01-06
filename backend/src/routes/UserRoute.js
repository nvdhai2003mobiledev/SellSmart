const express = require('express');
const router = express.Router();
const userController = require('../controllers/UserController');

router.post('/signup', userController.createUser);
router.post('/login', userController.loginUser);
router.put('/updateuser/:id', userController.updateUser);

module.exports = router;
