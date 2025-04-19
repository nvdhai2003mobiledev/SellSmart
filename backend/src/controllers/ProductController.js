const Product = require("../models/Product");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Variant = require("../models/Variant");
const DetailsVariant = require("../models/DetailsVariant");
const TypeProduct = require("../models/TypeProduct");
const Warranty = require("../models/Warranty");
const Order = require("../models/Order");
const Customer = require("../models/Customer");
const Employee = require("../models/Employee");
const Inventory = require("../models/Inventory");

// Lấy danh sách sản phẩm
const getProduct = async (req, res) => {
    try {
        console.log("Bắt đầu lấy danh sách sản phẩm", {
            path: req.path,
            acceptHeader: req.headers.accept,
        });
        
        // Lấy danh sách sản phẩm từ Product model, không phải từ Inventory
        let products = await Product.find()
            .populate("category")
            .populate("providerId")
            .populate("inventoryId")
            .lean();
            
        console.log(`Tìm thấy ${products.length} sản phẩm đã phát hành`);
        
        // Lọc sản phẩm có giá và tồn kho
        const productsWithPriceAndInventory = products.filter(product => {
            // Kiểm tra sản phẩm có biến thể
            if (product.hasVariants && product.variantDetails && product.variantDetails.length > 0) {
                // Kiểm tra biến thể có giá và số lượng
                return product.variantDetails.some(variant => 
                    variant.price > 0 && variant.quantity > 0
                );
            } else {
                // Kiểm tra sản phẩm không có biến thể có giá và số lượng
                return product.price > 0 && product.inventory > 0;
            }
        });
        
        // Lọc sản phẩm không có giá và tồn kho
        const productsWithoutPriceOrInventory = products.filter(product => {
            if (product.hasVariants && product.variantDetails && product.variantDetails.length > 0) {
                return !product.variantDetails.some(variant => 
                    variant.price > 0 && variant.quantity > 0
                );
            } else {
                return !(product.price > 0 && product.inventory > 0);
            }
        });
        
        console.log(`Sản phẩm có giá và tồn kho: ${productsWithPriceAndInventory.length}`);
        console.log(`Sản phẩm không có giá hoặc tồn kho: ${productsWithoutPriceOrInventory.length}`);
        
        // Lấy thông tin bảo hành cho mỗi sản phẩm
        for (let product of productsWithPriceAndInventory) {
            const warranty = await Warranty.findOne({ product: product._id })
                .sort({ createdAt: -1 })
                .lean();
            if (warranty) {
                product.warrantyPeriod = warranty.warrantyPeriod;
            }
        }

        // Lấy danh sách nhà cung cấp và danh mục cho form thêm sản phẩm
        const providers = await mongoose.model('Provider').find().lean();
        const categories = await TypeProduct.find().lean();
        
        // Lấy danh sách sản phẩm trong kho để hiển thị trong dropdown
        const inventoryItems = await Inventory.find()
            .populate("typeProduct_id")
            .populate("provider_id")
            .lean();

        console.log(`Đã xử lý ${productsWithPriceAndInventory.length} sản phẩm có giá và tồn kho`);

        if (req.path.includes("/json") || req.headers.accept === "application/json") {
            console.log("Trả về danh sách sản phẩm dạng JSON");
            return res.json({ 
                status: "Ok", 
                data: {
                    productsWithPriceAndInventory,
                    productsWithoutPriceOrInventory
                }
            });
        }

        console.log("Render trang dashboard/products");
        res.render("dashboard/products", {
            products: productsWithPriceAndInventory,
            hiddenProducts: productsWithoutPriceOrInventory,
            providers,
            categories,
            inventoryItems,
            page: "products",
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
        console.error("Lỗi khi lấy danh sách sản phẩm:", {
            path: req.path,
            acceptHeader: req.headers.accept,
            errorMessage: error.message,
            stack: error.stack,
        });
        res.status(500).json({
            status: "Error",
            message: "Lỗi khi lấy danh sách sản phẩm: " + error.message,
        });
    }
};

// API JSON
const getProductAsJson = async (req, res) => {
    try {
        console.log("Bắt đầu lấy danh sách sản phẩm dạng JSON", {
            method: req.method,
            url: req.originalUrl,
            headers: req.headers,
        });

        // Lấy danh sách sản phẩm từ Inventory
        const inventoryItems = await Inventory.find()
            .populate("typeProduct_id")
            .populate("provider_id")
            .lean();
            
        // Chuyển đổi dữ liệu từ Inventory sang định dạng Product
        const products = inventoryItems.map(item => {
            return {
                _id: item._id,
                name: item.product_name,
                product_code: item.product_code,
                category: item.typeProduct_id,
                providerId: item.provider_id,
                status: item.status,
                hasVariants: item.hasVariants,
                price: item.hasVariants ? 
                    (item.variantDetails && item.variantDetails.length > 0 ? 
                        item.variantDetails.reduce((min, v) => Math.min(min, v.price), Infinity) : 0) : 
                    item.total_price / (item.total_quantity || 1),
                inventory: item.total_quantity,
                inventoryId: item._id,
                variantDetails: item.variantDetails
            };
        });

        console.log(`Đã xử lý xong ${products.length} sản phẩm, trả về response`);
        res.status(200).json({
            status: "Ok",
            data: products,
        });
    } catch (error) {
        console.error("Lỗi khi lấy danh sách sản phẩm dạng JSON:", {
            errorMessage: error.message,
            stack: error.stack,
        });
        res.status(500).json({
            status: "Error",
            message: "Lỗi khi lấy danh sách sản phẩm dạng JSON: " + error.message,
        });
    }
};

// Lấy sản phẩm theo ID
const getProductById = async (req, res) => {
  const { productId } = req.params;
  console.log("Bắt đầu lấy sản phẩm theo ID", { productId });
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({
      status: "Error",
      message: "ID sản phẩm không hợp lệ",
    });
  }

  try {
    // Tìm sản phẩm từ Inventory
    const inventoryItem = await Inventory.findById(productId)
      .populate("typeProduct_id")
      .populate("provider_id")
      .lean();

    if (!inventoryItem) {
      console.log("Không tìm thấy sản phẩm với ID:", productId);
      return res.status(404).json({
        status: "Error",
        message: "Không tìm thấy sản phẩm với ID: " + productId,
      });
    }

    // Chuyển đổi dữ liệu từ Inventory sang định dạng Product
    const product = {
        _id: inventoryItem._id,
        name: inventoryItem.product_name,
        product_code: inventoryItem.product_code,
        category: inventoryItem.typeProduct_id,
        providerId: inventoryItem.provider_id,
        status: inventoryItem.status,
        hasVariants: inventoryItem.hasVariants,
        price: inventoryItem.hasVariants ? 
            (inventoryItem.variantDetails && inventoryItem.variantDetails.length > 0 ? 
                inventoryItem.variantDetails.reduce((min, v) => Math.min(min, v.price), Infinity) : 0) : 
            inventoryItem.total_price / (inventoryItem.total_quantity || 1),
        inventory: inventoryItem.total_quantity,
        inventoryId: inventoryItem._id,
        variantDetails: inventoryItem.variantDetails
    };

    // Lấy thông tin bảo hành
    const warranty = await Warranty.findOne({ product: productId })
      .sort({ createdAt: -1 })
      .lean();
    if (warranty) {
      product.warrantyPeriod = warranty.warrantyPeriod;
    }

    console.log("Đã tìm thấy sản phẩm:", product.name);
    res.status(200).json({
      status: "Ok",
      data: product,
    });
  } catch (error) {
    console.error("Lỗi khi lấy sản phẩm theo ID:", error);
    res.status(500).json({
      status: "Error",
      message: "Lỗi khi lấy sản phẩm theo ID: " + error.message,
    });
  }
};

// Thêm hàm xử lý route /products/variants
const getVariantsPage = async (req, res) => {
  const { typeProductId } = req.query; // Dùng query, không dùng params
  console.log("Bắt đầu lấy trang biến thể", { typeProductId });
  if (!typeProductId || !mongoose.Types.ObjectId.isValid(typeProductId)) {
      console.log("ID danh mục không hợp lệ", { typeProductId });
      return res.status(400).json({ status: "Error", message: "ID danh mục không hợp lệ" });
  }
  try {
      const variants = await Variant.find({ typeProductId });
      res.render('dashboard/variants', { variants, typeProductId });
  } catch (error) {
      res.status(500).json({ status: "Error", message: error.message });
  }
};

// Cấu hình multer để lưu file ảnh
const uploadDir = path.join(__dirname, "../public/images");
if (!fs.existsSync(uploadDir)) {
    console.log("Tạo thư mục uploadDir", { uploadDir });
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, uploadDir);
    },
    filename(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Thêm sản phẩm
const addProduct = async (req, res) => {
    try {
        console.log("Bắt đầu thêm sản phẩm mới", req.body);
        
        // Lấy dữ liệu từ form
        const {
            name,
            category,
            providerId,
            hasVariants,
            price,
            inventory,
            status,
            inventoryId,
            warrantyPeriod,
            variantDetails
        } = req.body;

        // Kiểm tra sản phẩm đã tồn tại
        const existingProduct = await Product.findOne({ inventoryId });
        if (existingProduct) {
            console.log("Sản phẩm đã tồn tại với inventoryId:", inventoryId);
            return res.status(400).json({
                status: "Error",
                message: "Sản phẩm này đã được phát hành trước đó",
            });
        }

        // Lấy thông tin từ kho hàng
        const inventoryItem = await Inventory.findById(inventoryId);
        if (!inventoryItem) {
            console.log("Không tìm thấy sản phẩm trong kho với ID:", inventoryId);
            return res.status(404).json({
                status: "Error",
                message: "Không tìm thấy sản phẩm trong kho",
            });
        }

        // Xử lý file ảnh
        let thumbnailPath = null;
        if (req.file) {
            thumbnailPath = `/images/${req.file.filename}`;
            console.log("Đã lưu ảnh thumbnail:", thumbnailPath);
        }

        // Tính giá gốc từ kho hàng
        let originalPrice = 0;
        if (inventoryItem.hasVariants && inventoryItem.variantDetails && inventoryItem.variantDetails.length > 0) {
            // Nếu có biến thể, lấy giá trung bình của các biến thể
            const totalPrice = inventoryItem.variantDetails.reduce((sum, variant) => sum + (variant.price || 0), 0);
            originalPrice = totalPrice / inventoryItem.variantDetails.length;
        } else {
            // Nếu không có biến thể, lấy giá trực tiếp
            originalPrice = inventoryItem.total_price / (inventoryItem.total_quantity || 1);
        }

        // Tạo sản phẩm mới
        const newProduct = new Product({
            name: inventoryItem.product_name,
            thumbnail: thumbnailPath,
            category: inventoryItem.typeProduct_id,
            providerId: inventoryItem.provider_id,
            hasVariants: inventoryItem.hasVariants,
            price: parseFloat(price) || originalPrice, // Sử dụng giá mới nếu có, nếu không thì dùng giá gốc
            original_price: originalPrice, // Lưu giá gốc từ kho hàng
            inventory: inventoryItem.total_quantity,
            inventoryId: inventoryItem._id,
            product_code: inventoryItem.product_code,
            status: status || 'available'
        });

        // Lưu sản phẩm mới
        await newProduct.save();
        console.log("Đã tạo sản phẩm mới:", newProduct);

        // Tạo bảo hành nếu có
        if (warrantyPeriod) {
            const warranty = new Warranty({
                product: newProduct._id,
                warrantyPeriod: parseInt(warrantyPeriod),
                description: `Bảo hành ${warrantyPeriod} tháng cho sản phẩm ${newProduct.name}`
            });
            await warranty.save();
            console.log("Đã tạo bảo hành:", warranty);
        }

        // Trả về kết quả
        res.status(201).json({
            status: "Ok",
            message: "Thêm sản phẩm thành công",
            product: newProduct
        });
    } catch (error) {
        console.error("Lỗi khi thêm sản phẩm:", error);
        res.status(500).json({
            status: "Error",
            message: "Lỗi khi thêm sản phẩm: " + error.message,
        });
    }
};

// Cập nhật sản phẩm
const updateProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        console.log("Bắt đầu cập nhật sản phẩm", {
            productId,
            body: req.body,
            file: req.file,
        });

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                status: "Error",
                message: "ID sản phẩm không hợp lệ",
            });
        }

        // Tìm sản phẩm cần cập nhật
        const product = await Product.findById(productId);
        if (!product) {
            console.log("Không tìm thấy sản phẩm với ID:", productId);
            return res.status(404).json({
                status: "Error",
                message: "Không tìm thấy sản phẩm",
            });
        }

        // Lấy dữ liệu từ request
        const {
            name,
            category,
            providerId,
            hasVariants,
            price,
            inventory,
            status,
            inventoryId
        } = req.body;

        // Cập nhật thông tin sản phẩm
        if (name) product.name = name;
        if (category) product.category = category;
        if (providerId) product.providerId = providerId;
        if (hasVariants !== undefined) product.hasVariants = hasVariants === "true" || hasVariants === true;
        if (price && !product.hasVariants) product.price = parseFloat(price);
        if (inventory && !product.hasVariants) product.inventory = parseInt(inventory);
        if (status) product.status = status;
        if (inventoryId) product.inventoryId = inventoryId;

        // Xử lý file ảnh mới
        if (req.file) {
            // Xóa ảnh cũ nếu có
            if (product.thumbnail) {
                const oldImagePath = path.join(__dirname, "../public", product.thumbnail);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                    console.log("Đã xóa ảnh cũ:", oldImagePath);
                }
            }

            // Lưu ảnh mới
            product.thumbnail = `/images/${req.file.filename}`;
            console.log("Đã lưu ảnh thumbnail mới:", product.thumbnail);
        }

        // Lưu sản phẩm đã cập nhật
        await product.save();
        console.log("Đã cập nhật sản phẩm:", product);

        res.status(200).json({
            status: "Ok",
            message: "Cập nhật sản phẩm thành công",
            data: product,
        });
    } catch (error) {
        console.error("Lỗi khi cập nhật sản phẩm:", error);
        res.status(500).json({
            status: "Error",
            message: "Lỗi khi cập nhật sản phẩm: " + error.message,
        });
    }
};

