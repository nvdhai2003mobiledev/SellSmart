const express = require("express");
const {
  getAllEmployees,
  createEmployee,
  deleteEmployee,
  getEmployee,
  updateEmployee,
} = require("../controllers/EmployeeController");
const router = express.Router();
const { protect } = require("../middleware/auth");

router.get("/", protect, getAllEmployees);
router.get("/find-employee/:id", protect, getEmployee);
router.post("/create-employee", createEmployee);
router.put("/update-employee/:id", protect, updateEmployee);
router.delete("/delete-employee/:id", protect, deleteEmployee);

module.exports = router;
