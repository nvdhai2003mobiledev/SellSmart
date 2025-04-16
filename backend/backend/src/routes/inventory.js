const express = require("express");
const router = express.Router();
const InventoryController = require("../controllers/InventoryController");
const TypeProductController = require("../controllers/TypeProductController");
const VariantController = require("../controllers/VariantController");
const ProviderController = require("../controllers/ProviderController");
const DetailsVariantController = require("../controllers/DetailsVariantController");
const TypeProduct = require("../models/TypeProduct");
const Inventory = require("../models/Inventory");
const Provider = require("../models/Provider");
const { protect } = require("../middleware/auth");

// 🚀 Routes cho Inventory (Quản lý kho)
// Route tĩnh - Không cần xác thực
// Route tĩnh - Không cần xác thực
router.get("/", async (req, res) => {
    console.log("Yêu cầu đến route /inventory"); // Thêm log để kiểm tra
    try {
        const typeProducts = await TypeProduct.find().populate("variants");
        const providers = await Provider.find();
        const inventories = await Inventory.find()
            .populate("typeProduct_id")
            .populate("provider_id");
            
        res.render("dashboard/inventory", {
            title: "Quản lý nhập kho",
            page: "inventory",
            typeProducts,
            providers,
            inventories,
            admin: req.session.admin
        });
    } catch (error) {
        console.error("Error loading inventory page:", error);
        res.status(500).json({ message: "Lỗi khi tải trang quản lý kho" });
    }
});

// Route lấy danh sách sản phẩm trong kho (JSON) - Không cần xác thực
router.get("/json", InventoryController.getInventoryList);

// Route lấy mã sản phẩm cuối cùng - Không cần xác thực
router.get("/last-code", async (req, res) => {
    try {
        const lastInventory = await Inventory.findOne().sort({ product_code: -1 });
        res.json({
            status: 'Ok',
            data: lastInventory ? lastInventory.product_code : null
        });
    } catch (error) {
        console.error('Error getting last product code:', error);
        res.status(500).json({
            status: 'Error',
            message: 'Lỗi khi lấy mã sản phẩm cuối cùng'
        });
    }
});

// Route thêm sản phẩm mới vào kho - Yêu cầu xác thực
router.post("/create", protect, InventoryController.importInventory);

// Route cập nhật sản phẩm trong kho - Yêu cầu xác thực
router.put("/update/:id", protect, InventoryController.updateInventory);

// Route xóa sản phẩm khỏi kho - Yêu cầu xác thực
router.delete("/delete/:id", protect, InventoryController.deleteInventory);

// 🚀 Routes cho TypeProduct (Danh mục sản phẩm) - Không cần xác thực
router.get("/typeproduct/json", TypeProductController.getTypesAsJson);

// 🚀 Routes cho Variant (Biến thể) - Không cần xác thực
router.get("/variants/json", VariantController.getVariantsAsJson);
router.get("/typeproduct/:id/variants", VariantController.getVariantsAsJson);

// 🚀 Routes cho DetailsVariant (Chi tiết biến thể) - Không cần xác thực
router.get("/variant/:id/details", DetailsVariantController.getDetailsByProduct);

// Route động (đặt sau các route tĩnh) - Không cần xác thực
router.get("/:id", InventoryController.getInventoryDetail);

module.exports = router;
