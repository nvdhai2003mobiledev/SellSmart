const express = require("express");
const router = express.Router();
const promotionController = require("../controllers/PromotionController");

// 📌 Lấy danh sách khuyến mãi
router.get("/promotions", promotionController.getPromotions);
router.get("/promotions/json", promotionController.getPromotionAsJson);


// 📌 Lấy khuyến mãi theo ID
router.get("/promotions/:promotionId", promotionController.getPromotionById);



// 📌 Thêm khuyến mãi (POST)
router.post("/promotions", promotionController.addPromotion);

// 📌 Cập nhật khuyến mãi (PUT)
router.put("/promotions/:promotionId", promotionController.updatePromotion);

// 📌 Xóa khuyến mãi (DELETE)
router.delete("/promotions/:promotionId", promotionController.deletePromotion);


module.exports = router;
