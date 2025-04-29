const express = require('express');
const router = express.Router();
const warrantyRequestController = require('../controllers/warrantyRequestController');
const { protect } = require('../middleware/auth');

// Admin routes (protected)
router.get('/', protect, warrantyRequestController.getWarrantySupportRequests);
router.put('/:id', protect, warrantyRequestController.updateWarrantyRequest);
router.delete('/:id', protect, warrantyRequestController.deleteWarrantyRequest);

// Public routes
router.post('/request', warrantyRequestController.createWarrantyRequest);

module.exports = router;
