
const mongoose = require('mongoose');
const Promotion = require("../models/Promotion");

// 🟢 Lấy danh sách khuyến mãi
// Trong controller (getPromotions)
const getPromotions = async (req, res) => {
  try {
    const promotions = await Promotion.find().lean();

    // Nếu cần emptyPromo để tạo form thêm khuyến mãi
    const emptyPromo = {
      _id: "",
      name: "",
      discount: 0,
      type: "percentage",
      minOrderValue: 0,
      maxDiscount: 0,
      status: "inactive",
      startDate: null,
      endDate: null,
    };

    res.render("promotions", { promotions, promo: emptyPromo });
  } catch (error) {
    console.error("Lỗi lấy danh sách khuyến mãi:", error);
    res.status(500).send("Lỗi khi tải danh sách khuyến mãi!");
  }
};

  

// 🟢 Lấy danh sách khuyến mãi dưới dạng JSON
const getPromotionAsJson = async (req, res) => {
  try {
    const promotions = await Promotion.find();
    res.json(promotions);
  } catch (error) {
    console.error("Lỗi lấy danh sách khuyến mãi:", error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách khuyến mãi!" });
  }
};

// 🟢 Lấy khuyến mãi theo ID
const getPromotionById = async (req, res) => {
  try {
    const { promotionId } = req.params; // Đổi `id` thành `promotionId` cho đồng nhất
    const promo = await Promotion.findById(promotionId).lean(); 
    const promotions = await Promotion.find().lean(); // Lấy danh sách khuyến mãi

    if (!promo) {
      return res.status(404).send("Khuyến mãi không tồn tại!");
    }

    res.render("promotions", { promotions, promo }); // Truyền đầy đủ dữ liệu
  } catch (error) {
    console.error("🔥 Lỗi lấy khuyến mãi:", error);
    res.status(500).send("Lỗi server khi lấy dữ liệu khuyến mãi!");
  }
};


// 🟢 Thêm khuyến mãi
const addPromotion = async (req, res) => {
  try {
    const { name, discount, type, minOrderValue, maxDiscount, startDate, endDate } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!name || !discount || !type || !minOrderValue || !maxDiscount || !startDate || !endDate) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin khuyến mãi!" });
    }

    const newPromotion = new Promotion({
      name: name.trim(),
      discount,
      type,
      minOrderValue,
      maxDiscount,
      status: "active",
      startDate,
      endDate,
    });

    await newPromotion.save();
    res.status(201).json({ message: "Thêm khuyến mãi thành công!", promotion: newPromotion });
  } catch (error) {
    console.error("Lỗi thêm khuyến mãi:", error);
    res.status(500).json({ message: "Lỗi khi thêm khuyến mãi!" });
  }
};


// 🟢 Cập nhật khuyến mãi
const updatePromotion = async (req, res) => {
  try {
    const { promotionId } = req.params;

    // Kiểm tra nếu không có dữ liệu gửi lên
    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "Không có dữ liệu để cập nhật!" });
    }

    const updatedPromotion = await Promotion.findByIdAndUpdate(
      promotionId,
      { ...req.body }, // Chỉ cập nhật dữ liệu có trong req.body
      { new: true, runValidators: true } // runValidators để kiểm tra dữ liệu mới
    );

    if (!updatedPromotion) {
      return res.status(404).json({ message: "Không tìm thấy khuyến mãi!" });
    }

    res.json({ message: "Cập nhật thành công!", promotion: updatedPromotion });
  } catch (error) {
    console.error("Lỗi cập nhật khuyến mãi:", error);
    res.status(500).json({ message: "Lỗi khi cập nhật khuyến mãi!" });
  }
};


// 🟢 Xóa khuyến mãi


const deletePromotion = async (req, res) => {
  try {
      const { promotionId } = req.params;
      console.log("🔍 Đang xóa khuyến mãi với ID:", promotionId);

      if (!promotionId.match(/^[0-9a-fA-F]{24}$/)) {
          console.log("❌ ID không hợp lệ:", promotionId);
          return res.status(400).json({ message: "ID không hợp lệ" });
      }

      const deletedPromotion = await Promotion.findByIdAndDelete(promotionId);

      if (!deletedPromotion) {
          console.log("❌ Không tìm thấy khuyến mãi với ID:", promotionId);
          return res.status(404).json({ message: "Không tìm thấy khuyến mãi" });
      }

      console.log("✅ Xóa thành công khuyến mãi:", deletedPromotion);
      res.status(200).json({ message: "Xóa thành công" });
  } catch (error) {
      console.error("🔥 Lỗi khi xóa khuyến mãi:", error); // In ra lỗi chi tiết
      res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};



// 🟢 Export các hàm
module.exports = {
  getPromotions,
  getPromotionAsJson,
  getPromotionById,
  addPromotion,
  updatePromotion,
  deletePromotion
};
