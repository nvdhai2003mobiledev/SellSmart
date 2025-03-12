const SupplierService = require("../services/SupplierService")
const Supplier = require('../models/Supplier');

// 📌 Lấy danh sách nhà cung cấp
exports.getAllSuppliers = async (req, res) => {
    try {
        const suppliers = await SupplierService.getAllSuppliers();
        res.render("supplier", { suppliers });
    } catch (error) {
        console.error("❌ Lỗi lấy danh sách nhà cung cấp:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.createSupplier = async (req, res) => {
    try {
        const supplier = await SupplierService.createSupplier(req.body);
        
        console.log("✅ Thêm nhà cung cấp thành công:", supplier); // Log khi thêm thành công

        res.status(201).json(supplier);
    } catch (error) {
        console.error("❌ Lỗi khi thêm nhà cung cấp:", error);
        res.status(400).json({ message: error.message });
    }
};
// SupplierController.js - Phương thức cập nhật mới
exports.updateSupplier = async (req, res) => {
    try {
        const supplierId = req.params.id;
        const updateData = req.body;

        console.log(`🔄 Yêu cầu cập nhật nhà cung cấp ID: ${supplierId}`);
        console.log("📝 Dữ liệu cập nhật nhận được:", updateData);

        // Kiểm tra dữ liệu đầu vào
        if (!updateData || Object.keys(updateData).length === 0) {
            console.log("⚠️ Dữ liệu cập nhật trống");
            return res.status(400).json({ 
                success: false, 
                message: "Không có dữ liệu để cập nhật!" 
            });
        }

        // Cập nhật dữ liệu
        const updatedSupplier = await Supplier.findByIdAndUpdate(
            supplierId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedSupplier) {
            console.log("❌ Không tìm thấy nhà cung cấp hoặc cập nhật thất bại");
            return res.status(404).json({ 
                success: false, 
                message: "Không tìm thấy nhà cung cấp hoặc không thể cập nhật!" 
            });
        }

        console.log("✅ Cập nhật thành công:", updatedSupplier);
        return res.status(200).json({ 
            success: true, 
            message: "Cập nhật nhà cung cấp thành công!",
            data: updatedSupplier 
        });

    } catch (error) {
        console.error("❌ Lỗi khi cập nhật nhà cung cấp:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Lỗi server khi cập nhật nhà cung cấp", 
            error: error.message 
        });
    }
};

// 📌 Xóa nhà cung cấp
exports.deleteSupplier = async (req, res) => {
    try {
        const deletedSupplier = await SupplierService.deleteSupplier(req.params.id);
        if (!deletedSupplier) {
            return res.status(404).json({ message: "Không tìm thấy nhà cung cấp" });
        }
        res.json({ message: "Xóa thành công!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 📌 Lấy nhà cung cấp theo ID
exports.getSupplierById = async (req, res) => {
    try {
        const supplier = await SupplierService.getSupplierById(req.params.id);
        if (!supplier) return res.status(404).json({ message: "Không tìm thấy nhà cung cấp" });
        res.json(supplier);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
