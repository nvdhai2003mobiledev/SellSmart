const mongoose = require("mongoose");
const Customer = require("../models/Customer");

// Hàm chung để kiểm tra dữ liệu đầu vào
const validateCustomerInput = (data, requiredFields) => {
  const { fullName, phoneNumber, email, address } = data;

  const missingFields = requiredFields.filter(
    (field) => !data[field] || data[field].trim() === ""
  );
  if (missingFields.length > 0) {
    return {
      isValid: false,
      message: `Vui lòng cung cấp đầy đủ: ${missingFields.join(", ")}`,
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, message: "Email không hợp lệ" };
  }

  const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
  if (!phoneRegex.test(phoneNumber)) {
    return { isValid: false, message: "Số điện thoại không hợp lệ" };
  }

  if (fullName.trim().length < 3) {
    return { isValid: false, message: "Họ tên phải có ít nhất 3 ký tự" };
  }

  return { isValid: true };
};

// Hàm kiểm tra khách hàng đã tồn tại
const checkExistingCustomer = async (conditions) => {
  return await Customer.findOne(conditions);
};

// Hàm xử lý ngày sinh
const processBirthDate = (birthDate) => {
  if (!birthDate || birthDate.trim() === "") return null;

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const birthDateObj = new Date(birthDate);
  const today = new Date();

  if (!dateRegex.test(birthDate) || isNaN(birthDateObj.getTime())) {
    throw new Error("Ngày sinh không hợp lệ! Định dạng: YYYY-MM-DD");
  }
  if (birthDateObj > today) {
    throw new Error("Ngày sinh không được lớn hơn ngày hiện tại!");
  }
  return birthDateObj;
};

// Hàm kiểm tra ObjectId
const isValidObjectId = (id, res) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ message: "ID khách hàng không hợp lệ!" });
    return false;
  }
  return true;
};

// Hàm xử lý lỗi
const handleError = (res, error, message) => {
  console.error(`${message}:`, error);
  res.status(500).json({ message, error: error.message });
};

// 🟢 Hiển thị danh sách khách hàng (render EJS)
const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find();
    res.render("dashboard/customers", { customers, page: "customers" });
  } catch (error) {
    handleError(res, error, "Lỗi lấy danh sách khách hàng");
  }
};

// 🟢 Lấy danh sách khách hàng dưới dạng JSON
const getCustomerAsJson = async (req, res) => {
  try {
    const customers = await Customer.find().select("-password -confirmPassword");
    res.json(customers);
  } catch (error) {
    handleError(res, error, "Lỗi lấy danh sách khách hàng");
  }
};

// 🟢 Lấy khách hàng theo ID
const getCustomerById = async (req, res) => {
  try {
    const { customerId } = req.params;
    if (!isValidObjectId(customerId, res)) return;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Không tìm thấy khách hàng!" });
    }

    res.json(customer);
  } catch (error) {
    handleError(res, error, "Lỗi lấy khách hàng");
  }
};

// 🟢 Thêm khách hàng từ trang tạo đơn hàng
const createCustomerFromOrder = async (req, res) => {
  try {
    const { fullName, phoneNumber, email, address } = req.body;

    const validation = validateCustomerInput(req.body, [
      "fullName",
      "phoneNumber",
      "email",
      "address",
    ]);
    if (!validation.isValid) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    const existingCustomer = await checkExistingCustomer({
      $or: [{ email }, { phoneNumber }],
    });
    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: "Email hoặc số điện thoại đã tồn tại",
      });
    }

    const newCustomer = new Customer({ fullName, phoneNumber, email, address });
    await newCustomer.save();

    res.redirect("/customers");
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email hoặc số điện thoại đã tồn tại",
      });
    }
    handleError(res, error, "Lỗi khi thêm khách hàng");
  }
};

