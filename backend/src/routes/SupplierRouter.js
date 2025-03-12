const express = require("express");
const router = express.Router();
const SupplierController = require("../controllers/SupplierController");

// 📌 Lấy danh sách nhà cung cấp
router.get("/", SupplierController.getAllSuppliers);

// 📌 Tạo nhà cung cấp mới (Thêm)
router.post("/create", SupplierController.createSupplier);

// 📌 Xóa nhà cung cấp
router.delete("/delete/:id", SupplierController.deleteSupplier); 

// 📌 Lấy thông tin nhà cung cấp theo ID
router.get("/:id", SupplierController.getSupplierById);

// 📌 Cập nhật nhà cung cấp
router.put("/update/:id", SupplierController.updateSupplier);

module.exports = router;
