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
        
        // Lấy danh sách sản phẩm từ Product model, chỉ lấy sản phẩm đã phát hành
        let products = await Product.find({ isPublished: true })
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

        // Lấy danh sách sản phẩm đã phát hành từ bảng Product
        const products = await Product.find({ isPublished: true })
            .populate("category")
            .populate("providerId")
            .lean();

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
  const productId = req.params.productId;
  console.log("Bắt đầu lấy sản phẩm theo ID", { productId });
  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({
      status: "Error",
      message: "ID sản phẩm không hợp lệ hoặc không được cung cấp",
    });
  }

  try {
    // Tìm sản phẩm từ bảng Product thay vì Inventory
    const product = await Product.findById(productId)
      .populate("category")
      .populate("providerId")
      .populate({
        path: "inventoryId",
        populate: {
          path: "variantDetails",
        }
      })
      .populate({
        path: "detailsVariants",
        populate: {
          path: "variantDetails.variantId",
          model: "Variant"
        }
      })
      .lean();

    if (!product) {
      console.log("Không tìm thấy sản phẩm với ID:", productId);
      return res.status(404).json({
        status: "Error",
        message: "Không tìm thấy sản phẩm với ID: " + productId,
      });
    }

    // Nếu có biến thể, lấy thông tin chi tiết
    if (product.hasVariants) {
      console.log(`Sản phẩm có biến thể, đang lấy thông tin chi tiết...`);
      
      // Lấy thông tin từ Inventory nếu cần thêm dữ liệu biến thể
      if (product.inventoryId) {
        const inventory = await Inventory.findById(product.inventoryId).lean();
        if (inventory && inventory.hasVariants && inventory.variantDetails && inventory.variantDetails.length > 0) {
          console.log(`Tìm thấy ${inventory.variantDetails.length} biến thể từ inventory`);
          
          // Thêm thông tin biến thể từ inventory vào product
          product.variantDetails = inventory.variantDetails;
          console.log('Đã thêm thông tin biến thể từ inventory vào product');
        }
      }
      
      // Kiểm tra nếu không có dữ liệu biến thể nào, thử lấy từ DetailsVariant
      if ((!product.variantDetails || product.variantDetails.length === 0) && 
          product.detailsVariants && product.detailsVariants.length > 0) {
        console.log('Không tìm thấy variantDetails, thử lấy từ detailsVariants');
        
        // Chuyển đổi detailsVariants thành định dạng variantDetails để dễ xử lý
        product.variantDetails = product.detailsVariants.map(variant => {
          return {
            attributes: variant.variantDetails ? 
              variant.variantDetails.reduce((acc, detail) => {
                if (detail.variantId && detail.variantId.name) {
                  acc[detail.variantId.name] = detail.value;
                }
                return acc;
              }, {}) : {},
            price: variant.price || 0,
            quantity: variant.inventory || 0
          };
        });
        
        console.log('Đã chuyển đổi detailsVariants thành variantDetails:', product.variantDetails);
      }
    }

    // Lấy thông tin bảo hành
    const warranty = await Warranty.findOne({ product: productId })
      .sort({ createdAt: -1 })
      .lean();
    if (warranty) {
      product.warrantyPeriod = warranty.warrantyPeriod;
    }

    console.log("Đã tìm thấy sản phẩm:", product.name);
    console.log("Thông tin biến thể:", product.hasVariants ? 
      (product.variantDetails?.length || 0) + " biến thể" : 
      "Không có biến thể");
    
    if (product.variantDetails && product.variantDetails.length > 0) {
      console.log("Chi tiết biến thể đầu tiên:", JSON.stringify(product.variantDetails[0]));
    }
    
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

        // Thêm log kiểm tra dữ liệu variantDetails gửi lên từ frontend
        console.log("[LOG] Dữ liệu variantDetails gửi lên từ frontend:", variantDetails);

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
            // Nếu không có biến thể, lấy giá nhập gần nhất từ batch_info hoặc total_price nếu không có batch_info
            if (Array.isArray(inventoryItem.batch_info) && inventoryItem.batch_info.length > 0) {
                originalPrice = inventoryItem.batch_info[inventoryItem.batch_info.length - 1].price;
            } else {
                originalPrice = inventoryItem.total_price;
            }
        }

        // Xử lý detailsVariants: luôn lưu nếu inventory có biến thể
        let detailsVariants = [];
        if (
            (hasVariants === true || hasVariants === "true" || inventoryItem.hasVariants) &&
            inventoryItem.variantDetails &&
            inventoryItem.variantDetails.length > 0
        ) {
            let parsedVariants = [];
            try {
                parsedVariants = typeof variantDetails === 'string' ? JSON.parse(variantDetails) : variantDetails;
            } catch (e) {
                parsedVariants = [];
            }
            if (Array.isArray(parsedVariants) && parsedVariants.length > 0) {
                // Ưu tiên lấy từ form nếu có
                detailsVariants = parsedVariants.map((v, idx) => ({
                    attributes: v.attributes,
                    price: v.price, // Giá bán nhập từ form
                    original_price: inventoryItem.variantDetails[idx]?.price || 0, // Giá nhập từ kho
                    inventory: v.inventory
                }));
            } else {
                // Nếu không có dữ liệu form, lấy từ inventory
                detailsVariants = inventoryItem.variantDetails.map(v => ({
                    attributes: v.attributes,
                    price: v.price, // Giá nhập (nếu chưa nhập giá bán)
                    original_price: v.price, // Giá nhập
                    inventory: v.quantity
                }));
            }
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
            status: status || 'available',
            isPublished: true, // Luôn phát hành khi tạo mới
            detailsVariants
        });

        // Lưu sản phẩm mới
        await newProduct.save();
        console.log("Đã tạo sản phẩm mới:", newProduct);

        // Gửi thông báo về sản phẩm mới được phát hành
        try {
            const notificationController = require('./NotificationController');
            
            // Tạo tiêu đề và nội dung thông báo
            const notificationTitle = `Sản phẩm mới: ${newProduct.name}`;
            
            // Lấy tên danh mục và nhà cung cấp
            const category = await mongoose.model('TypeProduct').findById(newProduct.category);
            const provider = await mongoose.model('Provider').findById(newProduct.providerId);
            
            const categoryName = category?.name || 'Không xác định';
            const providerName = provider?.fullName || 'Không xác định';
            
            // Tạo nội dung thông báo
            const notificationBody = `${categoryName} - ${providerName} - ${newProduct.price?.toLocaleString('vi-VN')} đ`;
            
            // Dữ liệu bổ sung cho thông báo (dùng cho điều hướng)
            const notificationData = {
                screen: 'ProductDetail',
                productId: newProduct._id.toString(),
                type: 'NEW_PRODUCT',
                timestamp: Date.now().toString()
            };
            
            console.log('Gửi thông báo về sản phẩm mới:', {
                title: notificationTitle,
                body: notificationBody,
                data: notificationData
            });
            
            // Gửi thông báo đến tất cả thiết bị
            const notificationResult = await notificationController.sendNotificationToAll(
                notificationTitle,
                notificationBody,
                notificationData
            );
            
            console.log('Kết quả gửi thông báo:', notificationResult);
        } catch (notificationError) {
            console.error('Lỗi khi gửi thông báo:', notificationError);
            // Tiếp tục xử lý ngay cả khi gửi thông báo thất bại
        }

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
        console.log('Product sales request with query params:', req.query);
        
        // Extract date range from query parameters
        let startDate, endDate;
        
        if (req.query.startDate && req.query.endDate) {
            startDate = new Date(req.query.startDate);
            endDate = new Date(req.query.endDate);
            console.log(`Using provided date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
        } else {
            // Default to today
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            startDate = today;
            endDate = new Date(today);
            endDate.setHours(23, 59, 59, 999);
            console.log(`Using default date range (today): ${startDate.toISOString()} to ${endDate.toISOString()}`);
        }
        
        const products = await Product.find()
            .populate("providerId")
            .populate("category")
            .populate("detailsVariants");

        // Lấy các đơn hàng trong khoảng thời gian đã chọn
        const orders = await mongoose.model('Order').find({
            createdAt: { $gte: startDate, $lte: endDate },
            status: { $ne: 'canceled' }, // Không tính đơn hàng đã hủy
            paymentStatus: 'paid' // Chỉ tính đơn hàng đã thanh toán
        }).populate('products.productID');
        
        console.log(`Found ${orders.length} orders in the selected period`);

        // Tính toán số lượng bán và doanh thu cho mỗi sản phẩm
        const productSales = products.map(product => {
            let totalSold = 0;
            let revenue = 0;
            let productVariants = []; // Chứa các biến thể đã bán

            orders.forEach(order => {
                order.products.forEach(orderProduct => {
                    if (orderProduct.productID && orderProduct.productID._id.toString() === product._id.toString()) {
                        totalSold += orderProduct.quantity || 0;
                        revenue += (orderProduct.price * orderProduct.quantity) || 0;
                        
                        // Theo dõi các biến thể đã bán
                        if (orderProduct.attributes && orderProduct.attributes.length > 0) {
                            productVariants.push({
                                quantity: orderProduct.quantity,
                                attributes: orderProduct.attributes
                            });
                        }
                    }
                });
            });

            // Tính tồn kho tổng nếu sản phẩm có biến thể
            let totalInventory = 0;
            if (product.hasVariants && product.detailsVariants && product.detailsVariants.length > 0) {
                totalInventory = product.detailsVariants.reduce((sum, variant) => sum + (variant.inventory || 0), 0);
            } else {
                totalInventory = product.inventory || 0;
            }

            // Tạo một đối tượng biến thể duy nhất để hiển thị
            let displayVariants = [];
            if (productVariants.length > 0) {
                // Lấy biến thể đầu tiên để hiển thị
                const firstVariant = productVariants[0];
                displayVariants = firstVariant.attributes.map(attr => ({
                    name: attr.name,
                    value: attr.value
                }));
            }

            return {
                _id: product._id,
                name: product.name,
                thumbnail: product.thumbnail,
                sku: product.sku || product.productCode || product._id.toString().substring(0, 8),
                totalSold,
                revenue,
                inventory: totalInventory,
                attributes: displayVariants
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
        console.log('Dashboard stats request with query params:', req.query);
        
        // Extract date range from query parameters
        let startDate, endDate;
        
        if (req.query.startDate && req.query.endDate) {
            startDate = new Date(req.query.startDate);
            endDate = new Date(req.query.endDate);
            console.log(`Using provided date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
        } else {
            // Default to today
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            startDate = today;
            endDate = new Date(today);
            endDate.setHours(23, 59, 59, 999);
            console.log(`Using default date range (today): ${startDate.toISOString()} to ${endDate.toISOString()}`);
        }
        
        // Get yesterday's date for comparison (one day before the start date)
        const previousPeriodEndDate = new Date(startDate);
        previousPeriodEndDate.setMilliseconds(-1); // One millisecond before start date
        
        // Calculate the duration of the current period in milliseconds
        const periodDuration = endDate.getTime() - startDate.getTime();
        
        // Set the start of the previous period with the same duration
        const previousPeriodStartDate = new Date(previousPeriodEndDate.getTime() - periodDuration);
        
        console.log(`Comparison period: ${previousPeriodStartDate.toISOString()} to ${previousPeriodEndDate.toISOString()}`);

        // Get all orders for current period and previous period
        const currentPeriodOrders = await Order.find({
            createdAt: { $gte: startDate, $lte: endDate },
            status: { $ne: 'canceled' }
        });

        const previousPeriodOrders = await Order.find({
            createdAt: { $gte: previousPeriodStartDate, $lte: previousPeriodEndDate },
            status: { $ne: 'canceled' }
        });

        // Calculate revenue from paid orders
        const currentPeriodRevenue = currentPeriodOrders
            .filter(order => order.paymentStatus === 'paid')
            .reduce((sum, order) => sum + (order.totalAmount || 0), 0);

        const previousPeriodRevenue = previousPeriodOrders
            .filter(order => order.paymentStatus === 'paid')
            .reduce((sum, order) => sum + (order.totalAmount || 0), 0);

        // Get total customers and new customers in the period
        const totalCustomers = await Customer.countDocuments();
        const newCustomers = await Customer.countDocuments({
            createdAt: { $gte: startDate, $lte: endDate }
        });
        const previousPeriodNewCustomers = await Customer.countDocuments({
            createdAt: { $gte: previousPeriodStartDate, $lte: previousPeriodEndDate }
        });

        // Count total products sold in the period
        const productsSold = currentPeriodOrders.reduce((count, order) => {
            return count + order.products.reduce((sum, product) => sum + (product.quantity || 0), 0);
        }, 0);
        
        const previousPeriodProductsSold = previousPeriodOrders.reduce((count, order) => {
            return count + order.products.reduce((sum, product) => sum + (product.quantity || 0), 0);
        }, 0);

        // Calculate percentage changes
        const calculatePercentageChange = (current, previous) => {
            if (previous === 0) {
                return current > 0 ? 100 : 0;
            }
            return Math.round(((current - previous) / previous) * 100);
        };

        const stats = {
            totalRevenue: currentPeriodRevenue,
            totalOrders: currentPeriodOrders.length,
            totalCustomers: newCustomers,
            totalProducts: productsSold,
            percentageChanges: {
                revenue: calculatePercentageChange(currentPeriodRevenue, previousPeriodRevenue),
                orders: calculatePercentageChange(currentPeriodOrders.length, previousPeriodOrders.length),
                customers: calculatePercentageChange(newCustomers, previousPeriodNewCustomers),
                products: calculatePercentageChange(productsSold, previousPeriodProductsSold)
            }
        };

        console.log('Dashboard Stats:', {
            currentPeriodRevenue,
            previousPeriodRevenue,
            currentPeriodOrders: currentPeriodOrders.length,
            previousPeriodOrders: previousPeriodOrders.length,
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
        console.log('Order distribution request with query params:', req.query);
        
        // Extract date range from query parameters
        let startDate, endDate;
        
        if (req.query.startDate && req.query.endDate) {
            startDate = new Date(req.query.startDate);
            endDate = new Date(req.query.endDate);
            console.log(`Using provided date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
        } else {
            // Default to today
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            startDate = today;
            endDate = new Date(today);
            endDate.setHours(23, 59, 59, 999);
            console.log(`Using default date range (today): ${startDate.toISOString()} to ${endDate.toISOString()}`);
        }

        // Lấy tất cả đơn hàng trong khoảng thời gian đã chọn
        const orders = await mongoose.model('Order').find({
            createdAt: { $gte: startDate, $lte: endDate }
        });

        // Đếm số lượng đơn hàng theo trạng thái
        const distribution = {
            completed: 0, // Hoàn thành
            processing: 0, // Đang xử lý
            canceled: 0, // Hủy
            pending: 0 // Chờ xử lý
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
                case 'pending':
                    distribution.pending++;
                    break;
                default:
                    // Thêm vào pending nếu không khớp với bất kỳ trạng thái đã biết nào
                    distribution.pending++;
            }
        });

        // Tính tổng số đơn hàng
        const total = orders.length;

        // Tính phần trăm cho mỗi trạng thái
        const percentages = {
            completed: total > 0 ? (distribution.completed / total * 100).toFixed(1) : 0,
            processing: total > 0 ? (distribution.processing / total * 100).toFixed(1) : 0,
            canceled: total > 0 ? (distribution.canceled / total * 100).toFixed(1) : 0,
            pending: total > 0 ? (distribution.pending / total * 100).toFixed(1) : 0
        };

        console.log(`Found ${total} orders in the selected period with distribution:`, distribution);

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
        
        // Extract date range from query parameters
        let startDate, endDate;
        
        if (req.query.startDate && req.query.endDate) {
            startDate = new Date(req.query.startDate);
            endDate = new Date(req.query.endDate);
            console.log(`Using provided date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
        } else {
            // Default to current month
            endDate = new Date();
            startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
            console.log(`Using default date range (month): ${startDate.toISOString()} to ${endDate.toISOString()}`);
        }
        
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
            
            // Handle both object and string employeeID
            let employeeId = null;
            if (typeof order.employeeID === 'object' && order.employeeID !== null) {
                employeeId = order.employeeID._id.toString();
            } else if (typeof order.employeeID === 'string') {
                employeeId = order.employeeID;
            } else {
                console.log(`Skipping order with invalid employeeID format: ${order.orderID}`);
                return;
            }
            
            console.log(`Processing order ${order.orderID || order._id} by employee ${employeeId}`);
            
            const stats = employeeStats.get(employeeId);
            
            if (stats) {
                stats.orderCount++;
                stats.totalRevenue += order.totalAmount || 0;
                if (order.customerID) {
                    stats.totalCustomers.add(order.customerID.toString());
                }
                totalRevenue += order.totalAmount || 0;
                totalOrders++;
            } else {
                console.log(`Employee ${employeeId} not found in stats map`);
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
        
        if (performanceData.length === 0) {
            console.log('WARNING: No employee performance data found for the selected period');
        } else {
            console.log('Top performer:', performanceData[0].fullName);
        }
        
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

// Thêm hàm phát hành sản phẩm
const publishProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        console.log("Bắt đầu phát hành sản phẩm", { productId });

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                status: "Error",
                message: "ID sản phẩm không hợp lệ",
            });
        }

        // Tìm sản phẩm cần phát hành
        const product = await Product.findById(productId);
        if (!product) {
            console.log("Không tìm thấy sản phẩm với ID:", productId);
            return res.status(404).json({
                status: "Error",
                message: "Không tìm thấy sản phẩm",
            });
        }

        // Cập nhật trạng thái phát hành
        product.isPublished = true;
        await product.save();
        console.log("Đã phát hành sản phẩm:", productId);

        // Gửi thông báo về sản phẩm mới được phát hành
        try {
            const notificationController = require('./NotificationController');
            
            // Tạo tiêu đề và nội dung thông báo
            const notificationTitle = `Sản phẩm mới: ${product.name}`;
            
            // Lấy tên danh mục và nhà cung cấp
            const category = await mongoose.model('TypeProduct').findById(product.category);
            const provider = await mongoose.model('Provider').findById(product.providerId);
            
            const categoryName = category?.name || 'Không xác định';
            const providerName = provider?.fullName || 'Không xác định';
            
            // Tạo nội dung thông báo
            const notificationBody = `${categoryName} - ${providerName} - ${product.price?.toLocaleString('vi-VN')} đ`;
            
            // Dữ liệu bổ sung cho thông báo (dùng cho điều hướng)
            const notificationData = {
                screen: 'ProductDetail',
                productId: product._id.toString(),
                type: 'NEW_PRODUCT',
                timestamp: Date.now().toString()
            };
            
            console.log('Gửi thông báo về sản phẩm mới:', {
                title: notificationTitle,
                body: notificationBody,
                data: notificationData
            });
            
            // Gửi thông báo đến tất cả thiết bị
            const notificationResult = await notificationController.sendNotificationToAll(
                notificationTitle,
                notificationBody,
                notificationData
            );
            
            console.log('Kết quả gửi thông báo:', notificationResult);
        } catch (notificationError) {
            console.error('Lỗi khi gửi thông báo:', notificationError);
            // Tiếp tục xử lý ngay cả khi gửi thông báo thất bại
        }

        res.status(200).json({
            status: "Ok",
            message: "Phát hành sản phẩm thành công",
            data: product,
        });
    } catch (error) {
        console.error("Lỗi khi phát hành sản phẩm:", error);
        res.status(500).json({
            status: "Error",
            message: "Lỗi khi phát hành sản phẩm: " + error.message,
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
    getEmployeePerformance,
    publishProduct
};