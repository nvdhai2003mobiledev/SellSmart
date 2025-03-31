const express = require("express");
const router = express.Router();
const productController = require("../controllers/ProductController");
const variantController = require("../controllers/VariantController");
const detailsVariantController = require("../controllers/DetailsVariantController");
const { protect } = require("../middleware/auth");

// 🚀 Routes cho Product (Sản phẩm)
// Route tĩnh
router.get("/", protect, productController.getProduct); // Lấy danh sách sản phẩm (view)
router.get("/json", productController.getProductAsJson); // Lấy danh sách sản phẩm (JSON) - đã bỏ protect
router.post("/create", protect, productController.addProduct); // Tạo sản phẩm mới
router.put("/update/:productId", protect, productController.updateProduct); // Cập nhật sản phẩm
router.delete("/delete/:productId", protect, productController.deleteProduct); // Xóa sản phẩm

// 🚀 Routes cho Variant (Biến thể)
router.get("/variants", protect, productController.getVariantsPage); // Trang biến thể (view)
router.get("/variants/json", protect, variantController.getVariantsAsJson); // Lấy danh sách biến thể (JSON)
router.post("/variants/create", protect, variantController.addVariant); // Tạo biến thể mới
router.put("/variants/update/:variantId", protect, variantController.updateVariant); // Cập nhật biến thể
router.delete("/variants/delete/:variantId", protect, variantController.deleteVariant); // Xóa biến thể

// 🚀 Routes cho DetailsVariant (Chi tiết biến thể)
router.get("/details-variants", protect, detailsVariantController.getAllDetailsVariants); // Lấy tất cả chi tiết biến thể
router.get("/details-variants/:productId", protect, detailsVariantController.getDetailsByProduct); // Lấy chi tiết biến thể theo productId
router.post("/details-variants/create", protect, detailsVariantController.addDetailsVariant); // Tạo chi tiết biến thể mới
router.delete("/details-variants/delete/:detailsVariantId", protect, detailsVariantController.deleteDetailsVariant); // Xóa chi tiết biến thể

// Route động (đặt sau các route tĩnh)
router.get("/:productId", protect, productController.getProductById); // Lấy sản phẩm theo ID

module.exports = router;