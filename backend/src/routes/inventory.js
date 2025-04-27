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
const mongoose = require("mongoose");

// 🚀 Routes cho Inventory (Quản lý kho)
// Route tĩnh - Không cần xác thực
router.get("/", async (req, res) => {
    console.log("Yêu cầu đến route /inventory");
    try {
        // Kiểm tra kết nối MongoDB trước
        const db = mongoose.connection;
        if (db.readyState !== 1) {
            console.error("MongoDB connection is not ready");
            return res.status(500).json({ 
                status: "Error",
                message: "Không thể kết nối đến cơ sở dữ liệu" 
            });
        }

        // Lấy dữ liệu với Promise.all để xử lý song song
        const [typeProducts, providers, inventories] = await Promise.all([
            TypeProduct.find().populate("variants").lean(),
            Provider.find().lean(),
            Inventory.find()
                .populate("typeProduct_id")
                .populate("provider_id")
                .lean()
        ]);
            
        res.render("dashboard/inventory", {
            title: "Quản lý nhập kho",
            page: "inventory",
            typeProducts,
            providers,
            inventories,
            admin: {
                fullName: req.user?.fullName || 'Admin',
                avatar: req.user?.avatar || null
            },
            user: {
                fullName: req.user?.fullName || 'Admin',
                avatar: req.user?.avatar || null
            }
        });
    } catch (error) {
        console.error("Error loading inventory page:", error);
        // Kiểm tra loại lỗi
        if (error.name === 'MongoError' || error.name === 'MongoServerError') {
            return res.status(500).json({ 
                status: "Error",
                message: "Lỗi kết nối cơ sở dữ liệu. Vui lòng thử lại sau." 
            });
        } else if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                status: "Error",
                message: "Dữ liệu không hợp lệ" 
            });
        } else {
            return res.status(500).json({ 
                status: "Error",
                message: "Lỗi khi tải trang quản lý kho" 
            });
        }
    }
});

// Route lấy danh sách sản phẩm trong kho (JSON) - Không cần xác thực
router.get("/json", InventoryController.getInventoryList);

// API endpoint cho mobile app - Lấy sản phẩm có sẵn
router.get("/available", async (req, res) => {
    try {
        console.log("=== Bắt đầu lấy danh sách kho có sẵn cho API ===");

        // Lấy danh sách sản phẩm từ database với status="available"
        const inventories = await Inventory.find({ status: "available" })
            .populate({ path: "typeProduct_id", select: "name" })
            .populate({ path: "provider_id", select: "fullName" })
            .sort({ createdAt: -1 })
            .lean();

        console.log(`Tìm thấy ${inventories.length} sản phẩm có sẵn`);

        return res.json({
            success: true,
            data: inventories
        });
    } catch (error) {
        console.error("Lỗi khi lấy danh sách kho có sẵn:", error);
        res.status(500).json({
            success: false,
            message: `Lỗi server: ${error.message}`,
        });
    }
});

// Route lấy danh sách tất cả sản phẩm duy nhất để nhập lô hàng mới
router.get("/products-for-batch", InventoryController.getProductsForBatch);

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

// Route lấy danh sách sản phẩm theo lô hàng - Không cần xác thực
router.get("/batch/:batch_number", InventoryController.getInventoryByBatch);

// Route nhập lô hàng mới
router.post("/batch-import", InventoryController.importInventory);

