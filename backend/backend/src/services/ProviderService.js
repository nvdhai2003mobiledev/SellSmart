const Provider = require("../models/Provider");

// 📌 Lấy danh sách tất cả nhà cung cấp
const getAllProviders = async () => {
    return await Provider.find();
};

// 📌 Lấy nhà cung cấp theo ID
const getProviderById = async (id) => {
    return await Provider.findById(id);
};

// 📌 Tạo nhà cung cấp mới
const createProvider = async (data) => {
    return await Provider.create(data);
};

// 📌 Cập nhật thông tin nhà cung cấp theo ID
const updateProvider = async (id, data) => {
    return await Provider.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

// 📌 Xóa nhà cung cấp theo ID
const deleteProvider = async (id) => {
    return await Provider.findByIdAndDelete(id);
};

module.exports = {
    getAllProviders,
    getProviderById,
    createProvider,
    updateProvider,
    deleteProvider
};
