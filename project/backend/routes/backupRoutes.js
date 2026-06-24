const express = require('express');
const { protect } = require('../middleware/auth');
const {
  exportCollection,
  previewRestore,
  restoreCollection
} = require('../controllers/backupController');

const router = express.Router();

router.get('/:collection', protect, exportCollection);
router.post('/:collection/preview', protect, previewRestore);
router.post('/:collection/restore', protect, restoreCollection);

module.exports = router;
