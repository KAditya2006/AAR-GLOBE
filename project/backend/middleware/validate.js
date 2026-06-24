const { body, param, validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
};

const validateRequestOrder = [
  body('customerName')
    .trim()
    .notEmpty().withMessage('Customer name is required.')
    .isLength({ min: 2, max: 60 }).withMessage('Customer name must be 2-60 characters.'),

  body('customerPhone')
    .trim()
    .notEmpty().withMessage('Customer phone is required.')
    .matches(/^[0-9]{10}$/).withMessage('Phone must be exactly 10 digits.'),

  body('type')
    .trim()
    .notEmpty().withMessage('Type is required.')
    .isIn(['product', 'repair', 'service']).withMessage('Type must be product, repair, or service.'),

  body('item')
    .trim()
    .notEmpty().withMessage('Item name is required.')
    .isLength({ max: 100 }).withMessage('Item name is too long.'),

  body('amount')
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min: 0 }).withMessage('Amount must be a positive number.'),

  body('message')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 }).withMessage('Message must be 500 characters or less.'),

  validateRequest
];

const validateStatusUpdate = [
  param('id').isMongoId().withMessage('Invalid order ID.'),
  body('status')
    .optional()
    .isIn(['New', 'Contacted', 'Confirmed', 'Completed', 'Cancelled'])
    .withMessage('Status must be New, Contacted, Confirmed, Completed, or Cancelled.'),
  body('notes')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 1000 }).withMessage('Notes must be 1000 characters or less.'),
  body('leadStatus')
    .optional()
    .isIn(['New', 'Contacted', 'Qualified', 'Converted', 'Closed'])
    .withMessage('Lead status must be New, Contacted, Qualified, Converted, or Closed.'),
  body('lastContactDate')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601().withMessage('Last contact date must be a valid date.'),
  body('nextFollowUpDate')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601().withMessage('Next follow-up date must be a valid date.'),
  body('followUpNotes')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 1000 }).withMessage('Follow-up notes must be 1000 characters or less.'),

  validateRequest
];

const validateFollowUpUpdate = [
  param('id').isMongoId().withMessage('Invalid order ID.'),
  body('nextFollowUpDate')
    .trim()
    .notEmpty().withMessage('Next follow-up date is required.')
    .isISO8601().withMessage('Next follow-up date must be a valid date.'),
  body('followUpNotes')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 1000 }).withMessage('Follow-up notes must be 1000 characters or less.'),

  validateRequest
];

const validateOrderId = [
  param('id').isMongoId().withMessage('Invalid order ID.'),
  validateRequest
];

module.exports = {
  validateRequestOrder,
  validateStatusUpdate,
  validateFollowUpUpdate,
  validateOrderId,
  validateRequest
};
