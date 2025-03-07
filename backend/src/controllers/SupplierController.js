const Supplier = require('../models/Supplier');

// Lấy danh sách nhà cung cấp
exports.getAllSuppliers = async (req, res) => {
    try {
        const suppliers = await Supplier.find();
        console.log('Suppliers:', suppliers);
        res.json(suppliers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Thêm nhà cung cấp mới
exports.createSupplier = async (req, res) => {
    try {
        const supplier = new Supplier(req.body);
        await supplier.save();
        res.status(201).json(supplier);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Xóa nhà cung cấp
exports.deleteSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findByIdAndDelete(req.params.id);
        if (!supplier) return res.status(404).json({ message: "Không tìm thấy nhà cung cấp" });
        res.json({ message: "Xóa thành công!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Tìm nhà cung cấp theo ID
exports.getSupplierById = async (req, res) => {
    try {
        const supplier = await Supplier.findById(req.params.id);
        if (!supplier) return res.status(404).json({ message: "Không tìm thấy nhà cung cấp" });
        res.json(supplier);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Cập nhật thông tin nhà cung cấp
exports.updateSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedSupplier = await Supplier.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });

        if (!updatedSupplier) {
            return res.status(404).json({ message: "Không tìm thấy nhà cung cấp" });
        }

        res.json(updatedSupplier);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};


