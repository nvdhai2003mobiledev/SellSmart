const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const {
  getAllEmployees,
  createEmployee,
  deleteEmployee,
  getEmployee,
  updateEmployee,
} = require("../controllers/EmployeeController");
const router = express.Router();
// router.use(protect);
// router.use(authorize("admin"));

router.get("/", getAllEmployees);
router.get("/find-employee/:id", getEmployee);
router.post("/create-employee", createEmployee);
router.put("/update-employee/:id", updateEmployee);
router.delete("/delete-employee/:id", deleteEmployee);

module.exports = router;
