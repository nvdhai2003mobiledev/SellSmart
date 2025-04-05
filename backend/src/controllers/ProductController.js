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

// Lấy danh sách sản phẩm
const getProduct = async (req, res) => {
    try {
        console.log("Bắt đầu lấy danh sách sản phẩm", {
            path: req.path,
            acceptHeader: req.headers.accept,
        });
        const products = await Product.find()
            .populate("providerId")
            .populate("category")
            .populate("detailsVariants")
            .lean();

        // Lấy thông tin bảo hành cho mỗi sản phẩm
        for (let product of products) {
            const warranty = await Warranty.findOne({ product: product._id })
                .sort({ createdAt: -1 })
                .lean();
            if (warranty) {
                product.warrantyPeriod = warranty.warrantyPeriod;
            }
        }

        // Lấy danh sách nhà cung cấp và danh mục
        const providers = await mongoose.model('Provider').find().lean();
        const categories = await TypeProduct.find().lean();

        console.log(`Tìm thấy ${products.length} sản phẩm`);

        if (req.path.includes("/json") || req.headers.accept === "application/json") {
            console.log("Trả về danh sách sản phẩm dạng JSON");
            return res.json({ status: "Ok", data: products });
        }

        console.log("Render trang dashboard/products");
        res.render("dashboard/products", {
            products,
            providers,
            categories,
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

        const products = await Product.find()
            .populate("providerId")
            .populate("category")
            .populate("detailsVariants")
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
  const { productId } = req.params;
  console.log("Bắt đầu lấy sản phẩm theo ID", { productId });
  if (!mongoose.Types.ObjectId.isValid(productId)) {
      console.log("ID sản phẩm không hợp lệ", { productId });
      return res.status(400).json({ status: "Error", message: "ID sản phẩm không hợp lệ" });
  }
  try {
      const product = await Product.findById(productId)
          .populate('category')
          .populate('providerId')
          .populate({
              path: 'detailsVariants',
              populate: {
                  path: 'variantDetails.variantId',
                  model: 'Variant'
              }
          });
      
      if (!product) {
          console.warn("Không tìm thấy sản phẩm", { productId });
          return res.status(404).json({ status: "Error", message: "Không tìm thấy sản phẩm" });
      }
      
      // Loại bỏ các biến thể trùng lặp và kiểm tra null
      if (product.hasVariants && product.detailsVariants && product.detailsVariants.length > 0) {
          // Tạo map để lưu trữ các tổ hợp biến thể đã gặp
          const uniqueCombinations = new Map();
          const uniqueVariants = [];
          
          product.detailsVariants.forEach(variant => {
              // Kiểm tra và lọc các variantDetails hợp lệ
              const validVariantDetails = variant.variantDetails.filter(detail => 
                  detail && detail.variantId && detail.variantId._id && detail.value
              );
              
              if (validVariantDetails.length > 0) {
                  // Tạo key cho tổ hợp biến thể (kết hợp variantId và value)
                  const keyParts = validVariantDetails.map(detail => {
                      return `${detail.variantId._id.toString()}-${detail.value}`;
                  }).sort();
                  const combinationKey = keyParts.join('|');
                  
                  // Nếu tổ hợp này chưa tồn tại trong map, thêm vào
                  if (!uniqueCombinations.has(combinationKey)) {
                      uniqueCombinations.set(combinationKey, true);
                      variant.variantDetails = validVariantDetails; // Cập nhật lại chỉ các details hợp lệ
                      uniqueVariants.push(variant);
                  } else {
                      console.log("Phát hiện tổ hợp biến thể trùng lặp:", combinationKey);
                  }
              }
          });
          
          console.log(`Đã lọc từ ${product.detailsVariants.length} thành ${uniqueVariants.length} tổ hợp biến thể duy nhất`);
          
          // Thay thế danh sách biến thể bằng danh sách đã lọc
          product.detailsVariants = uniqueVariants;
      }
      
      console.log("Trả về chi tiết sản phẩm thành công", { 
          productId, 
          hasVariants: product.hasVariants,
          variantsCount: product.detailsVariants?.length || 0
      });
      
      res.json({ status: "Ok", data: product });
  } catch (error) {
      console.error("Lỗi khi lấy sản phẩm theo ID:", {
          productId,
          errorMessage: error.message,
          stack: error.stack
      });
      res.status(500).json({ status: "Error", message: error.message });
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
    destination: function (req, file, cb) {
        const uploadPath = 'public/uploads/products';
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Thêm sản phẩm
const addProduct = async (req, res) => {
    try {
        console.log("Bắt đầu thêm sản phẩm mới", {
            body: req.body,
            file: req.file,
        });

        const { name, category, providerId, status, variantDetails, price, inventory, warrantyPeriod } = req.body;

        if (!name || !category || !providerId) {
            console.warn("Dữ liệu đầu vào không hợp lệ", { name, category, providerId });
            return res.status(400).json({
                status: "Error",
                message: "Tên, danh mục và nhà cung cấp là bắt buộc",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(category)) {
            console.warn("ID danh mục không hợp lệ", { category });
            return res.status(400).json({
                status: "Error",
                message: "ID danh mục không hợp lệ",
            });
        }

        const categoryExists = await TypeProduct.findById(category).populate("variants");
        if (!categoryExists) {
            console.warn("Danh mục không tồn tại", { category });
            return res.status(404).json({
                status: "Error",
                message: "Danh mục không tồn tại",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(providerId)) {
            console.warn("ID nhà cung cấp không hợp lệ", { providerId });
            return res.status(400).json({
                status: "Error",
                message: "ID nhà cung cấp không hợp lệ",
            });
        }

        const thumbnail = req.file ? `/uploads/products/${req.file.filename}` : "";
        let parsedVariantDetails = [];
        let hasVariants = false;

        if (variantDetails) {
            console.log("Xử lý dữ liệu biến thể:", { type: typeof variantDetails, isArray: Array.isArray(variantDetails) });
            
            if (typeof variantDetails === "string") {
                try {
                    parsedVariantDetails = JSON.parse(variantDetails);
                } catch (e) {
                    console.warn("Dữ liệu variantDetails không hợp lệ", { variantDetails, error: e.message });
                    return res.status(400).json({
                        status: "Error",
                        message: "Dữ liệu biến thể không hợp lệ",
                    });
                }
            } else if (Array.isArray(variantDetails)) {
                // Xử lý các trường hợp khi variantDetails là mảng
                parsedVariantDetails = [];
                for (const item of variantDetails) {
                    if (typeof item === "string") {
                        try {
                            // Nếu item là chuỗi JSON, parse nó
                            const parsed = JSON.parse(item);
                            // Nếu kết quả là mảng, thêm từng phần tử
                            if (Array.isArray(parsed)) {
                                parsedVariantDetails = parsedVariantDetails.concat(parsed);
                            } else {
                                // Nếu là đối tượng đơn lẻ, thêm nó
                                parsedVariantDetails.push(parsed);
                            }
                        } catch (e) {
                            console.warn("Không thể parse phần tử variantDetails", { item, error: e.message });
                            return res.status(400).json({
                                status: "Error",
                                message: "Dữ liệu biến thể không hợp lệ",
                            });
                        }
                    } else {
                        // Nếu item đã là đối tượng JavaScript, thêm nó trực tiếp
                        parsedVariantDetails.push(item);
                    }
                }
                console.log("Dữ liệu biến thể sau khi parse:", parsedVariantDetails);
            } else {
                console.warn("variantDetails phải là chuỗi JSON hoặc mảng", { variantDetails });
                return res.status(400).json({
                    status: "Error",
                    message: "Dữ liệu biến thể phải là chuỗi JSON hoặc mảng",
                });
            }
            
            // Loại bỏ biến thể trùng lặp
            if (parsedVariantDetails.length > 0) {
                console.log("Kiểm tra và loại bỏ biến thể trùng lặp");
                const uniqueCombinations = new Map();
                const uniqueVariants = [];
                
                parsedVariantDetails.forEach(variant => {
                    // Tạo key cho tổ hợp biến thể (kết hợp variantId và value)
                    const keyParts = variant.variantDetails.map(detail => {
                        return `${detail.variantId}-${detail.value}`;
                    }).sort();
                    const combinationKey = keyParts.join('|');
                    
                    // Nếu tổ hợp này chưa tồn tại trong map, thêm vào
                    if (!uniqueCombinations.has(combinationKey)) {
                        uniqueCombinations.set(combinationKey, true);
                        uniqueVariants.push(variant);
                    } else {
                        console.log("Loại bỏ tổ hợp biến thể trùng lặp:", combinationKey);
                    }
                });
                
                console.log(`Đã lọc từ ${parsedVariantDetails.length} thành ${uniqueVariants.length} tổ hợp biến thể duy nhất`);
                parsedVariantDetails = uniqueVariants;
            }
            
            hasVariants = parsedVariantDetails.length > 0;
        }

        if (!hasVariants && (!price || !inventory || price < 0 || inventory < 0)) {
            console.warn("Giá và số lượng không hợp lệ khi không có biến thể", { price, inventory });
            return res.status(400).json({
                status: "Error",
                message: "Giá và số lượng phải là số không âm nếu không có biến thể",
            });
        }

        if (hasVariants) {
            for (const detail of parsedVariantDetails) {
                for (const variantDetail of detail.variantDetails) {
                    const variantId = variantDetail.variantId;
                    if (!categoryExists.variants.some((v) => v._id.toString() === variantId)) {
                        console.warn("Biến thể không thuộc danh mục", { variantId, category });
                        return res.status(400).json({
                            status: "Error",
                            message: `Biến thể ${variantId} không thuộc danh mục ${category}`,
                        });
                    }

                    const variant = await Variant.findById(variantId);
                    if (!variant || !variant.values.includes(variantDetail.value)) {
                        console.warn("Giá trị biến thể không hợp lệ", { variantId, value: variantDetail.value });
                        return res.status(400).json({
                            status: "Error",
                            message: `Giá trị '${variantDetail.value}' không hợp lệ cho biến thể '${variantId}'`,
                        });
                    }
                }

                if (detail.price === undefined || detail.inventory === undefined || detail.price < 0 || detail.inventory < 0) {
                    console.warn("Giá hoặc tồn kho không hợp lệ", { price: detail.price, inventory: detail.inventory });
                    return res.status(400).json({
                        status: "Error",
                        message: "Giá và tồn kho phải là số không âm",
                    });
                }
            }
        }

        const newProduct = new Product({
            name,
            thumbnail,
            category,
            providerId,
            status: status || "available",
            hasVariants,
            price: hasVariants ? undefined : Number(price),
            inventory: hasVariants ? undefined : Number(inventory),
            detailsVariants: [],
        });

        const savedProduct = await newProduct.save();

        // Tạo bảo hành mới cho sản phẩm
        const newWarranty = new Warranty({
            product: savedProduct._id,
            status: 'Chờ kích hoạt',
            warrantyPeriod: warrantyPeriod || 12 // Mặc định 12 tháng nếu không được chỉ định
        });

        await newWarranty.save();

        if (hasVariants) {
            const detailsVariants = await DetailsVariant.insertMany(
                parsedVariantDetails.map((detail) => ({
                    productId: savedProduct._id,
                    variantDetails: detail.variantDetails,
                    price: Number(detail.price),
                    inventory: Number(detail.inventory),
                }))
            );
            savedProduct.detailsVariants = detailsVariants.map((d) => d._id);
            await savedProduct.save();
        }

        console.log("Sản phẩm và bảo hành đã được thêm thành công", {
            productId: savedProduct._id,
            productName: savedProduct.name,
            variantsCount: parsedVariantDetails.length,
            warrantyId: newWarranty._id,
            warrantyPeriod: newWarranty.warrantyPeriod
        });

        res.status(201).json({
            status: "Ok",
            message: "Sản phẩm và bảo hành đã được thêm thành công",
            data: {
                product: savedProduct,
                warranty: newWarranty
            },
        });
    } catch (error) {
        console.error("Lỗi khi thêm sản phẩm và bảo hành:", {
            body: req.body,
            file: req.file,
            errorMessage: error.message,
            stack: error.stack,
        });
        res.status(500).json({
            status: "Error",
            message: "Lỗi khi thêm sản phẩm và bảo hành: " + error.message,
        });
    }
};

// Cập nhật sản phẩm
const updateProduct = async (req, res) => {
    try {
        console.log("Bắt đầu cập nhật sản phẩm", {
            productId: req.params.productId,
            body: req.body,
        });

        const { productId } = req.params;
        const { name, category, providerId, status, variantDetails, price, inventory } = req.body;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            console.warn("ID sản phẩm không hợp lệ", { productId });
            return res.status(400).json({
                status: "Error",
                message: "ID sản phẩm không hợp lệ",
            });
        }

        const product = await Product.findById(productId);
        if (!product) {
            console.warn("Sản phẩm không tồn tại", { productId });
            return res.status(404).json({
                status: "Error",
                message: "Không tìm thấy sản phẩm",
            });
        }

        if (!name || !category || !providerId) {
            console.warn("Dữ liệu đầu vào không hợp lệ", { name, category, providerId });
            return res.status(400).json({
                status: "Error",
                message: "Tên, danh mục và nhà cung cấp là bắt buộc",
            });
        }

        const categoryExists = await TypeProduct.findById(category).populate("variants");
        if (!categoryExists) {
            console.warn("Danh mục không tồn tại", { category });
            return res.status(404).json({
                status: "Error",
                message: "Danh mục không tồn tại",
            });
        }

        let parsedVariantDetails = [];
        let hasVariants = false;

        if (variantDetails) {
            console.log("Xử lý dữ liệu biến thể (cập nhật):", { type: typeof variantDetails, isArray: Array.isArray(variantDetails) });
            
            if (typeof variantDetails === "string") {
                try {
                    parsedVariantDetails = JSON.parse(variantDetails);
                } catch (e) {
                    console.warn("Dữ liệu variantDetails không hợp lệ", { variantDetails, error: e.message });
                    return res.status(400).json({
                        status: "Error",
                        message: "Dữ liệu biến thể không hợp lệ",
                    });
                }
            } else if (Array.isArray(variantDetails)) {
                // Xử lý các trường hợp khi variantDetails là mảng
                parsedVariantDetails = [];
                for (const item of variantDetails) {
                    if (typeof item === "string") {
                        try {
                            // Nếu item là chuỗi JSON, parse nó
                            const parsed = JSON.parse(item);
                            // Nếu kết quả là mảng, thêm từng phần tử
                            if (Array.isArray(parsed)) {
                                parsedVariantDetails = parsedVariantDetails.concat(parsed);
                            } else {
                                // Nếu là đối tượng đơn lẻ, thêm nó
                                parsedVariantDetails.push(parsed);
                            }
                        } catch (e) {
                            console.warn("Không thể parse phần tử variantDetails", { item, error: e.message });
                            return res.status(400).json({
                                status: "Error",
                                message: "Dữ liệu biến thể không hợp lệ",
                            });
                        }
                    } else {
                        // Nếu item đã là đối tượng JavaScript, thêm nó trực tiếp
                        parsedVariantDetails.push(item);
                    }
                }
                console.log("Dữ liệu biến thể sau khi parse (cập nhật):", parsedVariantDetails);
            } else {
                console.warn("variantDetails phải là chuỗi JSON hoặc mảng", { variantDetails });
                return res.status(400).json({
                    status: "Error",
                    message: "Dữ liệu biến thể phải là chuỗi JSON hoặc mảng",
                });
            }
            
            // Loại bỏ biến thể trùng lặp
            if (parsedVariantDetails.length > 0) {
                console.log("Kiểm tra và loại bỏ biến thể trùng lặp trong cập nhật sản phẩm");
                const uniqueCombinations = new Map();
                const uniqueVariants = [];
                
                parsedVariantDetails.forEach(variant => {
                    // Tạo key cho tổ hợp biến thể (kết hợp variantId và value)
                    const keyParts = variant.variantDetails.map(detail => {
                        return `${detail.variantId}-${detail.value}`;
                    }).sort();
                    const combinationKey = keyParts.join('|');
                    
                    // Nếu tổ hợp này chưa tồn tại trong map, thêm vào
                    if (!uniqueCombinations.has(combinationKey)) {
                        uniqueCombinations.set(combinationKey, true);
                        uniqueVariants.push(variant);
                    } else {
                        console.log("Loại bỏ tổ hợp biến thể trùng lặp trong cập nhật:", combinationKey);
                    }
                });
                
                console.log(`Đã lọc từ ${parsedVariantDetails.length} thành ${uniqueVariants.length} tổ hợp biến thể duy nhất`);
                parsedVariantDetails = uniqueVariants;
            }
            
            hasVariants = parsedVariantDetails.length > 0;
        }

        if (!hasVariants && (!price || !inventory || price < 0 || inventory < 0)) {
            console.warn("Giá và số lượng không hợp lệ khi không có biến thể", { price, inventory });
            return res.status(400).json({
                status: "Error",
                message: "Giá và số lượng phải là số không âm nếu không có biến thể",
            });
        }

        if (hasVariants) {
            for (const detail of parsedVariantDetails) {
                for (const variantDetail of detail.variantDetails) {
                    if (!categoryExists.variants.some((v) => v._id.toString() === variantDetail.variantId)) {
                        console.warn("Biến thể không thuộc danh mục", { variantId: variantDetail.variantId, category });
                        return res.status(400).json({
                            status: "Error",
                            message: `Biến thể ${variantDetail.variantId} không thuộc danh mục ${category}`,
                        });
                    }

                    const variant = await Variant.findById(variantDetail.variantId);
                    if (!variant.values.includes(variantDetail.value)) {
                        console.warn("Giá trị biến thể không hợp lệ", { variantId: variantDetail.variantId, value: variantDetail.value });
                        return res.status(400).json({
                            status: "Error",
                            message: `Giá trị '${variantDetail.value}' không hợp lệ cho biến thể '${variantDetail.variantId}'`,
                        });
                    }
                }

                if (detail.price === undefined || detail.inventory === undefined || detail.price < 0 || detail.inventory < 0) {
                    console.warn("Giá hoặc tồn kho không hợp lệ", { price: detail.price, inventory: detail.inventory });
                    return res.status(400).json({
                        status: "Error",
                        message: "Giá và tồn kho phải là số không âm",
                    });
                }
            }
        }

        const updatedData = {
            name,
            category,
            providerId,
            status,
            hasVariants,
            price: hasVariants ? undefined : Number(price),
            inventory: hasVariants ? undefined : Number(inventory),
        };

        if (req.file) {
            if (product.thumbnail) {
                const oldImagePath = path.join(__dirname, "../public", product.thumbnail);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                    console.log("Xóa file ảnh cũ thành công", { oldImagePath });
                }
            }
            updatedData.thumbnail = `/uploads/products/${req.file.filename}`;
        }

        const updatedProduct = await Product.findByIdAndUpdate(productId, updatedData, { new: true });

        if (hasVariants) {
            // Xóa tất cả các biến thể hiện tại
            await DetailsVariant.deleteMany({ productId });
            
            // Thêm các biến thể mới đã lọc bỏ trùng lặp
            const detailsVariants = await DetailsVariant.insertMany(
                parsedVariantDetails.map((detail) => ({
                    productId: updatedProduct._id,
                    variantDetails: detail.variantDetails,
                    price: Number(detail.price),
                    inventory: Number(detail.inventory),
                }))
            );
            updatedProduct.detailsVariants = detailsVariants.map((d) => d._id);
        } else {
            updatedProduct.detailsVariants = [];
            await DetailsVariant.deleteMany({ productId });
        }

        await updatedProduct.save();

        console.log("Sản phẩm đã được cập nhật thành công", {
            productId,
            productName: updatedProduct.name,
            variantsCount: parsedVariantDetails.length
        });

        res.status(200).json({
            status: "Ok",
            message: "Sản phẩm đã được cập nhật thành công",
            data: updatedProduct,
        });
    } catch (error) {
        console.error("Lỗi khi cập nhật sản phẩm:", {
            productId: req.params.productId,
            body: req.body,
            errorMessage: error.message,
            stack: error.stack,
        });
        res.status(500).json({
            status: "Error",
            message: "Lỗi khi cập nhật sản phẩm: " + error.message,
        });
    }
};

// Xóa sản phẩm
const deleteProduct = async (req, res) => {
    try {
        console.log("Bắt đầu xóa sản phẩm", { productId: req.params.productId });

        const { productId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            console.warn("ID sản phẩm không hợp lệ", { productId });
            return res.status(400).json({
                status: "Error",
                message: "ID sản phẩm không hợp lệ",
            });
        }

        const product = await Product.findById(productId);
        if (!product) {
            console.warn("Sản phẩm không tồn tại", { productId });
            return res.status(404).json({
                status: "Error",
                message: "Không tìm thấy sản phẩm",
            });
        }

        if (product.thumbnail) {
            const imagePath = path.join(__dirname, "../public", product.thumbnail);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
                console.log("Xóa file ảnh thành công", { imagePath });
            }
        }

        await DetailsVariant.deleteMany({ productId });
        await Product.findByIdAndDelete(productId);

        console.log("Sản phẩm đã được xóa thành công", {
            productId,
            productName: product.name,
        });

        res.status(200).json({
            status: "Ok",
            message: "Sản phẩm đã được xóa thành công",
        });
    } catch (error) {
        console.error("Lỗi khi xóa sản phẩm:", {
            productId: req.params.productId,
            errorMessage: error.message,
            stack: error.stack,
        });
        res.status(500).json({
            status: "Error",
            message: "Lỗi khi xóa sản phẩm: " + error.message,
        });
    }
};

// Lấy thông tin bán hàng của sản phẩm
const getProductSales = async (req, res) => {
    try {
        const products = await Product.find()
            .populate("providerId")
            .populate("category")
            .populate("detailsVariants");

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
            if (product.hasVariants && product.detailsVariants && product.detailsVariants.length > 0) {
                totalInventory = product.detailsVariants.reduce((sum, variant) => sum + (variant.inventory || 0), 0);
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