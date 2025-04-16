const express = require("express");
const router = express.Router();
const promotionController = require("../controllers/PromotionController");
const { protect } = require("../middleware/auth");

// 📌 Lấy toàn bộ danh sách khuyến mãi và render ra giao diện EJS - (Web - admin only)
router.get("/", protect, promotionController.getPromotions);

// 📌 Lấy danh sách khuyến mãi dưới dạng JSON - (API - admin & employee)
router.get("/api/json", protect, promotionController.getPromotionAsJson);

// 📌 Lấy chi tiết khuyến mãi theo ID
router.get("/:promotionId", protect, promotionController.getPromotionById);

// 📌 Thêm khuyến mãi mới (POST)
router.post("/", protect, promotionController.addPromotion);

// 📌 Cập nhật thông tin khuyến mãi (PUT)
router.put("/:promotionId", protect, promotionController.updatePromotion);

// 📌 Xóa khuyến mãi (DELETE)
router.delete("/:promotionId", protect, promotionController.deletePromotion);

module.exports = router;
