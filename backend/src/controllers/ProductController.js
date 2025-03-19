const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs"); // Thêm import fs
const Product = require("../models/Product");
const Variant = require("../models/Variant");
const DetailsVariant = require("../models/DetailsVariant");

// Lấy danh sách sản phẩm
const getProduct = async (req, res) => {
  try {
    const products = await Product.find();
    const variants = await Variant.find();

    const productsWithVariants = await Promise.all(
      products.map(async (product) => {
        const productObj = product.toObject();

        if (product.hasVariants && product.attributes && product.attributes.length > 0) {
          const variantDetails = [];

          for (const attr of product.attributes) {
            if (attr.variantId) {
              const detailsVariants = await DetailsVariant.find({
                variantId: attr.variantId,
                value: { $in: attr.values },
              });

              variantDetails.push({
                name: attr.name,
                values: attr.values,
                variantId: attr.variantId,
                details: detailsVariants,
              });
            }
          }

          productObj.variantDetails = variantDetails;
        }

        return productObj;
      })
    );

    if (req.path.includes("/json") || req.headers.accept === "application/json") {
      return res.json({
        products: productsWithVariants,
        variants,
      });
    }

    res.render("dashboard/products", {
      products: productsWithVariants,
      variants,
      page: "products",
    });
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Lỗi khi lấy danh sách sản phẩm" });
    }
  }
};

// API JSON
const getProductAsJson = async (req, res) => {
  try {
    const products = await Product.find();

    const productsWithVariants = await Promise.all(
      products.map(async (product) => {
        const productObj = product.toObject();

        if (
          product.hasVariants &&
          product.attributes &&
          product.attributes.length > 0
        ) {
          const variantDetails = [];

          for (const attr of product.attributes) {
            if (attr.variantId) {
              const detailsVariants = await DetailsVariant.find({
                variantId: attr.variantId,
                value: { $in: attr.values },
              });

              variantDetails.push({
                name: attr.name,
                values: attr.values,
                variantId: attr.variantId,
                details: detailsVariants,
              });
            }
          }

          productObj.variantDetails = variantDetails;
        }

        return productObj;
      })
    );

    res.json(productsWithVariants);
  } catch (error) {
    console.error("Error fetching products:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Lỗi khi lấy danh sách sản phẩm" });
    }
  }
};

// Lấy sản phẩm theo ID
const getProductById = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        status: "Error",
        message: "ID sản phẩm không hợp lệ",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        status: "Error",
        message: "Không tìm thấy sản phẩm",
      });
    }

    const productObj = product.toObject();
    if (
      product.hasVariants &&
      product.attributes &&
      product.attributes.length > 0
    ) {
      const variantDetails = [];

      for (const attr of product.attributes) {
        if (attr.variantId) {
          const detailsVariants = await DetailsVariant.find({
            variantId: attr.variantId,
            value: { $in: attr.values },
          });

          variantDetails.push({
            name: attr.name,
            values: attr.values,
            variantId: attr.variantId,
            details: detailsVariants,
          });
        }
      }

      productObj.variantDetails = variantDetails;
    }

    res.json({
      status: "Ok",
      data: productObj,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      status: "Error",
      message: "Lỗi khi lấy thông tin sản phẩm",
      error: error.message,
    });
  }
};

// Đường dẫn thư mục uploads
const uploadDir = path.join(__dirname, "../public/images");

// Tạo thư mục uploads nếu chưa tồn tại
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình multer để lưu file ảnh
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Sử dụng đường dẫn tuyệt đối
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Đặt tên file duy nhất
  },
});
const upload = multer({ storage: storage });

