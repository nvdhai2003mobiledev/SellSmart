const mongoose = require("mongoose");
const TypeProduct = require("../models/TypeProduct");
const Product = require("../models/Product");

// Lấy danh sách loại sản phẩm
const getTypes = async (req, res) => {
  try {
    const types = await TypeProduct.find().populate("variants");
    res.render("dashboard/typeproduct", {
      title: "Danh Mục",
      page: "typeproduct",
      types,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách loại sản phẩm" });
  }
};

// Lấy danh sách loại sản phẩm dưới dạng JSON
const getTypesAsJson = async (req, res) => {
  try {
    const types = await TypeProduct.find().populate("variants");
    res.status(200).json({
      status: "Ok",
      data: types,
    });
  } catch (error) {
    res.status(500).json({
      status: "Error",
      message: error.message,
    });
  }
};

// Thêm loại sản phẩm mới, kiểm tra trùng tên
const addType = async (req, res) => {
  try {
    console.log("Dữ liệu nhận được:", req.body);

    const { name } = req.body;
    if (!name) {
      return res.status(400).json({
        status: "Error",
        message: "Tên loại sản phẩm là bắt buộc",
      });
    }

    const existingType = await TypeProduct.findOne({ name: name.trim() });
    if (existingType) {
      return res.status(400).json({
        status: "Error",
        message: `Loại sản phẩm "${name}" đã tồn tại`,
      });
    }

    const newType = await TypeProduct.create({ name: name.trim(), variants: [] });

    res.status(201).json({
      status: "Ok",
      message: "Loại sản phẩm được tạo thành công",
      data: newType,
    });
  } catch (error) {
    console.error("Lỗi:", error);
    res.status(500).json({
      status: "Error",
      message: error.message,
    });
  }
};

// Cập nhật loại sản phẩm
const updateType = async (req, res) => {
  try {
    const { typeId } = req.params;
    const { name } = req.body;

    if (!mongoose.Types.ObjectId.isValid(typeId)) {
      return res.status(400).json({
        status: "Error",
        message: "ID loại sản phẩm không hợp lệ",
      });
    }

    if (!name) {
      return res.status(400).json({
        status: "Error",
        message: "Tên loại sản phẩm là bắt buộc",
      });
    }

    const existingType = await TypeProduct.findOne({
      name: name.trim(),
      _id: { $ne: typeId },
    });

    if (existingType) {
      return res.status(400).json({
        status: "Error",
        message: `Loại sản phẩm "${name}" đã tồn tại`,
      });
    }

    const updatedType = await TypeProduct.findByIdAndUpdate(
      typeId,
      { name: name.trim() },
      { new: true }
    );

    if (!updatedType) {
      return res.status(404).json({
        status: "Error",
        message: "Không tìm thấy loại sản phẩm",
      });
    }

    res.status(200).json({
      status: "Ok",
      message: "Loại sản phẩm đã được cập nhật",
      data: updatedType,
    });
  } catch (error) {
    console.error("Lỗi:", error);
    res.status(500).json({
      status: "Error",
      message: error.message,
    });
  }
};

// Xóa loại sản phẩm
const deleteType = async (req, res) => {
  try {
    const { typeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(typeId)) {
      return res.status(400).json({
        status: "Error",
        message: "ID loại sản phẩm không hợp lệ",
      });
    }

    const typeProduct = await TypeProduct.findById(typeId);
    if (!typeProduct) {
      return res.status(404).json({
        status: "Error",
        message: "Không tìm thấy loại sản phẩm",
      });
    }

    const productsUsingType = await Product.find({ category: typeId });
    if (productsUsingType.length > 0) {
      return res.status(400).json({
        status: "Error",
        message: "Không thể xóa loại sản phẩm vì đang được sử dụng bởi một số sản phẩm",
      });
    }

    await TypeProduct.findByIdAndDelete(typeId);

    res.status(200).json({
      status: "Ok",
      message: "Loại sản phẩm đã được xóa",
    });
  } catch (error) {
    res.status(500).json({
      status: "Error",
      message: error.message,
    });
  }
};

module.exports = {
  getTypes,
  getTypesAsJson,
  addType,
  updateType,
  deleteType,
};