const express = require("express");
const router = express.Router();
const warrantyController = require("../controllers/WarrantyController");
const { protect } = require("../middleware/auth");

// 📌 Lấy danh sách bảo hành
router.get("/", warrantyController.getWarranties);
router.get("/json", warrantyController.getWarrantyAsJson);

// 📌 Tìm kiếm bảo hành theo khách hàng
router.get("/search/customer", warrantyController.searchWarrantyByCustomer);

// 📌 Lấy bảo hành theo ID
router.get("/:warrantyId", warrantyController.getWarrantyById);

// 📌 Thêm bảo hành (POST)
router.post("/", warrantyController.addWarranty);

// 📌 Kích hoạt bảo hành khi tạo đơn hàng
router.post("/activate", warrantyController.activateWarranty);

// 📌 Cập nhật bảo hành (PUT)
router.put("/:warrantyId", warrantyController.updateWarranty);

// 📌 Xóa bảo hành (DELETE)
router.delete("/:warrantyId", warrantyController.deleteWarranty);

module.exports = router;