// Xóa sản phẩm
const deleteProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        console.log("Bắt đầu xóa sản phẩm", { productId });

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                status: "Error",
                message: "ID sản phẩm không hợp lệ",
            });
        }

        // Tìm sản phẩm cần xóa
        const product = await Product.findById(productId);
        if (!product) {
            console.log("Không tìm thấy sản phẩm với ID:", productId);
            return res.status(404).json({
                status: "Error",
                message: "Không tìm thấy sản phẩm",
            });
        }

        // Xóa ảnh sản phẩm nếu có
        if (product.thumbnail) {
            const imagePath = path.join(__dirname, "../public", product.thumbnail);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
                console.log("Đã xóa ảnh:", imagePath);
            }
        }

        // Xóa các chi tiết biến thể liên quan
        if (product.detailsVariants && product.detailsVariants.length > 0) {
            await DetailsVariant.deleteMany({ _id: { $in: product.detailsVariants } });
            console.log("Đã xóa các chi tiết biến thể liên quan");
        }

        // Xóa sản phẩm
        await Product.findByIdAndDelete(productId);
        console.log("Đã xóa sản phẩm:", productId);

        res.status(200).json({
            status: "Ok",
            message: "Xóa sản phẩm thành công",
        });
    } catch (error) {
        console.error("Lỗi khi xóa sản phẩm:", error);
        res.status(500).json({
            status: "Error",
            message: "Lỗi khi xóa sản phẩm: " + error.message,
        });
    }
};

