const mongoose = require("mongoose");
const Document = require("../models/Document");
const Product = require("../models/Product");
const User = require("../models/User");

// Tạo tài liệu mới
const createDocument = async (req, res) => {
  try {
    const { product_id, user_id, title, description, media } = req.body;

    if (!product_id || !user_id || !title || !description) {
      req.flash("error_msg", "Dữ liệu tài liệu không hợp lệ");
      return res.redirect("/documents");
    }

    if (
      !mongoose.Types.ObjectId.isValid(product_id) ||
      !mongoose.Types.ObjectId.isValid(user_id)
    ) {
      req.flash("error_msg", "ID sản phẩm hoặc người dùng không hợp lệ");
      return res.redirect("/documents");
    }

    const newDocument = new Document({
      product_id,
      user_id,
      title,
      description,
      media: media || "",
      date: new Date(),
    });

    await newDocument.save();
    req.flash("success_msg", "Tài liệu đã được tạo thành công!");
    res.redirect("/documents");
  } catch (error) {
    console.error("Lỗi khi tạo tài liệu:", error);
    req.flash("error_msg", "Lỗi khi tạo tài liệu: " + error.message);
    res.redirect("/documents");
  }
};

// Lấy tất cả tài liệu
const getAllDocuments = async (req, res) => {
  try {
    const documents = await Document.find().populate("product_id user_id");
    console.log("✅ Lấy danh sách tài liệu:", documents);
    res.render("dashboard/documents", {
      documents,
      products: await Product.find(),
      users: await User.find(),
      success_msg: req.flash("success_msg"),
      error_msg: req.flash("error_msg"),
      page: "documents",
      title: "Quản lý tài liệu",
    });
  } catch (error) {
    console.error("🔥 Lỗi server khi lấy danh sách tài liệu:", error);
    req.flash("error_msg", "Lỗi máy chủ nội bộ: " + error.message);
    res.redirect("/documents");
  }
};

// Hiển thị trang tạo tài liệu
const createDocumentScreen = async (req, res) => {
  try {
    const products = await Product.find();
    const users = await User.find();
    console.log("📌 Sản phẩm:", products);
    console.log("📌 Người dùng:", users);
    res.render("dashboard/documents", {
      products,
      users,
      documents: [],
      success_msg: req.flash("success_msg"),
      error_msg: req.flash("error_msg"),
    });
  } catch (error) {
    console.error("🔥 Lỗi khi tải trang tạo tài liệu:", error);
    req.flash("error_msg", "Lỗi server khi tải trang: " + error.message);
    res.redirect("/documents");
  }
};

// Lấy tài liệu theo ID
const getDocumentById = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id).populate(
      "product_id user_id",
    );
    if (!document)
      return res.status(404).json({ message: "Tài liệu không tồn tại" });
    res.json(document);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// Cập nhật tài liệu
const updateDocument = async (req, res) => {
  try {
    const { product_id, user_id, title, description, media } = req.body;

    if (!product_id || !user_id || !title || !description) {
      req.flash("error_msg", "Dữ liệu không đầy đủ");
      return res.redirect("/documents");
    }

    if (
      !mongoose.Types.ObjectId.isValid(product_id) ||
      !mongoose.Types.ObjectId.isValid(user_id)
    ) {
      req.flash("error_msg", "ID sản phẩm hoặc người dùng không hợp lệ");
      return res.redirect("/documents");
    }

    const updatedDocument = await Document.findByIdAndUpdate(
      req.params.id,
      {
        product_id,
        user_id,
        title,
        description,
        media: media || "",
        date: new Date(),
      },
      { new: true }
    );

    if (!updatedDocument) {
      req.flash("error_msg", "Tài liệu không tồn tại");
      return res.redirect("/documents");
    }

    req.flash("success_msg", "Cập nhật tài liệu thành công!");
    res.redirect("/documents");
  } catch (error) {
    console.error("Lỗi khi cập nhật tài liệu:", error);
    req.flash("error_msg", "Lỗi khi cập nhật tài liệu: " + error.message);
    res.redirect("/documents");
  }
};

// Xóa tài liệu
const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findByIdAndDelete(req.params.id);
    if (!document) {
      req.flash("error_msg", "Tài liệu không tồn tại");
      return res.redirect("/documents");
    }
    req.flash("success_msg", "Tài liệu đã được xóa thành công");
    res.redirect("/documents");
  } catch (error) {
    console.error("Lỗi khi xóa tài liệu:", error);
    req.flash("error_msg", "Lỗi khi xóa tài liệu: " + error.message);
    res.redirect("/documents");
  }
};

module.exports = {
  createDocument,
  getAllDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
  createDocumentScreen,
};
