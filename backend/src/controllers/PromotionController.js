
const mongoose = require("mongoose");
const Promotion = require("../models/Promotion");

const getPromotions = async (req, res) => {
  try {
    console.log("🚀 [getPromotions] Bắt đầu lấy danh sách khuyến mãi...");
    const promotions = await Promotion.find().lean();
    console.log("✅ [getPromotions] Dữ liệu từ MongoDB:", JSON.stringify(promotions, null, 2));

    if (!Array.isArray(promotions)) {
      console.log("❌ [getPromotions] Dữ liệu không phải mảng, trả về mảng rỗng");
      return res.render("promotions", { promotions: [], promo: emptyPromo });
    }

    if (promotions.length === 0) {
      console.log("⚠️ [getPromotions] Không có dữ liệu, trả về mảng rỗng");
      return res.render("promotions", { promotions: [], promo: emptyPromo });
    }

    const emptyPromo = {
      _id: "",
      name: "",
      discount: 0,
      minOrderValue: 0,
      maxDiscount: 0,
      status: "inactive",
      startDate: "",
      endDate: "",
    };

    console.log("📋 [getPromotions] Dữ liệu trước khi render:", {
      promotions: promotions.length,
      promo: emptyPromo,
    });
    console.log("🎨 [getPromotions] Render giao diện EJS...");
    res.render("promotions", {
      promotions,
      promo: emptyPromo,
      admin: req.session.admin || null, // Để tránh lỗi avatar
      page: "promotions", // Thêm biến page để xử lý active sidebar
    });
    
  } catch (error) {
    console.error("🔥 [getPromotions] Lỗi lấy danh sách khuyến mãi:", {
      message: error.message,
      stack: error.stack,
    });
    throw error;
  }
};




// 🟢 Lấy danh sách khuyến mãi dạng JSON
const getPromotionAsJson = async (req, res) => {
  try {
    const promotions = await Promotion.find();
    res.json(promotions);
  } catch (error) {
    console.error("🔥 Lỗi lấy danh sách khuyến mãi JSON:", error);
    res.status(500).json({ message: "Lỗi server khi lấy dữ liệu!" });
  }
};


// 🟢 Lấy khuyến mãi theo ID
const getPromotionById = async (req, res) => {
  try {
    const { promotionId } = req.params;
    const promo = await Promotion.findById(promotionId).lean();

    // Lấy danh sách tất cả khuyến mãi để render lại trang
    const promotions = await Promotion.find().lean();

    if (!promo) {
      return res.status(404).send("❌ Không tìm thấy khuyến mãi!");
    }

    res.render("promotions", { promotions, promo });
  } catch (error) {
    console.error("🔥 Lỗi khi lấy khuyến mãi theo ID:", error);
    res.status(500).send("Lỗi server khi lấy dữ liệu khuyến mãi!");
  }
};


// 🟢 Thêm khuyến mãi mới
const addPromotion = async (req, res) => {
  try {
    const { name, discount,  minOrderValue, maxDiscount, startDate, endDate } = req.body;

    if (!name || !discount  || !minOrderValue || !maxDiscount || !startDate || !endDate) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin!" });
    }

    const newPromotion = new Promotion({
      name: name.trim(),
      discount,
      
      minOrderValue,
      maxDiscount,
      status: "active",
      startDate,
      endDate,
    });

    await newPromotion.save();
    res.status(201).json({ message: "✅ Thêm khuyến mãi thành công!", promotion: newPromotion });
  } catch (error) {
    console.error("🔥 Lỗi khi thêm khuyến mãi:", error);
    res.status(500).json({ message: "Lỗi server khi thêm khuyến mãi!" });
  }
};


// 🟢 Cập nhật khuyến mãi
const updatePromotion = async (req, res) => {
  try {
    const { promotionId } = req.params;

    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "❌ Không có dữ liệu để cập nhật!" });
    }

    const updatedPromotion = await Promotion.findByIdAndUpdate(
      promotionId,
      { ...req.body },
      { new: true, runValidators: true }
    );

    if (!updatedPromotion) {
      return res.status(404).json({ message: "❌ Không tìm thấy khuyến mãi!" });
    }

    res.json({ message: "✅ Cập nhật thành công!", promotion: updatedPromotion });
  } catch (error) {
    console.error("🔥 Lỗi khi cập nhật khuyến mãi:", error);
    res.status(500).json({ message: "Lỗi server khi cập nhật khuyến mãi!" });
  }
};


// 🟢 Xóa khuyến mãi
const deletePromotion = async (req, res) => {
  try {
    const { promotionId } = req.params;

    if (!promotionId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "❌ ID không hợp lệ!" });
    }

    const deletedPromotion = await Promotion.findByIdAndDelete(promotionId);

    if (!deletedPromotion) {
      return res.status(404).json({ message: "❌ Không tìm thấy khuyến mãi!" });
    }

    res.status(200).json({ message: "✅ Xóa thành công!" });
  } catch (error) {
    console.error("🔥 Lỗi khi xóa khuyến mãi:", error);
    res.status(500).json({ message: "Lỗi server khi xóa!" });
  }
};



// 🟢 Export các hàm
module.exports = {
  getPromotions,
  getPromotionAsJson,
  getPromotionById,
  addPromotion,
  updatePromotion,
  deletePromotion,
};
