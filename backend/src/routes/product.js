const express = require("express");
const router = express.Router();
const productController = require("../../src/controllers/ProductController");
const variantController = require("../controllers/VariantController");
const { protect } = require("../middleware/auth");

// Lấy danh sách sản phẩm
router.get("/", protect, productController.getProduct);
router.get("/json/", productController.getProduct);

// Thêm sản phẩm
router.post("/create", productController.addProduct);

// Cập nhật sản phẩm
router.put("/update/:productId", productController.updateProduct);

// Xóa sản phẩm
router.delete("/delete/:productId", productController.deleteProduct);

router.get("/getbienthejson/", variantController.getVariantsAsJson); // Lấy danh sách biến thể
router.get("/getbienthe/", variantController.getVariants); // Lấy danh sách biến thể
router.post("/getbienthe/create", variantController.addVariant); // Thêm biến thể
router.delete("/getbienthe/delete/:variantId", variantController.deleteVariant); // Xóa biến thể

module.exports = router;
