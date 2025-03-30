const express = require("express");
const router = express.Router();
const typeController = require("../controllers/TypeProductController");
const { protect } = require("../middleware/auth");

// 🚀 Routes cho TypeProduct (Loại sản phẩm)
router.get("/", protect, typeController.getTypes); // Lấy danh sách loại sản phẩm (view)
router.get("/json", protect, typeController.getTypesAsJson); // Lấy danh sách loại sản phẩm (JSON)
router.post("/create", protect, typeController.addType); // Tạo loại sản phẩm mới
router.put("/update/:typeId", protect, typeController.updateType); // Cập nhật loại sản phẩm
router.delete("/delete/:typeId", protect, typeController.deleteType); // Xóa loại sản phẩm

module.exports = router;