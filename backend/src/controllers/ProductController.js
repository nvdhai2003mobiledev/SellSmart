const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Product = require("../models/Product");
const Variant = require("../models/Variant");
const DetailsVariant = require("../models/DetailsVariant");

// Lấy danh sách sản phẩm
const getProduct = async (req, res) => {
  try {
    console.log("Bắt đầu lấy danh sách sản phẩm", {
      path: req.path,
      acceptHeader: req.headers.accept,
    });
    const products = await Product.find().populate("providerId").lean();

    // Populate thông tin biến thể trong variants và lấy từ DetailsVariant
    for (let product of products) {
      if (
        product.hasVariants &&
        product.variants &&
        product.variants.length > 0
      ) {
        for (let variant of product.variants) {
          for (let detail of variant.variantDetails) {
            const variantData = await Variant.findById(detail.variantId).lean();
            detail.variantName = variantData ? variantData.name : "Unknown";
          }
        }
      }
      // Lấy chi tiết biến thể từ DetailsVariant
      const detailsVariants = await DetailsVariant.find({
        productId: product._id,
      }).lean();
      product.detailsVariants = detailsVariants;
    }

    console.log(`Tìm thấy ${products.length} sản phẩm`);

    if (
      req.path.includes("/json") ||
      req.headers.accept === "application/json"
    ) {
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

    const products = await Product.find().populate("providerId").lean();

    console.log(`Tìm thấy ${products.length} sản phẩm`);

    // Populate thông tin biến thể
    for (let product of products) {
      if (
        product.hasVariants &&
        product.variants &&
        product.variants.length > 0
      ) {
        for (let variant of product.variants) {
          for (let detail of variant.variantDetails) {
            const variantData = await Variant.findById(detail.variantId).lean();
            detail.variantName = variantData ? variantData.name : "Unknown";
          }
        }
      }
      // Lấy chi tiết biến thể từ DetailsVariant
      const detailsVariants = await DetailsVariant.find({
        productId: product._id,
      }).lean();
      product.detailsVariants = detailsVariants;
    }

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
  try {
    console.log("Bắt đầu lấy sản phẩm theo ID", {
      productId: req.params.productId,
    });

    const { productId } = req.params;

    if (!productId) {
      console.warn("Không có productId được cung cấp");
      return res.status(200).json({
        status: "Ok",
        data: null,
      });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      console.warn("ID sản phẩm không hợp lệ", { productId });
      return res.status(400).json({
        status: "Error",
        message: "ID sản phẩm không hợp lệ",
      });
    }

    const product = await Product.findById(productId)
      .populate("providerId")
      .lean();

    if (!product) {
      console.warn("Sản phẩm không tồn tại", { productId });
      return res.status(404).json({
        status: "Error",
        message: "Không tìm thấy sản phẩm",
      });
    }

    // Populate thông tin biến thể
    if (
      product.hasVariants &&
      product.variants &&
      product.variants.length > 0
    ) {
      for (let variant of product.variants) {
        for (let detail of variant.variantDetails) {
          const variantData = await Variant.findById(detail.variantId).lean();
          detail.variantName = variantData ? variantData.name : "Unknown";
        }
      }
    }

    // Lấy chi tiết biến thể từ DetailsVariant
    const detailsVariants = await DetailsVariant.find({
      productId: product._id,
    }).lean();
    product.detailsVariants = detailsVariants;

    console.log("Tìm thấy sản phẩm", { productId, productName: product.name });
    res.json({
      status: "Ok",
      data: product,
    });
  } catch (error) {
    console.error("Lỗi khi lấy thông tin sản phẩm:", {
      productId: req.params.productId,
      errorMessage: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      status: "Error",
      message: "Lỗi khi lấy thông tin sản phẩm: " + error.message,
    });
  }
};

// Thêm hàm xử lý route /products/getbienthe
const getVariantsPage = async (req, res) => {
  try {
    console.log("Bắt đầu lấy trang biến thể", { query: req.query });
    const variants = await Variant.find().lean();
    console.log(`Tìm thấy ${variants.length} biến thể`);

    res.render("dashboard/variants", {
      product: null,
      variants,
      selectedVariantId: req.query.selectedVariantId || null,
      page: "variants",
      admin: req.user || null,
    });
    console.log("Render trang dashboard/variants thành công");
  } catch (error) {
    console.error("Lỗi khi lấy trang biến thể:", {
      query: req.query,
      errorMessage: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      status: "Error",
      message: "Lỗi khi lấy trang biến thể: " + error.message,
    });
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

    const {
      name,
      category,
      providerId,
      status,
      variantDetails,
      price,
      inventory,
    } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!name || !category || !providerId) {
      console.warn("Dữ liệu đầu vào không hợp lệ", {
        name,
        category,
        providerId,
      });
      return res.status(400).json({
        status: "Error",
        message: "Tên, danh mục và nhà cung cấp là bắt buộc",
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
    console.log("Xử lý thumbnail", { thumbnail });

    let parsedVariantDetails = [];
    let hasVariants = false;

    // Kiểm tra và parse variantDetails
    if (variantDetails) {
      try {
        parsedVariantDetails = JSON.parse(variantDetails);
        if (!Array.isArray(parsedVariantDetails)) {
          throw new Error("variantDetails phải là một mảng");
        }
        hasVariants = parsedVariantDetails.length > 0;
      } catch (error) {
        console.warn("Lỗi khi parse variantDetails", { error: error.message });
        return res.status(400).json({
          status: "Error",
          message: "Dữ liệu variantDetails không hợp lệ: " + error.message,
        });
      }
    }

    console.log("Kiểm tra biến thể", { hasVariants, parsedVariantDetails });

    if (!hasVariants) {
      if (!price || !inventory || price < 0 || inventory < 0) {
        console.warn("Giá và số lượng không hợp lệ khi không có biến thể", {
          price,
          inventory,
        });
        return res.status(400).json({
          status: "Error",
          message: "Giá và số lượng phải là số không âm nếu không có biến thể",
        });
      }
    }

    // Kiểm tra variantDetails
    if (hasVariants) {
      for (const detail of parsedVariantDetails) {
        const variantDetailsArray = detail.variantDetails;
        if (
          !Array.isArray(variantDetailsArray) ||
          variantDetailsArray.length === 0
        ) {
          console.warn("variantDetails không hợp lệ", { detail });
          return res.status(400).json({
            status: "Error",
            message: "variantDetails không hợp lệ: phải là mảng không rỗng",
          });
        }

        for (const variantDetail of variantDetailsArray) {
          const variantId = variantDetail.variantId;
          const value = variantDetail.value;

          if (!mongoose.Types.ObjectId.isValid(variantId)) {
            console.warn("ID biến thể không hợp lệ", { variantId });
            return res.status(400).json({
              status: "Error",
              message: `ID biến thể không hợp lệ: ${variantId}`,
            });
          }

          const variant = await Variant.findById(variantId);
          if (!variant) {
            console.warn("Biến thể không tồn tại", { variantId });
            return res.status(404).json({
              status: "Error",
              message: `Biến thể không tồn tại: ${variantId}`,
            });
          }

          if (!variant.values.includes(value)) {
            console.warn("Giá trị biến thể không hợp lệ", { variantId, value });
            return res.status(400).json({
              status: "Error",
              message: `Giá trị '${value}' không hợp lệ cho biến thể '${variantId}'`,
            });
          }
        }

        if (
          detail.price === undefined ||
          detail.inventory === undefined ||
          detail.price < 0 ||
          detail.inventory < 0
        ) {
          console.warn("Giá hoặc tồn kho không hợp lệ", {
            price: detail.price,
            inventory: detail.inventory,
          });
          return res.status(400).json({
            status: "Error",
            message: "Giá và tồn kho phải là số không âm",
          });
        }
      }

      const variantCombinations = parsedVariantDetails.map((detail) =>
        detail.variantDetails
          .map((v) => `${v.variantId}:${v.value}`)
          .sort()
          .join("|")
      );
      const uniqueCombinations = new Set(variantCombinations);
      if (uniqueCombinations.size !== variantCombinations.length) {
        console.warn("Tổ hợp biến thể bị trùng lặp", { variantCombinations });
        return res.status(400).json({
          status: "Error",
          message: "Tổ hợp biến thể không được trùng lặp",
        });
      }
    }

    const newProduct = new Product({
      name,
      thumbnail,
      category,
      providerId,
      status: status || "available",
      hasVariants,
      variants: hasVariants
        ? parsedVariantDetails.map((detail) => ({
            variantDetails: detail.variantDetails,
            price: Number(detail.price),
            inventory: Number(detail.inventory),
          }))
        : [],
      price: hasVariants ? undefined : Number(price),
      inventory: hasVariants ? undefined : Number(inventory),
    });

    const savedProduct = await newProduct.save();

    // Đồng bộ với DetailsVariant
    if (hasVariants) {
      const detailsVariants = parsedVariantDetails.map((detail) => ({
        productId: savedProduct._id,
        variantDetails: detail.variantDetails,
        price: Number(detail.price),
        inventory: Number(detail.inventory),
      }));
      await DetailsVariant.insertMany(detailsVariants);
    }

    console.log("Sản phẩm đã được thêm thành công", {
      productId: savedProduct._id,
      productName: savedProduct.name,
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
    const {
      name,
      category,
      providerId,
      status,
      variantDetails,
      price,
      inventory,
    } = req.body;

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
      console.warn("Dữ liệu đầu vào không hợp lệ", {
        name,
        category,
        providerId,
      });
      return res.status(400).json({
        status: "Error",
        message: "Tên, danh mục và nhà cung cấp là bắt buộc",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(providerId)) {
      console.warn("ID nhà cung cấp không hợp lệ", { providerId });
      return res.status(400).json({
        status: "Error",
        message: "ID nhà cung cấp không hợp lệ",
      });
    }

    let parsedVariantDetails = [];
    let hasVariants = false;

    if (variantDetails) {
      try {
        parsedVariantDetails = JSON.parse(variantDetails);
        if (!Array.isArray(parsedVariantDetails)) {
          throw new Error("variantDetails phải là một mảng");
        }
        hasVariants = parsedVariantDetails.length > 0;
      } catch (error) {
        console.warn("Lỗi khi parse variantDetails", { error: error.message });
        return res.status(400).json({
          status: "Error",
          message: "Dữ liệu variantDetails không hợp lệ: " + error.message,
        });
      }
    }

    if (!hasVariants) {
      if (!price || !inventory || price < 0 || inventory < 0) {
        console.warn("Giá và số lượng không hợp lệ khi không có biến thể", {
          price,
          inventory,
        });
        return res.status(400).json({
          status: "Error",
          message: "Giá và số lượng phải là số không âm nếu không có biến thể",
        });
      }
    }

    if (hasVariants) {
      for (const detail of parsedVariantDetails) {
        const variantDetailsArray = detail.variantDetails;
        if (
          !Array.isArray(variantDetailsArray) ||
          variantDetailsArray.length === 0
        ) {
          console.warn("variantDetails không hợp lệ", { detail });
          return res.status(400).json({
            status: "Error",
            message: "variantDetails không hợp lệ: phải là mảng không rỗng",
          });
        }

        for (const variantDetail of variantDetailsArray) {
          const variantId = variantDetail.variantId;
          const value = variantDetail.value;

          if (!mongoose.Types.ObjectId.isValid(variantId)) {
            console.warn("ID biến thể không hợp lệ", { variantId });
            return res.status(400).json({
              status: "Error",
              message: `ID biến thể không hợp lệ: ${variantId}`,
            });
          }

          const variant = await Variant.findById(variantId);
          if (!variant) {
            console.warn("Biến thể không tồn tại", { variantId });
            return res.status(404).json({
              status: "Error",
              message: `Biến thể không tồn tại: ${variantId}`,
            });
          }

          if (!variant.values.includes(value)) {
            console.warn("Giá trị biến thể không hợp lệ", { variantId, value });
            return res.status(400).json({
              status: "Error",
              message: `Giá trị '${value}' không hợp lệ cho biến thể '${variantId}'`,
            });
          }
        }

        if (
          detail.price === undefined ||
          detail.inventory === undefined ||
          detail.price < 0 ||
          detail.inventory < 0
        ) {
          console.warn("Giá hoặc tồn kho không hợp lệ", {
            price: detail.price,
            inventory: detail.inventory,
          });
          return res.status(400).json({
            status: "Error",
            message: "Giá và tồn kho phải là số không âm",
          });
        }
      }

      const variantCombinations = parsedVariantDetails.map((detail) =>
        detail.variantDetails
          .map((v) => `${v.variantId}:${v.value}`)
          .sort()
          .join("|")
      );
      const uniqueCombinations = new Set(variantCombinations);
      if (uniqueCombinations.size !== variantCombinations.length) {
        console.warn("Tổ hợp biến thể bị trùng lặp", { variantCombinations });
        return res.status(400).json({
          status: "Error",
          message: "Tổ hợp biến thể không được trùng lặp",
        });
      }
    }

    const updatedData = {
      name,
      category,
      providerId,
      status,
      hasVariants,
      variants: hasVariants
        ? parsedVariantDetails.map((detail) => ({
            variantDetails: detail.variantDetails,
            price: Number(detail.price),
            inventory: Number(detail.inventory),
          }))
        : [],
      price: hasVariants ? undefined : Number(price),
      inventory: hasVariants ? undefined : Number(inventory),
    };

    if (req.file) {
      // Xóa file ảnh cũ nếu có
      if (product.thumbnail) {
        const oldImagePath = path.join(
          __dirname,
          "../public",
          product.thumbnail
        );
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
          console.log("Xóa file ảnh cũ thành công", { oldImagePath });
        }
      }
      updatedData.thumbnail = `/images/${req.file.filename}`;
      console.log("Cập nhật thumbnail", { thumbnail: updatedData.thumbnail });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      updatedData,
      { new: true, runValidators: true }
    );

    // Đồng bộ với DetailsVariant
    if (hasVariants) {
      // Xóa các DetailsVariant cũ
      await DetailsVariant.deleteMany({ productId });
      // Thêm mới DetailsVariant
      const detailsVariants = parsedVariantDetails.map((detail) => ({
        productId: updatedProduct._id,
        variantDetails: detail.variantDetails,
        price: Number(detail.price),
        inventory: Number(detail.inventory),
      }));
      await DetailsVariant.insertMany(detailsVariants);
    } else {
      // Nếu không có biến thể, xóa hết DetailsVariant
      await DetailsVariant.deleteMany({ productId });
    }

    console.log("Sản phẩm đã được cập nhật thành công", {
      productId,
      productName: updatedProduct.name,
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

    // Xóa file ảnh nếu có
    if (product.thumbnail) {
      const imagePath = path.join(__dirname, "../public", product.thumbnail);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log("Xóa file ảnh thành công", { imagePath });
      }
    }

    // Xóa các DetailsVariant liên quan
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
