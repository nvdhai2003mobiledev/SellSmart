const Provider = require("../models/Provider");
// exports.getAllProviders = async (req, res) => {
//     try {
//         const providers = await Provider.find(); // Lấy danh sách nhà cung cấp từ MongoDB
//         res.json(providers); // Trả về dữ liệu dưới dạng JSON
//     } catch (error) {
//         res.status(500).json({ message: "Lỗi khi lấy danh sách nhà cung cấp!", error });
//     }
// };
// Lấy danh sách tất cả nhà cung cấp
exports.getAllProviders = async (req, res) => {
  try {
    const providers = await Provider.find(); // Lấy danh sách từ MongoDB
    res.render("dashboard/providers", {
      providers,
      page: "providers",
      admin: req.user || null,
      title: "Quản lý nhà cung cấp",
    });
  } catch (error) {
    res.status(500).send("Lỗi khi lấy danh sách nhà cung cấp!");
  }
};

// Lấy thông tin một nhà cung cấp theo ID
exports.getProviderById = async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id);
    if (!provider) {
      return res.status(404).json({ message: "Nhà cung cấp không tồn tại" });
    }
    res.status(200).json(provider);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error });
  }
};

// Thêm mới một nhà cung cấp
exports.createProvider = async (req, res) => {
  try {
    const { fullName, phoneNumber, email, address, status } = req.body;

    // Kiểm tra dữ liệu hợp lệ
    const validation = validateProvider(fullName, email, phoneNumber);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }

    // Tạo nhà cung cấp mới nếu dữ liệu hợp lệ
    const newProvider = new Provider({
      fullName,
      phoneNumber,
      email,
      address,
      status,
    });
    await newProvider.save();

    res.status(201).json(newProvider);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error });
  }
};

// Cập nhật thông tin nhà cung cấp
exports.updateProvider = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email, phoneNumber, address, status } = req.body;

    // Kiểm tra dữ liệu hợp lệ
    const validation = validateProvider(fullName, email, phoneNumber);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }

    const updatedProvider = await Provider.findByIdAndUpdate(
      id,
      { fullName, email, phoneNumber, address, status },
      { new: true },
    );

    if (!updatedProvider) {
      return res.status(404).json({ message: "Nhà cung cấp không tồn tại!" });
    }

    res.json({ message: "Cập nhật thành công!", provider: updatedProvider });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi cập nhật!", error });
  }
};

// Xóa nhà cung cấp
exports.deleteProvider = async (req, res) => {
  try {
    const deletedProvider = await Provider.findByIdAndDelete(req.params.id);
    if (!deletedProvider) {
      return res.status(404).json({ message: "Nhà cung cấp không tồn tại" });
    }
    res.status(200).json({ message: "Xóa nhà cung cấp thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error });
  }
};
const validateProvider = (fullName, email, phoneNumber) => {
  if (!fullName || fullName.length < 3) {
    return { valid: false, message: "Tên phải có ít nhất 3 ký tự!" };
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!email || !emailRegex.test(email)) {
    return { valid: false, message: "Email không hợp lệ!" };
  }

  const phoneRegex = /^[0-9]{10,11}$/;
  if (!phoneNumber || !phoneRegex.test(phoneNumber)) {
    return { valid: false, message: "Số điện thoại phải có 10-11 chữ số!" };
  }

  return { valid: true };
};
// Tìm kiếm nhà cung cấp theo số điện thoại
exports.searchProviderByPhone = async (req, res) => {
  try {
    const { phone } = req.query; // Lấy số điện thoại từ query params

    if (!phone) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập số điện thoại để tìm kiếm!" });
    }

    const providers = await Provider.find({
      phoneNumber: { $regex: phone, $options: "i" },
    });

    if (providers.length === 0) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy nhà cung cấp nào!" });
    }

    res.json(providers);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server!", error });
  }
};
