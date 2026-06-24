const express = require('express');
const { body, param } = require('express-validator');
const { protect } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validate');
const {
  getCompanies,
  createCompany,
  updateCompany,
  deleteCompany
} = require('../controllers/companyController');

const router = express.Router();

const createCompanyRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Company name is required.')
    .isLength({ max: 80 }).withMessage('Company name must be 80 characters or less.'),
  body('logo')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 }).withMessage('Logo URL must be 500 characters or less.'),
  validateRequest
];

const updateCompanyRules = [
  param('id').isMongoId().withMessage('Invalid company ID.'),
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Company name is required.')
    .isLength({ max: 80 }).withMessage('Company name must be 80 characters or less.'),
  body('logo')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 }).withMessage('Logo URL must be 500 characters or less.'),
  validateRequest
];

router.get('/', getCompanies);
router.post('/', protect, createCompanyRules, createCompany);
router.put('/:id', protect, updateCompanyRules, updateCompany);
router.delete('/:id', protect, [param('id').isMongoId().withMessage('Invalid company ID.'), validateRequest], deleteCompany);

module.exports = router;
