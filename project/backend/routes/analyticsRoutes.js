const express = require('express');
const router = express.Router();
const { getAnalytics, exportRequests } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getAnalytics);
router.get('/export/requests', protect, exportRequests);

module.exports = router;
