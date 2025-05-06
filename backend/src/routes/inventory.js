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

// Route lấy danh sách mã lô hàng gần đây để gợi ý tìm kiếm
router.get("/recent-batch-numbers", InventoryController.getRecentBatchNumbers);

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

// Route cập nhật sản phẩm trong kho - Không yêu cầu xác thực để dễ test
router.put("/update/:id", async (req, res) => {
    try {
        const inventoryId = req.params.id;
        const updateData = req.body;
        
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(inventoryId)) {
            return res.status(400).json({
                status: "Error",
                message: "ID sản phẩm không hợp lệ"
            });
        }
        
        // Tìm sản phẩm cần cập nhật
        const existingInventory = await Inventory.findById(inventoryId);
        if (!existingInventory) {
            return res.status(404).json({
                status: "Error",
                message: "Không tìm thấy sản phẩm"
            });
        }
        
        // Kiểm tra xem sản phẩm đã được xuất bản chưa
        const Product = mongoose.model('Product');
        const publishedProduct = await Product.findOne({ inventoryId: inventoryId });
        if (publishedProduct) {
            return res.status(400).json({
                status: "Error",
                message: "Sản phẩm này đã được phát hành, không thể chỉnh sửa"
            });
        }
        
        // Cập nhật thông tin cơ bản
        existingInventory.product_name = updateData.product_name;
        existingInventory.product_code = updateData.product_code;
        // Giữ nguyên trạng thái hiện tại nếu không được cung cấp
        if (updateData.status) {
            // Đảm bảo status hợp lệ theo model
            if (updateData.status === 'Còn hàng' || updateData.status === 'Sắp hết') {
                existingInventory.status = 'available';
            } else if (updateData.status === 'Hết hàng' || updateData.status === 'Ngừng kinh doanh') {
                existingInventory.status = 'unavailable';
            }
            // Trường hợp status đã là giá trị hợp lệ ('available' hoặc 'unavailable')
            else if (updateData.status === 'available' || updateData.status === 'unavailable') {
                existingInventory.status = updateData.status;
            }
            // Nếu không phải các trường hợp trên, giữ nguyên status
        }
        existingInventory.note = updateData.note || '';
        existingInventory.product_description = updateData.product_description || '';
        
        if (updateData.typeProduct_id) {
            existingInventory.typeProduct_id = updateData.typeProduct_id;
        }
        
        if (updateData.provider_id) {
            existingInventory.provider_id = updateData.provider_id;
        }
        
        if (updateData.unit) {
            existingInventory.unit = updateData.unit;
        }
        
        // Cập nhật biến thể nếu có
        if (updateData.hasVariants && Array.isArray(updateData.variantDetails) && updateData.variantDetails.length > 0) {
            existingInventory.hasVariants = true;
            existingInventory.variantDetails = updateData.variantDetails;
            
            // Tính tổng số lượng và giá trung bình
            const totalQuantity = updateData.variantDetails.reduce((sum, v) => sum + (v.quantity || 0), 0);
            existingInventory.quantity = totalQuantity;
            
            // Tính giá trung bình có trọng số
            const totalValue = updateData.variantDetails.reduce((sum, v) => sum + (v.price || 0) * (v.quantity || 0), 0);
            if (totalQuantity > 0) {
                existingInventory.price = totalValue / totalQuantity;
            }
        } else {
            // Sản phẩm không có biến thể
            existingInventory.hasVariants = false;
            existingInventory.variantDetails = [];
            existingInventory.quantity = updateData.quantity || 0;
            existingInventory.price = updateData.price || 0;
        }
        
        // Lưu lại sản phẩm đã cập nhật
        await existingInventory.save();
        
        return res.json({
            status: "Ok",
            message: "Cập nhật sản phẩm thành công",
            inventory: existingInventory
        });
    } catch (error) {
        console.error("Lỗi khi cập nhật sản phẩm:", error);
        return res.status(500).json({
            status: "Error",
            message: "Lỗi server: " + error.message
        });
    }
});

// Route xóa sản phẩm khỏi kho - Yêu cầu xác thực
router.delete("/delete/:id", protect, InventoryController.deleteInventory);

// 🚀 Routes cho TypeProduct (Danh mục sản phẩm) - Không cần xác thực
router.get("/typeproduct/json", TypeProductController.getTypesAsJson);

// 🚀 Routes cho Variant (Biến thể) - Không cần xác thực
router.get("/variants/json", VariantController.getVariantsAsJson);
router.get("/typeproduct/:id/variants", VariantController.getVariantsAsJson);

// 🚀 Routes cho DetailsVariant (Chi tiết biến thể) - Không cần xác thực
router.get("/variant/:id/details", DetailsVariantController.getDetailsByProduct);

// Route chi tiết sản phẩm trong kho
router.get("/:id", InventoryController.getInventoryDetail);

// Route kiểm tra xem sản phẩm đã được phát hành chưa
router.get("/check-published/:id", async (req, res) => {
    try {
        const inventoryId = req.params.id;
        
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(inventoryId)) {
            return res.status(400).json({
                status: "Error",
                message: "ID sản phẩm không hợp lệ",
                isPublished: false
            });
        }
        
        // Tìm trong bảng Product xem có sản phẩm nào tham chiếu đến inventoryId này không
        const Product = mongoose.model('Product');
        const publishedProduct = await Product.findOne({ inventoryId: inventoryId });
        
        return res.json({
            status: "Ok",
            isPublished: !!publishedProduct,
            productId: publishedProduct?._id || null
        });
    } catch (error) {
        console.error("Lỗi khi kiểm tra trạng thái xuất bản:", error);
        res.status(500).json({
            status: "Error",
            message: "Lỗi server: " + error.message,
            isPublished: false
        });
    }
});

module.exports = router;