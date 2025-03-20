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
        const products = await Product.find();
        const productsWithVariants = await Promise.all(
            products.map(async (product) => {
                const productObj = product.toObject();
                if (product.hasVariants) {
                    const detailsVariants = await DetailsVariant.find({ productId: product._id });
                    productObj.detailsVariants = detailsVariants;
                }
                return productObj;
            })
        );

        if (req.path.includes("/json") || req.headers.accept === "application/json") {
            return res.json({ products: productsWithVariants });
        }

        res.render("dashboard/products", {
            products: productsWithVariants,
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
                if (product.hasVariants) {
                    const detailsVariants = await DetailsVariant.find({ productId: product._id });
                    productObj.detailsVariants = detailsVariants;
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
        if (!mongoose.Types.ObjectId.isValid(productId)) {
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
        if (product.hasVariants) {
            const detailsVariants = await DetailsVariant.find({ productId: product._id });
            productObj.detailsVariants = detailsVariants;
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

// Cấu hình multer để lưu file ảnh
const uploadDir = path.join(__dirname, "../public/images");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});
const upload = multer({ storage: storage });

// Thêm sản phẩm
const addProduct = async (req, res) => {
    try {
        const { name, category, status, variantDetails } = req.body;
        if (!name || !category) {
            return res.status(400).json({
                status: "Error",
                message: "Tên và danh mục sản phẩm là bắt buộc",
            });
        }

        const thumbnail = req.file ? `/images/${req.file.filename}` : "";
        const parsedVariantDetails = variantDetails ? JSON.parse(variantDetails) : [];

        const newProduct = new Product({
            name,
            thumbnail,
            category,
            status: status || "available",
            hasVariants: parsedVariantDetails.length > 0,
        });

        const savedProduct = await newProduct.save();

        if (parsedVariantDetails.length > 0) {
            const detailsVariants = parsedVariantDetails.map(detail => ({
                productId: savedProduct._id,
                variantDetails: detail.variantDetails, // Mảng các { variantId, value }
                price: detail.price,
                compareAtPrice: detail.compareAtPrice,
                inventory: detail.inventory,
            }));
            await DetailsVariant.insertMany(detailsVariants);
        }

        res.status(201).json({
            status: "Ok",
            message: "Sản phẩm đã được thêm thành công",
            data: savedProduct,
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
        const { name, category, status, variantDetails } = req.body;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
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

        const updatedData = { name, category, status };
        const parsedVariantDetails = variantDetails ? JSON.parse(variantDetails) : [];

        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            { ...updatedData, hasVariants: parsedVariantDetails.length > 0 },
            { new: true }
        );

        if (parsedVariantDetails.length > 0) {
            await DetailsVariant.deleteMany({ productId });
            const detailsVariants = parsedVariantDetails.map(detail => ({
                productId,
                variantDetails: detail.variantDetails,
                price: detail.price,
                compareAtPrice: detail.compareAtPrice,
                inventory: detail.inventory,
            }));
            await DetailsVariant.insertMany(detailsVariants);
        }

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
        if (!mongoose.Types.ObjectId.isValid(productId)) {
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

        await DetailsVariant.deleteMany({ productId });

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

module.exports = {
    getProduct,
    getProductAsJson,
    getProductById,
    addProduct: [upload.single("thumbnail"), addProduct],
    updateProduct,
    deleteProduct,
};