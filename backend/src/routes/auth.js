const express = require("express");
const router = express.Router();
const { loginForm, login, logout } = require("../controllers/AuthController");
const { protect } = require("../middleware/auth");

// Định nghĩa routes
router.get("/login", loginForm);
router.post("/login", login);
router.get("/logout", protect, logout);

module.exports = router;
