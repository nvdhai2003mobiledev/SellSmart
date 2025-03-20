const express = require("express");
const router = express.Router();
const productController = require("../controllers/ProductController");
const variantController = require("../controllers/VariantController");
const detailsVariantController = require("../controllers/DetailsVariantController");
const { protect } = require("../middleware/auth");

// 🚀 Routes cho Product (Sản phẩm)
router.get("/", protect, productController.getProduct);
router.get("/json/", productController.getProductAsJson);
router.post("/create", productController.addProduct);
router.put("/update/:productId", productController.updateProduct);
router.delete("/delete/:productId", productController.deleteProduct);
// router.post("/:productId/variants", productController.addProductVariant);
// router.put(
//   "/variants/details/:detailId",
//   productController.updateVariantDetail,
// );

// 🚀 Routes cho Variant (Biến thể)
router.get("/getbienthejson", variantController.getVariantsAsJson);
router.get("/getbienthe", variantController.getVariants);
router.post("/getbienthe/create", variantController.addVariant);
router.delete("/getbienthe/delete/:variantId", variantController.deleteVariant);

// 🚀 Routes cho DetailsVariant (Chi tiết biến thể)
router.get(
  "/getdetailsvariant",
  detailsVariantController.getAllDetailsVariants,
); // Lấy tất cả DetailsVariant
// router.get(
//   "/getdetailsvariant/:variantId",
//   detailsVariantController.getDetailsByVariant,
// ); // Lấy theo variantId
router.post(
  "/getdetailsvariant/create",
  detailsVariantController.addDetailsVariant,
); // Thêm mới
router.delete(
  "/getdetailsvariant/delete/:detailsVariantId",
  detailsVariantController.deleteDetailsVariant,
); // Xóa

// Lưu ý: Route có tham số động (:productId) phải đặt cuối cùng để tránh xung đột
router.get("/:productId", productController.getProductById);

module.exports = router;
