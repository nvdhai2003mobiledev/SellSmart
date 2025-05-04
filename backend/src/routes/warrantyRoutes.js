const express = require('express');
const router = express.Router();
const warrantyRequestController = require('../controllers/warrantyRequestController');

// Route trả về danh sách bảo hành
router.get('/', warrantyRequestController.getWarrantySupportRequests);
// Route trả về danh sách bảo hành dưới dạng JSON
router.get('/json', warrantyRequestController.getWarrantySupportRequestsAsJson);
// Các route khác
router.put('/:id', warrantyRequestController.updateWarrantyRequest);
router.delete('/:id', warrantyRequestController.deleteWarrantyRequest);
router.post('/request', warrantyRequestController.createWarrantyRequest);

module.exports = router;