// Lấy thông tin bán hàng của sản phẩm
const getProductSales = async (req, res) => {
    try {
        // Lấy danh sách sản phẩm từ Inventory
        const inventoryItems = await Inventory.find()
            .populate("typeProduct_id")
            .populate("provider_id")
            .lean();
            
        // Chuyển đổi dữ liệu từ Inventory sang định dạng Product
        const products = inventoryItems.map(item => {
            return {
                _id: item._id,
                name: item.product_name,
                product_code: item.product_code,
                category: item.typeProduct_id,
                providerId: item.provider_id,
                status: item.status,
                hasVariants: item.hasVariants,
                price: item.hasVariants ? 
                    (item.variantDetails && item.variantDetails.length > 0 ? 
                        item.variantDetails.reduce((min, v) => Math.min(min, v.price), Infinity) : 0) : 
                    item.total_price / (item.total_quantity || 1),
                inventory: item.total_quantity,
                inventoryId: item._id,
                variantDetails: item.variantDetails
            };
        });

        // Lấy các đơn hàng đã thanh toán thành công
        const orders = await mongoose.model('Order').find({
            status: { $ne: 'canceled' }, // Không tính đơn hàng đã hủy
            paymentStatus: 'paid' // Chỉ tính đơn hàng đã thanh toán
        }).populate('products.productID');

        // Tính toán số lượng bán và doanh thu cho mỗi sản phẩm
        const productSales = products.map(product => {
            let totalSold = 0;
            let revenue = 0;

            orders.forEach(order => {
                order.products.forEach(orderProduct => {
                    if (orderProduct.productID && orderProduct.productID._id.toString() === product._id.toString()) {
                        totalSold += orderProduct.quantity || 0;
                        revenue += (orderProduct.price * orderProduct.quantity) || 0;
                    }
                });
            });

            // Tính tồn kho tổng nếu sản phẩm có biến thể
            let totalInventory = 0;
            if (product.hasVariants && product.variantDetails && product.variantDetails.length > 0) {
                totalInventory = product.variantDetails.reduce((sum, variant) => sum + (variant.inventory || 0), 0);
            } else {
                totalInventory = product.inventory || 0;
            }

            return {
                _id: product._id,
                name: product.name,
                thumbnail: product.thumbnail,
                totalSold,
                revenue,
                inventory: totalInventory
            };
        });

        // Sắp xếp theo số lượng bán giảm dần và chỉ lấy những sản phẩm đã bán được
        const sortedProductSales = productSales
            .filter(product => product.totalSold > 0)
            .sort((a, b) => b.totalSold - a.totalSold);

        res.json({
            status: "Ok",
            data: sortedProductSales
        });
    } catch (error) {
        console.error("Lỗi khi lấy thông tin bán hàng:", error);
        res.status(500).json({
            status: "Error",
            message: error.message
        });
    }
};

