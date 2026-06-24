const express = require('express');
const { body } = require('express-validator');
const { loginAdmin, changePassword } = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validate');

const router = express.Router();

router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.'),
  validateRequest
], loginAdmin);

router.put('/change-password', protect, [
  body('currentPassword').notEmpty().withMessage('Current password is required.'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters.')
    .matches(/[a-z]/).withMessage('New password must include a lowercase letter.')
    .matches(/[A-Z]/).withMessage('New password must include an uppercase letter.')
    .matches(/[0-9]/).withMessage('New password must include a number.'),
  body('confirmPassword').notEmpty().withMessage('Confirm password is required.'),
  validateRequest
], changePassword);

module.exports = router;
