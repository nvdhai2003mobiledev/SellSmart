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
      "-password -confirmPassword"
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
// Endpoint để thêm khách hàng mới từ trang tạo đơn hàng
const createCustomerFromOrder = async (req, res) => {
  try {
    const { fullName, phoneNumber, email, address } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!fullName || !phoneNumber || !email || !address) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp đầy đủ thông tin khách hàng",
      });
    }

    // Kiểm tra email hợp lệ
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Email không hợp lệ",
      });
    }

    // Kiểm tra số điện thoại hợp lệ
    const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: "Số điện thoại không hợp lệ",
      });
    }

    // Kiểm tra khách hàng đã tồn tại chưa (theo email hoặc số điện thoại)
    const existingCustomer = await Customer.findOne({
      $or: [{ email: email }, { phoneNumber: phoneNumber }],
    });

    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: "Email hoặc số điện thoại đã tồn tại trong hệ thống",
      });
    }

    // Tạo khách hàng mới
    const newCustomer = new Customer({
      fullName,
      phoneNumber,
      email,
      address,
    });

    // Lưu khách hàng vào cơ sở dữ liệu
    await newCustomer.save();



    res.redirect("/customers");

  } catch (error) {
    console.error("Lỗi khi thêm khách hàng:", error);

    // Xử lý lỗi duplicate key
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email hoặc số điện thoại đã tồn tại",
      });
    }

    res.status(500).json({
      success: false,
      message: "Lỗi server khi thêm khách hàng",
      error: error.message,
    });
  }
};

//API THÊM
// 🟢 API thêm khách hàng
const addCustomer = async (req, res) => {
  try {
    const { fullName, phoneNumber, email, birthDate, address, avatar } =
      req.body;

    // Kiểm tra nếu thiếu thông tin
    if (!fullName || !phoneNumber || !email || !address) {
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

    let processedBirthDate = null;
    if (birthDate && birthDate.trim() !== "") {
      processedBirthDate = new Date(birthDate);
      if (isNaN(processedBirthDate.getTime())) {
        processedBirthDate = null; // Nếu ngày không hợp lệ, gán null
      }
    }

    // Tạo khách hàng mới
    const newCustomer = new Customer({
      fullName,
      phoneNumber,
      email,
      birthDate: processedBirthDate,
      address,
      avatar,
    });

    await newCustomer.save();

    // Thay vì render, sử dụng redirect để tránh lỗi
    return res.redirect("/customers");

    // HOẶC nếu vẫn muốn render, đảm bảo đúng tên template và đủ biến
    // const customers = await Customer.find();
    // return res.render("dashboard/customers", { customers, page: "customers" });
  } catch (error) {
    console.error("Lỗi khi thêm khách hàng:", error); // Log lỗi chi tiết
    return res
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

    // Log thông tin request để debug
    console.log("Request Params:", req.params);
    console.log("Request Body:", req.body);

    // Kiểm tra ID có hợp lệ không
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({
        message: "ID khách hàng không hợp lệ!",
      });
    }

    // Validate dữ liệu bắt buộc
    if (!fullName || !phoneNumber || !email) {
      return res.status(400).json({
        message: "Vui lòng điền đầy đủ thông tin bắt buộc!",
      });
    }

    // Validate độ dài và định dạng
    if (fullName.trim().length < 3) {
      return res.status(400).json({
        message: "Họ tên phải có ít nhất 3 ký tự!",
      });
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({
        message: "Số điện thoại không hợp lệ! Phải có đúng 10 chữ số.",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Email không hợp lệ!",
      });
    }

    // Validate địa chỉ
    if (!address || address.trim().length < 5) {
      return res.status(400).json({
        message: "Địa chỉ phải có ít nhất 5 ký tự!",
      });
    }

    // Xử lý ngày sinh
    let processedBirthDate = null;
    if (birthDate && birthDate.trim() !== "") {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      const birthDateObj = new Date(birthDate);
      const today = new Date();

      if (!dateRegex.test(birthDate)) {
        return res.status(400).json({
          message: "Ngày sinh không hợp lệ! Định dạng: YYYY-MM-DD",
        });
      }

      if (birthDateObj > today) {
        return res.status(400).json({
          message: "Ngày sinh không được lớn hơn ngày hiện tại!",
        });
      }

      processedBirthDate = birthDateObj;
    }

    // Validate avatar
    if (avatar && avatar.trim() !== "") {
      const urlRegex = /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp))$/i;
      if (!urlRegex.test(avatar)) {
        return res.status(400).json({
          message: "Avatar phải là URL hợp lệ (png, jpg, jpeg, gif, webp)!",
        });
      }
    }

    // Kiểm tra email trùng
    const existingCustomerWithEmail = await Customer.findOne({
      email,
      _id: { $ne: customerId },
    });

    if (existingCustomerWithEmail) {
      return res.status(400).json({
        message: "Email đã tồn tại cho một khách hàng khác!",
      });
    }

    // Chuẩn bị dữ liệu cập nhật
    const updateData = {
      fullName,
      phoneNumber,
      email,
      address,
      ...(processedBirthDate && { birthDate: processedBirthDate }),
      ...(avatar && { avatar }),
    };

    // Cập nhật khách hàng
    const updatedCustomer = await Customer.findByIdAndUpdate(
      customerId,
      updateData,
      {
        new: true, // Trả về bản ghi mới
        runValidators: true, // Chạy validation
      }
    );

    // Kiểm tra kết quả cập nhật
    if (!updatedCustomer) {
      return res.status(404).json({
        message: "Không tìm thấy khách hàng!",
      });
    }

    // Log thông tin khách hàng sau khi cập nhật
    console.log("Khách hàng sau cập nhật:", updatedCustomer);

    // Trả về kết quả
    return res.status(200).json({
      message: "Cập nhật khách hàng thành công!",
      customer: updatedCustomer,
    });
  } catch (error) {
    // Log lỗi chi tiết
    console.error("Lỗi chi tiết khi cập nhật khách hàng:", error);

    // Xử lý các lỗi cụ thể
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

    // Lỗi chung
    return res.status(500).json({
      message: "Có lỗi xảy ra khi cập nhật khách hàng",
      error: error.message,
    });
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
    return res.json({ success: true, message: "Xóa thành công!" });

    // Xóa hoặc comment hai dòng dưới đây
    // const customers = await Customer.find();
    // res.render("customers", { customers });
  } catch (error) {
    console.error("Lỗi xóa khách hàng:", error);
    return res.status(500).json({ message: "Lỗi khi xóa khách hàng!" });
  }
};

const searchCustomerByPhone = async (req, res) => {
  const { phoneNumber } = req.query;

  try {
    const customers = await Customer.find({
      phoneNumber: { $regex: phoneNumber, $options: "i" },
    });
    res.status(200).json({ customers });
  } catch (error) {
    console.error("Lỗi khi tìm kiếm khách hàng:", error);
    res.status(500).json({ message: "Lỗi server" });
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