// Lấy thống kê tổng quan cho dashboard
const getDashboardStats = async (req, res) => {
    try {
        // Get current date at start of day
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get yesterday's date
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // Get all orders for today and yesterday
        const todayOrders = await Order.find({
            createdAt: { $gte: today },
            status: { $ne: 'canceled' }
        });

        const yesterdayOrders = await Order.find({
            createdAt: { $gte: yesterday, $lt: today },
            status: { $ne: 'canceled' }
        });

        // Calculate revenue from paid orders
        const todayRevenue = todayOrders
            .filter(order => order.paymentStatus === 'paid')
            .reduce((sum, order) => sum + (order.totalAmount || 0), 0);

        const yesterdayRevenue = yesterdayOrders
            .filter(order => order.paymentStatus === 'paid')
            .reduce((sum, order) => sum + (order.totalAmount || 0), 0);

        // Get total customers and new customers
        const totalCustomers = await Customer.countDocuments();
        const newCustomers = await Customer.countDocuments({
            createdAt: { $gte: today }
        });
        const yesterdayNewCustomers = await Customer.countDocuments({
            createdAt: { $gte: yesterday, $lt: today }
        });

        // Get total products and new products
        const totalProducts = await Product.countDocuments();
        const newProducts = await Product.countDocuments({
            createdAt: { $gte: today }
        });
        const yesterdayNewProducts = await Product.countDocuments({
            createdAt: { $gte: yesterday, $lt: today }
        });

        // Calculate percentage changes
        const calculatePercentageChange = (current, previous) => {
            if (previous === 0) {
                return current > 0 ? 100 : 0;
            }
            return Math.round(((current - previous) / previous) * 100);
        };

        const stats = {
            totalRevenue: todayRevenue,
            totalOrders: todayOrders.length,
            totalCustomers,
            totalProducts,
            percentageChanges: {
                revenue: calculatePercentageChange(todayRevenue, yesterdayRevenue),
                orders: calculatePercentageChange(todayOrders.length, yesterdayOrders.length),
                customers: calculatePercentageChange(newCustomers, yesterdayNewCustomers),
                products: calculatePercentageChange(newProducts, yesterdayNewProducts)
            }
        };

        console.log('Dashboard Stats:', {
            todayRevenue,
            yesterdayRevenue,
            todayOrders: todayOrders.length,
            yesterdayOrders: yesterdayOrders.length,
            percentageChanges: stats.percentageChanges
        });

        res.json({
            status: "Ok",
            data: stats
        });
    } catch (error) {
        console.error('Error getting dashboard stats:', error);
        res.status(500).json({
            status: "Error",
            message: "Internal server error",
            error: error.message
        });
    }
};

