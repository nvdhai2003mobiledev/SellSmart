const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Product = require("../models/Product");
const Variant = require("../models/Variant");
const DetailsVariant = require("../models/DetailsVariant");
const TypeProduct = require("../models/TypeProduct");

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

        console.log(`Tìm thấy ${products.length} sản phẩm`);

        if (req.path.includes("/json") || req.headers.accept === "application/json") {
            console.log("Trả về danh sách sản phẩm dạng JSON");
            return res.json({ status: "Ok", data: products });
        }

        console.log("Render trang dashboard/products");
        res.render("dashboard/products", {
            products,
            page: "products",
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
            userId: req.user?._id,
            userRole: req.user?.role,
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
            userId: req.user?._id,
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
    destination: (req, file, cb) => {
        console.log("Cấu hình đích lưu file ảnh", { uploadDir });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const filename = Date.now() + path.extname(file.originalname);
        console.log("Tạo tên file ảnh", {
            originalName: file.originalname,
            newFilename: filename,
        });
        cb(null, filename);
    },
});
const upload = multer({ storage: storage });

// Thêm sản phẩm
const addProduct = async (req, res) => {
    try {
        console.log("Bắt đầu thêm sản phẩm mới", {
            body: req.body,
            file: req.file,
        });

        const { name, category, providerId, status, variantDetails, price, inventory } = req.body;

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

        const thumbnail = req.file ? `/images/${req.file.filename}` : "";
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

        console.log("Sản phẩm đã được thêm thành công", {
            productId: savedProduct._id,
            productName: savedProduct.name,
            variantsCount: parsedVariantDetails.length
        });

        res.status(201).json({
            status: "Ok",
            message: "Sản phẩm đã được thêm thành công",
            data: savedProduct,
        });
    } catch (error) {
        console.error("Lỗi khi thêm sản phẩm:", {
            body: req.body,
            file: req.file,
            errorMessage: error.message,
            stack: error.stack,
        });
        res.status(500).json({
            status: "Error",
            message: "Lỗi khi thêm sản phẩm: " + error.message,
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
            updatedData.thumbnail = `/images/${req.file.filename}`;
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

module.exports = {
    getProduct,
    getProductAsJson,
    getProductById,
    getVariantsPage,
    addProduct: [upload.single("thumbnail"), addProduct],
    updateProduct: [upload.single("thumbnail"), updateProduct],
    deleteProduct,
};