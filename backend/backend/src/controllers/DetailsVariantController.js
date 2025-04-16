const mongoose = require("mongoose");
const DetailsVariant = require("../models/DetailsVariant");
const Variant = require("../models/Variant");
const Product = require("../models/Product");
const TypeProduct = require("../models/TypeProduct");

// Lấy tất cả chi tiết biến thể
const getAllDetailsVariants = async (req, res) => {
  try {
    console.log("Bắt đầu lấy danh sách chi tiết biến thể");
    const detailsVariants = await DetailsVariant.find()
      .populate({
        path: "productId",
        populate: { path: "providerId" },
      })
      .populate("variantDetails.variantId")
      .lean();

    console.log(`Tìm thấy ${detailsVariants.length} chi tiết biến thể`);
    res.status(200).json({
      status: "Ok",
      data: detailsVariants,
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách chi tiết biến thể:", {
      errorMessage: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      status: "Error",
      message: "Lỗi khi lấy danh sách chi tiết biến thể: " + error.message,
    });
  }
};

// Lấy chi tiết biến thể theo productId
const getDetailsByProduct = async (req, res) => {
  try {
    console.log("Bắt đầu lấy chi tiết biến thể theo productId", {
      productId: req.params.productId,
    });

    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      console.warn("ID sản phẩm không hợp lệ", { productId });
      return res.status(400).json({
        status: "Error",
        message: "ID sản phẩm không hợp lệ",
      });
    }

    const product = await Product.findById(productId).lean();
    if (!product) {
      console.warn("Sản phẩm không tồn tại", { productId });
      return res.status(404).json({
        status: "Error",
        message: "Sản phẩm không tồn tại",
      });
    }

    const detailsVariants = await DetailsVariant.find({ productId })
      .populate("variantDetails.variantId")
      .lean();

    console.log(`Tìm thấy ${detailsVariants.length} chi tiết biến thể cho productId: ${productId}`);
    res.status(200).json({
      status: "Ok",
      data: detailsVariants,
    });
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết biến thể theo productId:", {
      productId: req.params.productId,
      errorMessage: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      status: "Error",
      message: "Lỗi khi lấy chi tiết biến thể theo productId: " + error.message,
    });
  }
};

// Thêm chi tiết biến thể
const addDetailsVariant = async (req, res) => {
  try {
      console.log("Bắt đầu thêm chi tiết biến thể", { body: req.body });

      const { productId, variantDetails, price, inventory } = req.body;

      if (!productId || !variantDetails || !Array.isArray(variantDetails) || !price || !inventory) {
          console.warn("Dữ liệu đầu vào không hợp lệ", { productId, variantDetails, price, inventory });
          return res.status(400).json({
              status: "Error",
              message: "Product ID, chi tiết biến thể, giá và số lượng là bắt buộc",
          });
      }

      if (price < 0 || inventory < 0) {
          console.warn("Giá hoặc tồn kho không hợp lệ", { price, inventory });
          return res.status(400).json({
              status: "Error",
              message: "Giá và tồn kho phải là số không âm",
          });
      }

      if (!mongoose.Types.ObjectId.isValid(productId)) {
          console.warn("ID sản phẩm không hợp lệ", { productId });
          return res.status(400).json({
              status: "Error",
              message: "ID sản phẩm không hợp lệ",
          });
      }

      const product = await Product.findById(productId).populate({
          path: "category",
          populate: "variants",
      });
      if (!product) {
          console.warn("Sản phẩm không tồn tại", { productId });
          return res.status(404).json({
              status: "Error",
              message: "Sản phẩm không tồn tại",
          });
      }

      for (const detail of variantDetails) {
          if (!product.category.variants.some((v) => v._id.toString() === detail.variantId)) {
              console.warn("Biến thể không thuộc danh mục", { variantId: detail.variantId, category: product.category._id });
              return res.status(400).json({
                  status: "Error",
                  message: `Biến thể ${detail.variantId} không thuộc danh mục ${product.category._id}`,
              });
          }

          const variant = await Variant.findById(detail.variantId);
          if (!variant || !variant.values.includes(detail.value)) {
              console.warn("Giá trị biến thể không hợp lệ", { variantId: detail.variantId, value: detail.value });
              return res.status(400).json({
                  status: "Error",
                  message: `Giá trị '${detail.value}' không hợp lệ cho biến thể '${detail.variantId}'`,
              });
          }
      }

      const newDetailsVariant = await DetailsVariant.create({
          productId,
          variantDetails,
          price: Number(price),
          inventory: Number(inventory),
      });

      product.detailsVariants.push(newDetailsVariant._id);
      product.hasVariants = true;
      await product.save();

      console.log("Chi tiết biến thể đã được thêm thành công", {
          productId,
          detailsVariantId: newDetailsVariant._id,
      });
      res.status(201).json({
          status: "Ok",
          message: "Chi tiết biến thể được thêm thành công",
          data: newDetailsVariant,
      });
  } catch (error) {
      console.error("Lỗi khi thêm chi tiết biến thể:", {
          body: req.body,
          errorMessage: error.message,
          stack: error.stack,
      });
      res.status(500).json({
          status: "Error",
          message: "Lỗi khi thêm chi tiết biến thể: " + error.message,
      });
  }
}; 