// Lấy thống kê phân bố đơn hàng
const getOrderDistribution = async (req, res) => {
    try {
        // Lấy tất cả đơn hàng
        const orders = await mongoose.model('Order').find();

        // Đếm số lượng đơn hàng theo trạng thái
        const distribution = {
            completed: 0, // Hoàn thành
            processing: 0, // Đang xử lý
            canceled: 0 // Hủy
        };

        orders.forEach(order => {
            switch (order.status) {
                case 'completed':
                    distribution.completed++;
                    break;
                case 'processing':
                    distribution.processing++;
                    break;
                case 'canceled':
                    distribution.canceled++;
                    break;
            }
        });

        // Tính tổng số đơn hàng
        const total = orders.length;

        // Tính phần trăm cho mỗi trạng thái
        const percentages = {
            completed: total > 0 ? (distribution.completed / total * 100).toFixed(1) : 0,
            processing: total > 0 ? (distribution.processing / total * 100).toFixed(1) : 0,
            canceled: total > 0 ? (distribution.canceled / total * 100).toFixed(1) : 0
        };

        res.json({
            status: "Ok",
            data: {
                distribution,
                percentages,
                total
            }
        });
    } catch (error) {
        console.error("Lỗi khi lấy thống kê phân bố đơn hàng:", error);
        res.status(500).json({
            status: "Error",
            message: error.message
        });
    }
};

