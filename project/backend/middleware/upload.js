const path = require('path');
const multer = require('multer');
const { uploadRoot } = require('../utils/uploadStorage');

const allowedTypes = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp']);

// Upload storage mode:
// - local: files are stored in backend/uploads and served from /uploads.
// - cloudinary: files are staged locally, uploaded to Cloudinary, then removed.
// Keep database values as public paths/URLs so product/company models do not change.
const allowedStorageModes = new Set(['local', 'cloudinary']);
const getUploadStorageMode = () => process.env.UPLOAD_STORAGE || 'local';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadStorageMode = getUploadStorageMode();
    if (!allowedStorageModes.has(uploadStorageMode)) {
      return cb(new Error('UPLOAD_STORAGE must be local or cloudinary.'));
    }
    cb(null, uploadRoot);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeBase = path.basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'image';
    cb(null, `${Date.now()}-${safeBase}${ext}`);
  }
});

const imageUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedTypes.has(file.mimetype) || !allowedExtensions.has(ext)) {
      return cb(new Error('Only jpg, jpeg, png, and webp images are allowed.'));
    }
    cb(null, true);
  }
});

module.exports = { imageUpload };
