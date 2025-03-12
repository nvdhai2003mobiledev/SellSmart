const express = require("express");
const { getDashboard } = require("../controllers/DashboardController");
const router = express.Router();

router.get("/", getDashboard);

module.exports = router;
