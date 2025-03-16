const productService = require("../services/ProductService");
const Product = require("../models/Product");
const Variant = require("../models/Variant");
const DetailsVariant = require("../models/DetailsVariant");

// Lấy danh sách sản phẩm
const getProduct = async (req, res) => {
  try {
    const products = await Product.find();
    const variants = await Variant.find();

    // Lấy thông tin chi tiết biến thể cho mỗi sản phẩm
    const productsWithVariants = await Promise.all(
      products.map(async (product) => {
        const productObj = product.toObject();

        // Chỉ xử lý nếu sản phẩm có biến thể
        if (
          product.hasVariants &&
          product.attributes &&
          product.attributes.length > 0
        ) {
          const variantDetails = [];

          for (const attr of product.attributes) {
            if (attr.variantId) {
              // Lấy chi tiết biến thể
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
      }),
    );

    try {
      console.log("Fetched Variants:", variants);
    } catch (e) {
      console.error("Error logging variants:", e);
    }

    // Nếu request là API
    if (
      req.path.includes("/json") ||
      req.headers.accept === "application/json"
    ) {
      return res.json({
        products: productsWithVariants,
        variants: variants,
      });
    }

    // Render view cho giao diện web
    res.render("dashboard/products", {
      products: productsWithVariants,
      variants: variants,
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

    // Lấy thông tin chi tiết biến thể cho mỗi sản phẩm
    const productsWithVariants = await Promise.all(
      products.map(async (product) => {
        const productObj = product.toObject();

        // Chỉ xử lý nếu sản phẩm có biến thể
        if (
          product.hasVariants &&
          product.attributes &&
          product.attributes.length > 0
        ) {
          const variantDetails = [];

          for (const attr of product.attributes) {
            if (attr.variantId) {
              // Lấy chi tiết biến thể
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
      }),
    );

    console.log("Fetched Products:", productsWithVariants);
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

    if (!productId) {
      return res.status(400).json({
        status: "Error",
        message: "ID sản phẩm là bắt buộc",
      });
    }

    // Thêm kiểm tra này
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        status: "Error",
        message: "ID sản phẩm không hợp lệ",
      });
    }

    const result = await productService.getProductWithVariants(productId);

    if (result.status === "Error") {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      status: "Error",
      message: "Lỗi khi lấy thông tin sản phẩm",
      error: error.message,
    });
  }
};

// Thêm sản phẩm
const addProduct = async (req, res) => {
  try {
    console.log("req.body", req.body);
    const {
      name,
      price,
      thumbnail,
      description,
      category,
      inventory,
      status,
      attributes,
    } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({
        status: "Error",
        message: "Tên, giá và danh mục sản phẩm là bắt buộc",
      });
    }

    const result = await productService.addProduct(req.body);
    return res.status(result.status === "Error" ? 400 : 200).json(result);
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
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

    if (!productId) {
      return res.status(400).json({
        status: "Error",
        message: "ID sản phẩm là bắt buộc",
      });
    }

    const result = await productService.updateProduct(productId, updatedData);
    return res.status(result.status === "Error" ? 400 : 200).json(result);
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      status: "Error",
      message: error.message || "Đã xảy ra lỗi",
    });
  }
};

// Xóa sản phẩm
const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({
        status: "Error",
        message: "ID sản phẩm là bắt buộc",
      });
    }

    const result = await productService.deleteProduct(productId);
    return res.status(result.status === "Error" ? 400 : 200).json(result);
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      status: "Error",
      message: error.message || "Đã xảy ra lỗi",
    });
  }
};

// Thêm biến thể cho sản phẩm
const addProductVariant = async (req, res) => {
  try {
    const { productId } = req.params;
    const variantData = req.body;

    if (!productId) {
      return res.status(400).json({
        status: "Error",
        message: "ID sản phẩm là bắt buộc",
      });
    }

    const result = await productService.addProductVariant(
      productId,
      variantData,
    );
    return res.status(result.status === "Error" ? 400 : 200).json(result);
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
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

    if (!detailId) {
      return res.status(400).json({
        status: "Error",
        message: "ID chi tiết biến thể là bắt buộc",
      });
    }

    const result = await productService.updateVariantDetail(
      detailId,
      updatedData,
    );
    return res.status(result.status === "Error" ? 400 : 200).json(result);
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      status: "Error",
      message: error.message || "Đã xảy ra lỗi",
    });
  }
};

module.exports = {
  getProduct,
  getProductAsJson,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct,
  addProductVariant,
  updateVariantDetail,
};
