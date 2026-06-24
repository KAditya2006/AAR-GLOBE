const express = require('express');
const { protect } = require('../middleware/auth');
const { imageUpload } = require('../middleware/upload');
const { uploadImage } = require('../controllers/uploadController');

const router = express.Router();

router.post('/company-logo', protect, (req, res, next) => {
  req.uploadType = 'company-logos';
  next();
}, imageUpload.single('image'), uploadImage);

router.post('/product-image', protect, (req, res, next) => {
  req.uploadType = 'product-images';
  next();
}, imageUpload.single('image'), uploadImage);

router.post('/banner-image', protect, (req, res, next) => {
  req.uploadType = 'banner-images';
  next();
}, imageUpload.single('image'), uploadImage);

module.exports = router;