// 🟢 API thêm khách hàng
const addCustomer = async (req, res) => {
  try {
    const { fullName, phoneNumber, email, birthDate, address, avatar } = req.body;

    const validation = validateCustomerInput(req.body, [
      "fullName",
      "phoneNumber",
      "email",
    ]);
    if (!validation.isValid) {
      return res.status(400).json({ message: validation.message });
    }

    const existingCustomer = await checkExistingCustomer({ email });
    if (existingCustomer) {
      return res.status(400).json({ message: "Email đã tồn tại" });
    }

    let processedBirthDate = null;
    try {
      processedBirthDate = processBirthDate(birthDate);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }

    if (avatar && avatar.trim() !== "") {
      const urlRegex = /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp))$/i;
      if (!urlRegex.test(avatar)) {
        return res.status(400).json({
          message: "Avatar phải là URL hợp lệ (png, jpg, jpeg, gif, webp)!",
        });
      }
    }

    const newCustomer = new Customer({
      fullName,
      phoneNumber,
      email,
      birthDate: processedBirthDate,
      address: address || "",
      avatar,
    });
    await newCustomer.save();

    return res.status(201).json({
      success: true,
      message: "Thêm khách hàng thành công!",
      customer: newCustomer,
    });
  } catch (error) {
    handleError(res, error, "Lỗi khi thêm khách hàng");
  }
};

// 🟢 API cập nhật khách hàng
const updateCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { fullName, phoneNumber, email, address, birthDate, avatar } = req.body;

    if (!isValidObjectId(customerId, res)) return;

    const validation = validateCustomerInput(req.body, [
      "fullName",
      "phoneNumber",
      "email",
    ]);
    if (!validation.isValid) {
      return res.status(400).json({ message: validation.message });
    }

    if (address && address.trim().length < 5) {
      return res.status(400).json({
        message: "Địa chỉ phải có ít nhất 5 ký tự!",
      });
    }

    let processedBirthDate = null;
    try {
      processedBirthDate = processBirthDate(birthDate);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }

    if (avatar && avatar.trim() !== "") {
      const urlRegex = /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp))$/i;
      if (!urlRegex.test(avatar)) {
        return res.status(400).json({
          message: "Avatar phải là URL hợp lệ (png, jpg, jpeg, gif, webp)!",
        });
      }
    }

    const existingCustomerWithEmail = await checkExistingCustomer({
      email,
      _id: { $ne: customerId },
    });
    if (existingCustomerWithEmail) {
      return res.status(400).json({
        message: "Email đã tồn tại cho một khách hàng khác!",
      });
    }

    const updateData = {
      fullName,
      phoneNumber,
      email,
      ...(address && { address }),
      ...(processedBirthDate && { birthDate: processedBirthDate }),
      ...(avatar && { avatar }),
    };

    const updatedCustomer = await Customer.findByIdAndUpdate(customerId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedCustomer) {
      return res.status(404).json({ message: "Không tìm thấy khách hàng!" });
    }

    return res.status(200).json({
      message: "Cập nhật khách hàng thành công!",
      customer: updatedCustomer,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Lỗi xác thực dữ liệu",
        errors: Object.values(error.errors).map((err) => err.message),
      });
    }
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Email hoặc số điện thoại đã tồn tại!",
      });
    }
    handleError(res, error, "Lỗi khi cập nhật khách hàng");
  }
};

// 🟢 API xóa khách hàng
const deleteCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    if (!isValidObjectId(customerId, res)) return;

    const deletedCustomer = await Customer.findByIdAndDelete(customerId);
    if (!deletedCustomer) {
      return res.status(404).json({ message: "Không tìm thấy khách hàng!" });
    }

    return res.json({ success: true, message: "Xóa thành công!" });
  } catch (error) {
    handleError(res, error, "Lỗi khi xóa khách hàng");
  }
};

// 🟢 Tìm kiếm khách hàng theo số điện thoại
const searchCustomerByPhone = async (req, res) => {
  const { phoneNumber } = req.query;

  try {
    if (!phoneNumber || phoneNumber.trim() === "") {
      return res.status(200).json({ success: true, customers: [] });
    }

    const customers = await Customer.find({
      phoneNumber: { $regex: phoneNumber, $options: "i" },
    }).select("-password -confirmPassword");

    res.status(200).json({ success: true, customers });
  } catch (error) {
    handleError(res, error, "Lỗi khi tìm kiếm khách hàng");
  }
};

// ✅ Xuất tất cả hàm
module.exports = {
  getCustomers,
  getCustomerAsJson,
  getCustomerById,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  searchCustomerByPhone,
  createCustomerFromOrder,
};