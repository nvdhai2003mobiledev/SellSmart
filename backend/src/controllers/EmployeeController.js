const Employee = require("../models/Employee");
const User = require("../models/User");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const multer = require("multer");

// Cấu hình multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/avatars");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`,
    );
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Chỉ chấp nhận file ảnh định dạng JPEG, JPG hoặc PNG"));
  },
});

// Tạo nhân viên mới
exports.createEmployee = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    console.log("Request body:", req.body); // Debug
    console.log("Uploaded file:", req.file); // Debug

    const {
      username,
      fullName,
      gender,
      dob,
      avatarUrl,
      address,
      email,
      phoneNumber,
      password,
      role,
      employeeId,
      department,
      position,
      salary,
      hireDate,
      workStatus,
      bankAccount,
    } = req.body;

    if (!username || !email || !password || !employeeId) {
      throw new Error(
        "Các trường username, email, password và employeeId là bắt buộc",
      );
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) throw new Error("Username hoặc email đã tồn tại");

    // Xử lý avatar
    let avatar = null;
    if (req.file) {
      avatar = `/uploads/avatars/${req.file.filename}`;
      console.log("Avatar from file:", avatar);
    } else if (avatarUrl) {
      avatar = avatarUrl;
      console.log("Avatar from URL:", avatar);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      fullName,
      gender,
      dob,
      avatar,
      address,
      email,
      phoneNumber,
      password: hashedPassword,
      role: role || "employee",
    });
    await user.save({ session });

    const employee = new Employee({
      userId: user._id,
      employeeId,
      department,
      position,
      salary,
      hireDate: hireDate || new Date(),
      workStatus: workStatus || "active",
      bankAccount,
    });
    await employee.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      data: {
        user: { _id: user._id, username, fullName, email, phoneNumber, role },
        employee,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Export middleware upload để dùng trong route
exports.upload = upload.single("avatarFile");

// Lấy tất cả nhân viên
exports.getAllEmployees = async (req, res) => {
  try {
    // Lấy tất cả Employee và populate thông tin User
    const employees = await Employee.find().populate({
      path: "userId",
      select: "username fullName email phoneNumber avatar gender role",
    });

    // Lọc chỉ giữ lại những Employee mà userId có role là "employee"
    const filteredEmployees = employees.filter(
      (emp) => emp.userId && emp.userId.role === "employee",
    );

    // Render danh sách nhân viên đã lọc
    res.render("dashboard/employees", {
      title: "Quản lý nhân viên",
      employees: filteredEmployees,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Lấy thông tin một nhân viên
exports.getEmployee = async (req, res) => {
  try {
    const employee = await Employee.findOne({
      employeeId: req.params.id,
    }).populate({
      path: "userId",
      select: "-password",
    });

    if (!employee) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy nhân viên" });
    }

    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Cập nhật thông tin nhân viên
exports.updateEmployee = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { department, position, salary, workStatus, bankAccount, userInfo } =
      req.body;

    const employeeUpdateData = {
      department,
      position,
      salary,
      workStatus,
      bankAccount,
    };
    Object.keys(employeeUpdateData).forEach(
      (key) =>
        employeeUpdateData[key] === undefined && delete employeeUpdateData[key],
    );

    const employee = await Employee.findOneAndUpdate(
      { employeeId: req.params.id },
      employeeUpdateData,
      { new: true, runValidators: true, session },
    );

    if (!employee) {
      throw new Error("Không tìm thấy nhân viên");
    }

    if (userInfo && Object.keys(userInfo).length > 0) {
      const { password, role, ...safeUserFields } = userInfo;
      if (password) safeUserFields.password = await bcrypt.hash(password, 10);

      const updatedUser = await User.findByIdAndUpdate(
        employee.userId,
        safeUserFields,
        { new: true, runValidators: true, session },
      );

      if (!updatedUser) throw new Error("Không tìm thấy thông tin người dùng");
    }

    await session.commitTransaction();
    session.endSession();

    const updatedEmployee = await Employee.findOne({
      employeeId: req.params.id,
    }).populate({
      path: "userId",
      select: "-password",
    });

    res.status(200).json({ success: true, data: updatedEmployee });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ success: false, message: error.message });
  }
};

// Xóa nhân viên
exports.deleteEmployee = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const employee = await Employee.findOne({ employeeId: req.params.id });
    if (!employee) throw new Error("Không tìm thấy nhân viên");

    const userId = employee.userId;
    await Employee.findOneAndDelete({ employeeId: req.params.id }, { session });
    await User.findByIdAndDelete(userId, { session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "Đã xóa nhân viên và tài khoản người dùng thành công",
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ success: false, message: error.message });
  }
};
