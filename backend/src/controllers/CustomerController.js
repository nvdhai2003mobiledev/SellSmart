const mongoose = require("mongoose");
const Customer = require("../models/Customer");

// 🟢 Hiển thị danh sách khách hàng (render EJS)
const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find();
    res.render("dashboard/customers", { customers, page: "customers" });
    // res.json(customers);
  } catch (error) {
    console.error("Lỗi lấy danh sách khách hàng:", error);
    res.status(500).send("Lỗi server!");
  }
};

// 🟢 Lấy danh sách khách hàng dưới dạng JSON
const getCustomerAsJson = async (req, res) => {
  try {
    const customers = await Customer.find().select(
      "-password -confirmPassword",
    );
    res.json(customers);
  } catch (error) {
    console.error("Lỗi lấy danh sách khách hàng:", error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách khách hàng!" });
  }
};

// 🟢 Lấy khách hàng theo ID
const getCustomerById = async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ message: "ID khách hàng không hợp lệ!" });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Không tìm thấy khách hàng!" });
    }

    res.json(customer);
  } catch (error) {
    console.error("Lỗi lấy khách hàng:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
};

// 🟢 API thêm khách hàng
const addCustomer = async (req, res) => {
  try {
    const { fullName, phoneNumber, email, birthDate, address, avatar } =
      req.body;

    // Kiểm tra nếu thiếu thông tin
    if (!fullName || !phoneNumber || !email || !birthDate || !address) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập đầy đủ thông tin!" });
    }

    // Kiểm tra email đã tồn tại trong database chưa
    const existingCustomer = await Customer.findOne({ email: email });
    if (existingCustomer) {
      return res
        .status(400)
        .json({ message: "Email đã tồn tại! Vui lòng nhập email khác." });
    }

    // Tạo khách hàng mới
    const newCustomer = new Customer({
      fullName,
      phoneNumber,
      email,
      birthDate: new Date(birthDate),
      address,
      avatar,
    });

    await newCustomer.save();

    // Trả về danh sách khách hàng mới
    const customers = await Customer.find();
    res.render("customers", { customers });
  } catch (error) {
    console.error("Lỗi khi thêm khách hàng:", error); // Log lỗi chi tiết
    res
      .status(500)
      .json({ message: "Lỗi khi thêm khách hàng!", error: error.message });
  }
};

// 🟢 API cập nhật khách hàng
const updateCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { fullName, phoneNumber, email, address, birthDate, avatar } =
      req.body;

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ message: "ID khách hàng không hợp lệ!" });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Không tìm thấy khách hàng!" });
    }

    const updatedCustomer = await Customer.findByIdAndUpdate(
      customerId,
      { fullName, phoneNumber, email, address, birthDate, avatar },
      { new: true, runValidators: true },
    );

    console.log("Khách hàng sau cập nhật:", updatedCustomer);
    return res.json({
      message: "Cập nhật thành công!",
      customer: updatedCustomer,
    });
  } catch (error) {
    console.error("Lỗi cập nhật khách hàng:", error);
    return res.status(500).json({ message: "Lỗi khi cập nhật khách hàng!" });
  }
};

// 🟢 API xóa khách hàng
const deleteCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ message: "ID khách hàng không hợp lệ!" });
    }

    const deletedCustomer = await Customer.findByIdAndDelete(customerId);
    if (!deletedCustomer) {
      return res.status(404).json({ message: "Không tìm thấy khách hàng!" });
    }

    console.log("Đã xóa khách hàng:", deletedCustomer);
    res.json({ message: "Xóa thành công!" });

    const customers = await Customer.find();
    res.render("customers", { customers });
  } catch (error) {
    console.error("Lỗi xóa khách hàng:", error);
    res.status(500).json({ message: "Lỗi khi xóa khách hàng!" });
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
};
