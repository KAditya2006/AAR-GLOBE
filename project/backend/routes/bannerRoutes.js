const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner
} = require('../controllers/bannerController');

const router = express.Router();

router.get('/', getBanners);
router.post('/', protect, createBanner);
router.put('/:id', protect, updateBanner);
router.delete('/:id', protect, deleteBanner);

module.exports = router;
