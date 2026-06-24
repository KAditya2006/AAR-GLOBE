const express = require('express');
const { protect } = require('../middleware/auth');
const { getActivityLogs } = require('../controllers/activityController');

const router = express.Router();

router.get('/', protect, getActivityLogs);

module.exports = router;