const getEmployeePerformance = async (req, res) => {
    try {
        console.log('\n===== FETCHING EMPLOYEE PERFORMANCE DATA =====');
        
        // Get the date range (default to current month)
        const endDate = new Date();
        const startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
        
        console.log(`Analyzing performance from ${startDate.toISOString()} to ${endDate.toISOString()}`);

        // Get all employees first
        const employees = await Employee.find()
            .populate('userId', 'fullName avatar')
            .lean();

        console.log(`Found ${employees.length} total employees`);

        // Get all completed and paid orders within date range
        const orders = await Order.find({
            createdAt: { $gte: startDate, $lte: endDate },
            status: { $ne: 'canceled' },
            employeeID: { $exists: true, $ne: null },
            paymentStatus: 'paid'
        }).populate('employeeID');

        console.log(`Found ${orders.length} valid orders in date range`);

        // Initialize performance map with all employees
        const employeeStats = new Map();
        let totalRevenue = 0;
        let totalOrders = 0;

        // Initialize stats for all employees
        employees.forEach(employee => {
            if (employee.userId) {  // Only include employees with valid user data
                employeeStats.set(employee._id.toString(), {
                    employeeId: employee._id,
                    fullName: employee.userId.fullName || 'Unknown',
                    avatar: employee.userId.avatar || null,
                    position: employee.position || 'Nhân viên bán hàng',
                    orderCount: 0,
                    totalRevenue: 0,
                    averageOrderValue: 0,
                    successRate: 0,
                    totalCustomers: new Set()
                });
            }
        });

        // Process orders
        orders.forEach(order => {
            if (!order.employeeID) return;

            const employeeId = order.employeeID._id.toString();
            const stats = employeeStats.get(employeeId);
            
            if (stats) {
                stats.orderCount++;
                stats.totalRevenue += order.totalAmount || 0;
                stats.totalCustomers.add(order.customerID.toString());
                totalRevenue += order.totalAmount || 0;
                totalOrders++;
            }
        });

        // Calculate final statistics and convert to array
        let performanceData = Array.from(employeeStats.values())
            .map(employee => {
                const orderCount = employee.orderCount;
                const totalRevenue = employee.totalRevenue;
                
                return {
                    employeeId: employee.employeeId,
                    fullName: employee.fullName,
                    avatar: employee.avatar,
                    position: employee.position,
                    orderCount,
                    totalRevenue,
                    averageOrderValue: orderCount > 0 ? totalRevenue / orderCount : 0,
                    contributionRatio: totalRevenue > 0 ? (employee.totalRevenue / totalRevenue) : 0,
                    customerCount: employee.totalCustomers.size,
                    performance: {
                        orders: orderCount,
                        revenue: totalRevenue,
                        averageOrder: orderCount > 0 ? totalRevenue / orderCount : 0,
                        contribution: totalRevenue > 0 ? (employee.totalRevenue / totalRevenue * 100).toFixed(1) : 0
                    }
                };
            })
            .filter(employee => employee.orderCount > 0)  // Only include employees with orders
            .sort((a, b) => b.totalRevenue - a.totalRevenue);  // Sort by revenue

        console.log('\nPerformance Summary:');
        console.log(`Total Revenue: ${totalRevenue}`);
        console.log(`Total Orders: ${totalOrders}`);
        console.log(`Active Employees: ${performanceData.length}`);
        
        console.log('===== END EMPLOYEE PERFORMANCE DATA =====\n');

        return res.json({
            status: 'Ok',
            data: {
                summary: {
                    totalRevenue,
                    totalOrders,
                    activeEmployees: performanceData.length,
                    averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
                    period: {
                        start: startDate,
                        end: endDate
                    }
                },
                employees: performanceData
            }
        });
    } catch (error) {
        console.error('Error in getEmployeePerformance:', error);
        return res.status(500).json({
            status: 'Error',
            message: error.message
        });
    }
};

module.exports = {
    getProduct,
    getProductAsJson,
    getProductById,
    addProduct: [upload.single("thumbnail"), addProduct],
    updateProduct: [upload.single("thumbnail"), updateProduct],
    deleteProduct,
    getVariantsPage,
    getProductSales,
    getDashboardStats,
    getOrderDistribution,
    getEmployeePerformance
};