// Cập nhật chi tiết biến thể
const updateDetailsVariant = async (req, res) => {
  try {
    console.log("Bắt đầu cập nhật chi tiết biến thể", {
      detailsVariantId: req.params.detailsVariantId,
      body: req.body,
    });

    const { detailsVariantId } = req.params;
    const { productId, variantDetails, price, compareAtPrice, inventory } = req.body;

    if (!mongoose.Types.ObjectId.isValid(detailsVariantId)) {
      console.warn("ID chi tiết biến thể không hợp lệ", { detailsVariantId });
      return res.status(400).json({
        status: "Error",
        message: "ID chi tiết biến thể không hợp lệ",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      console.warn("ID sản phẩm không hợp lệ", { productId });
      return res.status(400).json({
        status: "Error",
        message: "ID sản phẩm không hợp lệ",
      });
    }

    const product = await Product.findById(productId).populate({
      path: "category",
      populate: "variants",
    });
    if (!product) {
      console.warn("Sản phẩm không tồn tại", { productId });
      return res.status(404).json({
        status: "Error",
        message: "Sản phẩm không tồn tại",
      });
    }

    if (!variantDetails || !Array.isArray(variantDetails) || !price || !inventory) {
      console.warn("Dữ liệu đầu vào không hợp lệ", { variantDetails, price, inventory });
      return res.status(400).json({
        status: "Error",
        message: "Chi tiết biến thể, giá và số lượng là bắt buộc",
      });
    }

    if (price < 0 || inventory < 0) {
      console.warn("Giá hoặc tồn kho không hợp lệ", { price, inventory });
      return res.status(400).json({
        status: "Error",
        message: "Giá và tồn kho phải là số không âm",
      });
    }

    for (const detail of variantDetails) {
      if (!product.category.variants.some((v) => v._id.toString() === detail.variantId)) {
        console.warn("Biến thể không thuộc danh mục", { variantId: detail.variantId, category: product.category._id });
        return res.status(400).json({
          status: "Error",
          message: `Biến thể ${detail.variantId} không thuộc danh mục ${product.category._id}`,
        });
      }

      const variant = await Variant.findById(detail.variantId);
      if (!variant.values.includes(detail.value)) {
        console.warn("Giá trị biến thể không hợp lệ", { variantId: detail.variantId, value: detail.value });
        return res.status(400).json({
          status: "Error",
          message: `Giá trị '${detail.value}' không hợp lệ cho biến thể '${detail.variantId}'`,
        });
      }
    }

    const updatedDetailsVariant = await DetailsVariant.findByIdAndUpdate(
      detailsVariantId,
      {
        productId,
        variantDetails,
        price: Number(price),
        inventory: Number(inventory),
        compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
      },
      { new: true, runValidators: true }
    );

    if (!updatedDetailsVariant) {
      console.warn("Chi tiết biến thể không tồn tại", { detailsVariantId });
      return res.status(404).json({
        status: "Error",
        message: "Chi tiết biến thể không tồn tại",
      });
    }

    console.log("Chi tiết biến thể đã được cập nhật thành công", { detailsVariantId });
    res.status(200).json({
      status: "Ok",
      message: "Chi tiết biến thể đã được cập nhật thành công",
      data: updatedDetailsVariant,
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật chi tiết biến thể:", {
      detailsVariantId: req.params.detailsVariantId,
      body: req.body,
      errorMessage: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      status: "Error",
      message: "Lỗi khi cập nhật chi tiết biến thể: " + error.message,
    });
  }
};

// Xóa chi tiết biến thể
const deleteDetailsVariant = async (req, res) => {
  try {
    console.log("Bắt đầu xóa chi tiết biến thể", {
      detailsVariantId: req.params.detailsVariantId,
    });

    const { detailsVariantId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(detailsVariantId)) {
      console.warn("ID chi tiết biến thể không hợp lệ", { detailsVariantId });
      return res.status(400).json({
        status: "Error",
        message: "ID chi tiết biến thể không hợp lệ",
      });
    }

    const detailsVariant = await DetailsVariant.findById(detailsVariantId);
    if (!detailsVariant) {
      console.warn("Chi tiết biến thể không tồn tại", { detailsVariantId });
      return res.status(404).json({
        status: "Error",
        message: "Chi tiết biến thể không tồn tại",
      });
    }

    const product = await Product.findById(detailsVariant.productId);
    if (product) {
      product.detailsVariants = product.detailsVariants.filter(
        (id) => id.toString() !== detailsVariantId
      );
      product.hasVariants = product.detailsVariants.length > 0;
      await product.save();
    }

    await DetailsVariant.findByIdAndDelete(detailsVariantId);

    console.log("Chi tiết biến thể đã được xóa thành công", { detailsVariantId });
    res.status(200).json({
      status: "Ok",
      message: "Chi tiết biến thể đã được xóa thành công",
    });
  } catch (error) {
    console.error("Lỗi khi xóa chi tiết biến thể:", {
      detailsVariantId: req.params.detailsVariantId,
      errorMessage: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      status: "Error",
      message: "Lỗi khi xóa chi tiết biến thể: " + error.message,
    });
  }
};

module.exports = {
  getAllDetailsVariants,
  getDetailsByProduct,
  addDetailsVariant,
  updateDetailsVariant,
  deleteDetailsVariant,
};