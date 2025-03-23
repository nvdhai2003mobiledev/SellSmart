const express = require("express");
const router = express.Router();
const productController = require("../controllers/ProductController");
const variantController = require("../controllers/VariantController");
const detailsVariantController = require("../controllers/DetailsVariantController");
const { protect } = require("../middleware/auth");

// 🚀 Routes cho Product (Sản phẩm)
// Route tĩnh
router.get("/", protect, productController.getProduct);
router.get("/json", productController.getProductAsJson);
router.get("/getbienthe", productController.getVariantsPage);
router.post("/create", productController.addProduct);
router.put("/update/:productId", productController.updateProduct);
router.delete("/delete/:productId", productController.deleteProduct);

// Route động (đặt sau các route tĩnh)
router.get("/:productId", productController.getProductById);

// 🚀 Routes cho Variant (Biến thể)
router.get("/getbienthejson", variantController.getVariantsAsJson);
router.post("/getbienthe/create", variantController.addVariant);
router.put("/getbienthe/update/:variantId", variantController.updateVariant);
router.delete("/getbienthe/delete/:variantId", variantController.deleteVariant);

// 🚀 Routes cho DetailsVariant (Chi tiết biến thể)
router.get("/getdetailsvariant", detailsVariantController.getAllDetailsVariants);
router.get("/getdetailsvariant/:productId", detailsVariantController.getDetailsByProduct);
router.post("/getdetailsvariant/create", detailsVariantController.addDetailsVariant);
router.delete("/getdetailsvariant/delete/:detailsVariantId", detailsVariantController.deleteDetailsVariant);

module.exports = router;