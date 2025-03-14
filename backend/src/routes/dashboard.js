const express = require("express");
const { getDashboard } = require("../controllers/DashboardController");
const router = express.Router();
const { protect } = require("../middleware/auth");

router.get("/", protect, getDashboard);

module.exports = router;
