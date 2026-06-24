const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getProducts,
  getPublicProducts,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');

// Public route — storefront
router.get('/public', getPublicProducts);

// Protected routes — admin dashboard
router.get('/', protect, getProducts);
router.post('/', protect, createProduct);
router.put('/:id', protect, updateProduct);
router.delete('/:id', protect, deleteProduct);

module.exports = router;
