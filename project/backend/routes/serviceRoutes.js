const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getServices,
  getPublicServices,
  createService,
  updateService,
  deleteService
} = require('../controllers/serviceController');

// Public route — storefront
router.get('/public', getPublicServices);

// Protected routes — admin dashboard
router.get('/', protect, getServices);
router.post('/', protect, createService);
router.put('/:id', protect, updateService);
router.delete('/:id', protect, deleteService);

module.exports = router;