// Route nhập lô hàng tiếp theo
router.post("/next-batch", async (req, res) => {
    try {
        const { batchInfo, products } = req.body;

        // Kiểm tra dữ liệu đầu vào
        if (!batchInfo || !batchInfo.batch_number || !batchInfo.import_date ||
            !products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({
                status: "Error",
                message: "Thiếu thông tin lô hàng hoặc sản phẩm",
                errors: [],
                results: []
            });
        }

        const results = [];
        const errors = [];

        // Xử lý từng sản phẩm trong lô hàng
        for (const product of products) {
            try {
                // Kiểm tra dữ liệu đầu vào
                if (!product.product_id) {
                    errors.push(`Thiếu product_id`);
                    continue;
                }
                if (!Number.isFinite(product.price) || product.price < 0) {
                    errors.push(`Giá không hợp lệ cho sản phẩm ${product.product_id}`);
                    continue;
                }
                if (!Number.isFinite(product.quantity) || product.quantity < 1) {
                    errors.push(`Số lượng không hợp lệ cho sản phẩm ${product.product_id}`);
                    continue;
                }

                // Tìm sản phẩm hiện có
                const existingProduct = await Inventory.findById(product.product_id);
                if (!existingProduct) {
                    errors.push(`Không tìm thấy sản phẩm với ID: ${product.product_id}`);
                    continue;
                }

                // Nếu sản phẩm có biến thể
                if (existingProduct.hasVariants) {
                    if (!product.variantData || !Number.isFinite(product.variantData.index) || product.variantData.index < 0) {
                        errors.push(`Dữ liệu biến thể không hợp lệ cho sản phẩm: ${existingProduct.product_name}`);
                        continue;
                    }

                    // Cập nhật thông tin cho biến thể được chọn
                    const variant = existingProduct.variantDetails[product.variantData.index];
                    if (!variant) {
                        errors.push(`Biến thể không hợp lệ cho sản phẩm: ${existingProduct.product_name}`);
                        continue;
                    }

                    // Kiểm tra attributes của biến thể
                    if (!product.variantData.attributes || typeof product.variantData.attributes !== 'object') {
                        errors.push(`Thuộc tính biến thể không hợp lệ cho sản phẩm: ${existingProduct.product_name}`);
                        continue;
                    }
                    const variantAttributes = Object.fromEntries(variant.attributes);
                    const inputAttributes = product.variantData.attributes;
                    if (Object.keys(variantAttributes).length !== Object.keys(inputAttributes).length ||
                        !Object.keys(variantAttributes).every(key => variantAttributes[key] === inputAttributes[key])) {
                        errors.push(`Thuộc tính biến thể không khớp cho sản phẩm: ${existingProduct.product_name}`);
                        continue;
                    }

                    // Cập nhật số lượng và giá cho biến thể
                    variant.quantity = (variant.quantity || 0) + product.quantity;
                    variant.price = product.price; // Giá nhập mới nhất

                    // Cập nhật tổng số lượng và tổng giá cho sản phẩm
                    existingProduct.total_quantity = existingProduct.variantDetails.reduce((sum, v) => sum + (v.quantity || 0), 0);
                    const totalValue = existingProduct.variantDetails.reduce((sum, v) => sum + (v.price * (v.quantity || 0)), 0);
                    existingProduct.total_price = existingProduct.total_quantity > 0 ? totalValue / existingProduct.total_quantity : 0;
                } else {
                    // Cập nhật cho sản phẩm không có biến thể
                    const oldTotalValue = (existingProduct.total_price || 0) * (existingProduct.total_quantity || 0);
                    const newTotalValue = product.price * product.quantity;
                    const totalQuantity = (existingProduct.total_quantity || 0) + product.quantity;
                    const averagePrice = totalQuantity > 0 ? (oldTotalValue + newTotalValue) / totalQuantity : product.price;

                    existingProduct.total_quantity = totalQuantity;
                    existingProduct.total_price = averagePrice;
                }

                // Thêm thông tin lô hàng mới
                existingProduct.batch_info.push({
                    batch_number: batchInfo.batch_number,
                    batch_date: new Date(batchInfo.import_date),
                    quantity: product.quantity,
                    price: product.price,
                    note: batchInfo.note || ''
                });

                // Cập nhật trạng thái
                existingProduct.status = existingProduct.total_quantity > 0 ? 'available' : 'unavailable';

                // Lưu thay đổi
                await existingProduct.save();
                results.push({
                    product_name: existingProduct.product_name,
                    status: "Success"
                });
            } catch (error) {
                console.error(`Lỗi khi cập nhật sản phẩm ${product.product_id}:`, error);
                errors.push(`Lỗi khi cập nhật sản phẩm ${product.product_id}: ${error.message}`);
            }
        }

        // Trả về kết quả
        if (errors.length > 0) {
            return res.status(400).json({
                status: "Error",
                message: "Có lỗi xảy ra khi nhập lô hàng",
                errors,
                results
            });
        }

        res.status(200).json({
            status: "Ok",
            message: "Nhập lô hàng thành công",
            data: results
        });
    } catch (error) {
        console.error("Lỗi khi nhập lô hàng:", error);
        res.status(500).json({
            status: "Error",
            message: "Lỗi khi nhập lô hàng: " + error.message,
            errors: [error.message],
            results: []
        });
    }
});

// Route thêm sản phẩm mới vào kho - Không yêu cầu xác thực để dễ test
router.post("/create", InventoryController.importInventory);

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