const Supplier = require("../models/Supplier");

// 📌 Lấy danh sách nhà cung cấp
const getAllSuppliers = async () => {
    return await Supplier.find();
};

// 📌 Tạo nhà cung cấp mới
const createSupplier = async (data) => {
    return await Supplier.create(data);
};

// 📌 Cập nhật nhà cung cấp
// const updateSupplier = async (id, data) => {
//     return await Supplier.findByIdAndUpdate(id, data, { new: true });
// };
const updateSupplier = async (id, data) => {
    return await Supplier.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

// 📌 Xóa nhà cung cấp
const deleteSupplier = async (id) => {
    return await Supplier.findByIdAndDelete(id);
};

// 📌 Lấy nhà cung cấp theo ID
const getSupplierById = async (id) => {
    return await Supplier.findById(id);
};

module.exports = {
    getAllSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    getSupplierById
};
