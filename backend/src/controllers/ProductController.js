const productService = require("../services/ProductService");
const Product = require("../models/Product");

// Lấy danh sách sản phẩm
const getProduct = async (req, res) => {
  try {
    const products = await Product.find(); // Lấy tất cả sản phẩm

    // Nếu request là API (kiểm tra path hoặc header)
    if (
      req.path.includes("/json") ||
      req.headers.accept === "application/json"
    ) {
      return res.json(products); // Trả về JSON nếu là API request
    }

    // Render view cho giao diện web
    res.render("product", { products: products }); // Render file product.ejs với dữ liệu products

    res.render("product", { products });
  } catch (error) {
    console.error(error); // Ghi log lỗi
    res.status(500).json({ message: "Lỗi khi lấy danh sách sản phẩm" });
  }
};
const getProductAsJson = async (req, res) => {
  try {
    const products = await Product.find();
    console.log("Fetched Products:", products); // Log danh sách sản phẩm để kiểm tra
    res.json(products); // Gửi danh sách sản phẩm dưới dạng JSON
  } catch (error) {
    console.error("Error fetching products:", error); // Log lỗi cụ thể
    if (!res.headersSent) {
      res.status(500).json({ message: "Lỗi khi lấy danh sách sản phẩm" });
    }
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
      stockQuantity,
      status,
      attributes,
    } = req.body;

    // Kiểm tra input
    if (
      !name ||
      !price ||
      !thumbnail ||
      !description ||
      !category ||
      !stockQuantity ||
      !status
    ) {
      return res.status(400).json({
        status: "ERR",
        message: "The input is required",
      });
    }

    const result = await productService.addProduct(req.body);
    if (result.status === "Error") {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (e) {
    console.error("Error:", e);
    return res.status(500).json({
      message: e.message || "An error occurred",
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
        status: "ERR",
        message: "Product ID is required",
      });
    }

    const result = await productService.updateProduct(productId, updatedData);
    return res.status(result.status === "Error" ? 400 : 200).json(result);
  } catch (e) {
    console.error("Error:", e);
    return res.status(500).json({
      message: e.message || "An error occurred",
    });
  }
};

// Xóa sản phẩm
const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({
        status: "ERR",
        message: "Product ID is required",
      });
    }

    const result = await productService.deleteProduct(productId);
    return res.status(result.status === "Error" ? 400 : 200).json(result);
  } catch (e) {
    console.error("Error:", e);
    return res.status(500).json({
      message: e.message || "An error occurred",
    });
  }
};

module.exports = {
  getProduct,
  getProductAsJson,
  addProduct,
  updateProduct,
  deleteProduct,
};