const express = require("express");
const router = express.Router();
const typeController = require("../controllers/TypeProductController");
const { protect } = require("../middleware/auth");

// 🚀 Routes cho TypeProduct (Loại sản phẩm)
router.get("/", protect, typeController.getTypes);
router.get("/json", typeController.getTypesAsJson);
router.post("/create", typeController.addType);
router.put("/update/:typeId", typeController.updateType);
router.delete("/delete/:typeId", typeController.deleteType);

module.exports = router;