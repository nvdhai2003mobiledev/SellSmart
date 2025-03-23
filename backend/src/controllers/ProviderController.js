const Provider = require("../models/Provider");

// Lấy danh sách tất cả nhà cung cấp
const getAllProviders = async (req, res) => {
    try {
        const providers = await Provider.find();

        // Kiểm tra nếu yêu cầu là JSON hoặc render EJS
        if (req.path.includes("/json") || req.headers.accept === "application/json") {
            return res.status(200).json({
                status: "Ok",
                data: providers,
            });
        }

        res.render("dashboard/providers", {
            providers,
            page: "provider",
            admin: req.user || null,
        });
    } catch (error) {
        console.error("Error fetching providers:", error);
        res.status(500).json({
            status: "Error",
            message: "Lỗi khi lấy danh sách nhà cung cấp",
        });
    }
};

// Lấy thông tin một nhà cung cấp theo ID
const getProviderById = async (req, res) => {
    try {
        const provider = await Provider.findById(req.params.id);
        if (!provider) {
            return res.status(404).json({
                status: "Error",
                message: "Nhà cung cấp không tồn tại",
            });
        }

        res.status(200).json({
            status: "Ok",
            data: provider,
        });
    } catch (error) {
        console.error("Error fetching provider:", error);
        res.status(500).json({
            status: "Error",
            message: "Lỗi khi lấy thông tin nhà cung cấp",
        });
    }
};

// Thêm mới một nhà cung cấp
const createProvider = async (req, res) => {
    try {
        const { fullName, phoneNumber, email, address, status } = req.body;

        // Kiểm tra dữ liệu hợp lệ
        const validation = validateProvider(fullName, email, phoneNumber);
        if (!validation.valid) {
            return res.status(400).json({
                status: "Error",
                message: validation.message,
            });
        }

        // Tạo nhà cung cấp mới
        const newProvider = new Provider({ fullName, phoneNumber, email, address, status });
        const savedProvider = await newProvider.save();

        res.status(201).json({
            status: "Ok",
            message: "Nhà cung cấp đã được thêm thành công",
            data: savedProvider,
        });
    } catch (error) {
        console.error("Error creating provider:", error);
        res.status(500).json({
            status: "Error",
            message: "Lỗi khi thêm nhà cung cấp",
        });
    }
};

// Cập nhật thông tin nhà cung cấp
const updateProvider = async (req, res) => {
    try {
        const { id } = req.params;
        const { fullName, email, phoneNumber, address, status } = req.body;

        // Kiểm tra dữ liệu hợp lệ
        const validation = validateProvider(fullName, email, phoneNumber);
        if (!validation.valid) {
            return res.status(400).json({
                status: "Error",
                message: validation.message,
            });
        }

        const updatedProvider = await Provider.findByIdAndUpdate(
            id,
            { fullName, email, phoneNumber, address, status },
            { new: true }
        );

        if (!updatedProvider) {
            return res.status(404).json({
                status: "Error",
                message: "Nhà cung cấp không tồn tại",
            });
        }

        res.status(200).json({
            status: "Ok",
            message: "Nhà cung cấp đã được cập nhật thành công",
            data: updatedProvider,
        });
    } catch (error) {
        console.error("Error updating provider:", error);
        res.status(500).json({
            status: "Error",
            message: "Lỗi khi cập nhật nhà cung cấp",
        });
    }
};

// Xóa nhà cung cấp
const deleteProvider = async (req, res) => {
    try {
        const deletedProvider = await Provider.findByIdAndDelete(req.params.id);
        if (!deletedProvider) {
            return res.status(404).json({
                status: "Error",
                message: "Nhà cung cấp không tồn tại",
            });
        }

        res.status(200).json({
            status: "Ok",
            message: "Nhà cung cấp đã được xóa thành công",
        });
    } catch (error) {
        console.error("Error deleting provider:", error);
        res.status(500).json({
            status: "Error",
            message: "Lỗi khi xóa nhà cung cấp",
        });
    }
};

// Tìm kiếm nhà cung cấp theo số điện thoại
const searchProviderByPhone = async (req, res) => {
    try {
        const { phone } = req.query;

        if (!phone) {
            return res.status(400).json({
                status: "Error",
                message: "Vui lòng nhập số điện thoại để tìm kiếm",
            });
        }

        const providers = await Provider.find({
            phoneNumber: { $regex: phone, $options: "i" },
        });

        if (providers.length === 0) {
            return res.status(404).json({
                status: "Error",
                message: "Không tìm thấy nhà cung cấp nào",
            });
        }

        res.status(200).json({
            status: "Ok",
            data: providers,
        });
    } catch (error) {
        console.error("Error searching providers:", error);
        res.status(500).json({
            status: "Error",
            message: "Lỗi khi tìm kiếm nhà cung cấp",
        });
    }
};

// Hàm kiểm tra dữ liệu hợp lệ
const validateProvider = (fullName, email, phoneNumber) => {
    if (!fullName || fullName.length < 3) {
        return { valid: false, message: "Tên phải có ít nhất 3 ký tự" };
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email || !emailRegex.test(email)) {
        return { valid: false, message: "Email không hợp lệ" };
    }

    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneNumber || !phoneRegex.test(phoneNumber)) {
        return { valid: false, message: "Số điện thoại phải có 10-11 chữ số" };
    }

    return { valid: true };
};

// Export các hàm
module.exports = {
    getAllProviders,
    getProviderById,
    createProvider,
    updateProvider,
    deleteProvider,
    searchProviderByPhone,
};