// Thêm sản phẩm
const addProduct = async (req, res) => {
  try {
    const {
      name,
      category,
      status,
      selectedVariants,
    } = req.body;

    if (!name || !category) {
      return res.status(400).json({
        status: "Error",
        message: "Tên và danh mục sản phẩm là bắt buộc",
      });
    }

    // Lấy đường dẫn file ảnh từ multer
    const thumbnail = req.file ? `/images/${req.file.filename}` : ""; // Đổi /uploads thành /images để khớp với uploadDir

    const variantData = selectedVariants ? JSON.parse(selectedVariants) : [];
    let price = 0;
    let inventory = 0;
    const attributes = [];

    if (variantData.length > 0) {
      for (const variant of variantData) {
        const detailVariant = await DetailsVariant.findById(variant.detailsVariantId);
        if (detailVariant) {
          if (attributes.length === 0) {
            price = detailVariant.price || 0;
            inventory = detailVariant.inventory || 0;
          }
          attributes.push({
            variantId: variant.variantId,
            name: variant.variantName,
            values: [variant.detailValue],
          });
        }
      }
    }

    const newProduct = new Product({
      name,
      price,
      thumbnail,
      category,
      inventory,
      status: status || "available",
      attributes,
      hasVariants: attributes.length > 0,
    });

    await newProduct.save();

    res.status(201).json({
      status: "Ok",
      message: "Sản phẩm đã được thêm thành công",
      data: newProduct,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      status: "Error",
      message: error.message || "Đã xảy ra lỗi",
    });
  }
};

// Cập nhật sản phẩm
const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const updatedData = req.body;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        status: "Error",
        message: "ID sản phẩm không hợp lệ",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        status: "Error",
        message: "Không tìm thấy sản phẩm",
      });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
        ...updatedData,
        hasVariants: updatedData.attributes && updatedData.attributes.length > 0,
      },
      { new: true }
    );

    res.status(200).json({
      status: "Ok",
      message: "Sản phẩm đã được cập nhật thành công",
      data: updatedProduct,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      status: "Error",
      message: error.message || "Đã xảy ra lỗi",
    });
  }
};

// Xóa sản phẩm
const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        status: "Error",
        message: "ID sản phẩm không hợp lệ",
      });
    }

    const product = await Product.findByIdAndDelete(productId);
    if (!product) {
      return res.status(404).json({
        status: "Error",
        message: "Không tìm thấy sản phẩm",
      });
    }

    res.status(200).json({
      status: "Ok",
      message: "Sản phẩm đã được xóa thành công",
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      status: "Error",
      message: error.message || "Đã xảy ra lỗi",
    });
  }
};

// Thêm biến thể cho sản phẩm
const addProductVariant = async (req, res) => {
  try {
    const { productId } = req.params;
    const { variantId, name, values } = req.body;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        status: "Error",
        message: "ID sản phẩm không hợp lệ",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        status: "Error",
        message: "Không tìm thấy sản phẩm",
      });
    }

    const variant = await Variant.findById(variantId);
    if (!variant) {
      return res.status(404).json({
        status: "Error",
        message: "Không tìm thấy biến thể",
      });
    }

    product.attributes.push({ name, values, variantId });
    product.hasVariants = true;
    await product.save();

    res.status(200).json({
      status: "Ok",
      message: "Biến thể đã được thêm vào sản phẩm",
      data: product,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      status: "Error",
      message: error.message || "Đã xảy ra lỗi",
    });
  }
};

// Cập nhật chi tiết biến thể
const updateVariantDetail = async (req, res) => {
  try {
    const { detailId } = req.params;
    const updatedData = req.body;

    if (!detailId || !mongoose.Types.ObjectId.isValid(detailId)) {
      return res.status(400).json({
        status: "Error",
        message: "ID chi tiết biến thể không hợp lệ",
      });
    }

    const detailVariant = await DetailsVariant.findByIdAndUpdate(
      detailId,
      updatedData,
      { new: true }
    );
    if (!detailVariant) {
      return res.status(404).json({
        status: "Error",
        message: "Không tìm thấy chi tiết biến thể",
      });
    }

    res.status(200).json({
      status: "Ok",
      message: "Chi tiết biến thể đã được cập nhật",
      data: detailVariant,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      status: "Error",
      message: error.message || "Đã xảy ra lỗi",
    });
  }
};

module.exports = {
  getProduct,
  getProductAsJson,
  getProductById,
  addProduct: [upload.single("thumbnail"), addProduct],
  updateProduct,
  deleteProduct,
  addProductVariant,
  updateVariantDetail,
};