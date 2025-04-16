const express = require("express");
const Employee = require("../../models/Employee");
const {
  createEmployee,
  deleteEmployee,
  getEmployee,
  updateEmployee,
} = require("../../controllers/EmployeeController");
const router = express.Router();
const { protectApi } = require("../../middleware/authApi");
const User = require("../../models/User");

// API routes cho mobile app
router.get("/", protectApi, async (req, res) => {
  try {
    const employees = await Employee.find().populate({
      path: "userId",
      select: "username fullName email phoneNumber avatar gender role",
    });

    res.status(200).json({
      success: true,
      data: employees,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.get("/:id", protectApi, getEmployee);
router.post("/", protectApi, createEmployee);
router.put("/:id", protectApi, updateEmployee);
router.delete("/:id", protectApi, async (req, res) => {
  try {
    console.log("Xóa nhân viên với id:", req.params.id);
    const employee =
      (await Employee.findOne({ _id: req.params.id })) ||
      (await Employee.findOne({ employeeId: req.params.id }));

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhân viên",
      });
    }

    const userId = employee.userId;
    await Employee.findByIdAndDelete(employee._id);
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: "Đã xóa nhân viên và tài khoản người dùng thành công",
    });
  } catch (error) {
    console.error("Lỗi khi xóa nhân viên:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Lỗi khi xóa nhân viên",
    });
  }
});

module.exports = router;
