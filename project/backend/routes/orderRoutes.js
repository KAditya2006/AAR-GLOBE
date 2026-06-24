const express = require('express');
const router = express.Router();

const {
  requestOrder,
  getOrders,
  updateOrderStatus,
  markContacted,
  scheduleFollowUp,
  prepareWhatsAppNotification
} = require('../controllers/orderController');

const { protect } = require('../middleware/auth');
const {
  validateRequestOrder,
  validateStatusUpdate,
  validateFollowUpUpdate,
  validateOrderId
} = require('../middleware/validate');

router.post('/request-order', validateRequestOrder, requestOrder);

router.get('/', protect, getOrders);
router.patch('/:id/status', protect, validateStatusUpdate, updateOrderStatus);
router.patch('/:id/contacted', protect, validateOrderId, markContacted);
router.patch('/:id/follow-up', protect, validateFollowUpUpdate, scheduleFollowUp);
router.post('/:id/notifications/whatsapp', protect, validateOrderId, prepareWhatsAppNotification);

module.exports = router;
