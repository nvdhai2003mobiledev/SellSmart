const mongoose = require("mongoose");
const Variant = require("../models/Variant");
const Product = require("../models/Product");
const TypeProduct = require("../models/TypeProduct");

// Lấy danh sách biến thể dạng JSON
const getVariantsAsJson = async (req, res) => {
  try {
      console.log("Bắt đầu lấy danh sách biến thể dạng JSON", { query: req.query });
      const { page = 1, limit = 10, name, typeProductId } = req.query;
      const query = {};
      if (name) query.name = { $regex: name, $options: "i" };
      if (typeProductId && mongoose.Types.ObjectId.isValid(typeProductId)) {
          query.typeProductId = typeProductId;
      } else if (typeProductId) {
          console.warn("ID danh mục không hợp lệ trong query", { typeProductId });
          return res.status(400).json({
              status: "Error",
              message: "ID danh mục không hợp lệ",
          });
      }

      const variants = await Variant.find(query)
          .populate("typeProductId")
          .skip((page - 1) * limit)
          .limit(Number(limit))
          .lean();

      const total = await Variant.countDocuments(query);

      console.log(`Tìm thấy ${variants.length} biến thể, tổng: ${total}`);
      res.status(200).json({
          status: "Ok",
          data: variants,
          total,
          page: Number(page),
          limit: Number(limit),
      });
  } catch (error) {
      console.error("Lỗi khi lấy danh sách biến thể dạng JSON:", {
          query: req.query,
          errorMessage: error.message,
          stack: error.stack,
      });
      res.status(500).json({
          status: "Error",
          message: "Lỗi khi lấy danh sách biến thể: " + error.message,
      });
  }
};
// Thêm biến thể
const addVariant = async (req, res) => {
    try {
        console.log("Bắt đầu thêm biến thể", { body: req.body });
        const { name, typeProductId, values } = req.body;

        if (!name || !typeProductId || !values || !Array.isArray(values) || values.length === 0) {
            console.warn("Dữ liệu đầu vào không hợp lệ", { name, typeProductId, values });
            return res.status(400).json({
                status: "Error",
                message: "Tên, danh mục và giá trị biến thể là bắt buộc",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(typeProductId)) {
            console.warn("ID danh mục không hợp lệ", { typeProductId });
            return res.status(400).json({
                status: "Error",
                message: "ID danh mục không hợp lệ",
            });
        }

        const typeProduct = await TypeProduct.findById(typeProductId);
        if (!typeProduct) {
            console.warn("Danh mục không tồn tại", { typeProductId });
            return res.status(404).json({
                status: "Error",
                message: "Danh mục không tồn tại",
            });
        }


        const newVariant = new Variant({
            name,
            typeProductId,
            values,
        });

        const savedVariant = await newVariant.save();
        typeProduct.variants.push(savedVariant._id);
        await typeProduct.save();

        console.log("Thêm biến thể thành công", { variantId: savedVariant._id, variantName: savedVariant.name });
        res.status(201).json({
            status: "Ok",
            message: "Thêm biến thể thành công",
            data: savedVariant,
        });
    } catch (error) {
        console.error("Lỗi khi thêm biến thể:", {
            body: req.body,
            errorMessage: error.message,
            stack: error.stack,
        });
        res.status(500).json({
            status: "Error",
            message: "Lỗi khi thêm biến thể: " + error.message,
        });
    }
};

// Cập nhật biến thể
const updateVariant = async (req, res) => {
    try {
        console.log("Bắt đầu cập nhật biến thể", { variantId: req.params.variantId, body: req.body });
        const { variantId } = req.params;
        const { name, typeProductId, values } = req.body;

        if (!mongoose.Types.ObjectId.isValid(variantId)) {
            console.warn("ID biến thể không hợp lệ", { variantId });
            return res.status(400).json({
                status: "Error",
                message: "ID biến thể không hợp lệ",
            });
        }

        if (!name || !typeProductId || !values || !Array.isArray(values) || values.length === 0) {
            console.warn("Dữ liệu đầu vào không hợp lệ", { name, typeProductId, values });
            return res.status(400).json({
                status: "Error",
                message: "Tên, danh mục và giá trị biến thể là bắt buộc",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(typeProductId)) {
            console.warn("ID danh mục không hợp lệ", { typeProductId });
            return res.status(400).json({
                status: "Error",
                message: "ID danh mục không hợp lệ",
            });
        }

        const variant = await Variant.findById(variantId);
        if (!variant) {
            console.warn("Biến thể không tồn tại", { variantId });
            return res.status(404).json({
                status: "Error",
                message: "Không tìm thấy biến thể",
            });
        }

        const typeProduct = await TypeProduct.findById(typeProductId);
        if (!typeProduct) {
            console.warn("Danh mục không tồn tại", { typeProductId });
            return res.status(404).json({
                status: "Error",
                message: "Danh mục không tồn tại",
            });
        }

        const oldTypeProductId = variant.typeProductId.toString();
        
        // Kiểm tra xem đã có biến thể nào có cùng tên trong cùng danh mục mới không
        // (ngoại trừ biến thể hiện tại đang cập nhật)
        if (name !== variant.name || typeProductId !== oldTypeProductId) {
            const existingVariant = await Variant.findOne({
                name: name,
                typeProductId: typeProductId,
                _id: { $ne: variantId } // Loại trừ biến thể hiện tại
            });
            
        }

        variant.name = name;
        variant.typeProductId = typeProductId;
        variant.values = values;

        const updatedVariant = await variant.save();

        if (oldTypeProductId !== typeProductId) {
            await TypeProduct.findByIdAndUpdate(oldTypeProductId, {
                $pull: { variants: variantId },
            });
            typeProduct.variants.push(variantId);
            await typeProduct.save();
        }

        console.log("Cập nhật biến thể thành công", { variantId, variantName: updatedVariant.name });
        res.status(200).json({
            status: "Ok",
            message: "Cập nhật biến thể thành công",
            data: updatedVariant,
        });
    } catch (error) {
        console.error("Lỗi khi cập nhật biến thể:", {
            variantId: req.params.variantId,
            body: req.body,
            errorMessage: error.message,
            stack: error.stack,
        });
        res.status(500).json({
            status: "Error",
            message: "Lỗi khi cập nhật biến thể: " + error.message,
        });
    }
};

// Xóa biến thể
const deleteVariant = async (req, res) => {
    try {
        console.log("Bắt đầu xóa biến thể", { variantId: req.params.variantId });
        const { variantId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(variantId)) {
            console.warn("ID biến thể không hợp lệ", { variantId });
            return res.status(400).json({
                status: "Error",
                message: "ID biến thể không hợp lệ",
            });
        }

        const variant = await Variant.findById(variantId);
        if (!variant) {
            console.warn("Biến thể không tồn tại", { variantId });
            return res.status(404).json({
                status: "Error",
                message: "Không tìm thấy biến thể",
            });
        }

        // Kiểm tra xem biến thể có được sử dụng trong sản phẩm không
        const productsUsingVariant = await Product.find({
            "detailsVariants.variantDetails.variantId": variantId,
        });
        if (productsUsingVariant.length > 0) {
            console.warn("Biến thể đang được sử dụng trong sản phẩm", { variantId, productCount: productsUsingVariant.length });
            return res.status(400).json({
                status: "Error",
                message: "Không thể xóa biến thể vì đang được sử dụng trong sản phẩm",
            });
        }

        await TypeProduct.findByIdAndUpdate(variant.typeProductId, {
            $pull: { variants: variantId },
        });

        await Variant.findByIdAndDelete(variantId);

        console.log("Xóa biến thể thành công", { variantId, variantName: variant.name });
        res.status(200).json({
            status: "Ok",
            message: "Xóa biến thể thành công",
        });
    } catch (error) {
        console.error("Lỗi khi xóa biến thể:", {
            variantId: req.params.variantId,
            errorMessage: error.message,
            stack: error.stack,
        });
        res.status(500).json({
            status: "Error",
            message: "Lỗi khi xóa biến thể: " + error.message,
        });
    }
};

module.exports = {
    getVariantsAsJson,
    addVariant,
    updateVariant,
    deleteVariant,
};