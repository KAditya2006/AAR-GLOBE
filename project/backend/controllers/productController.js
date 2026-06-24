const Product = require('../models/Product');
const Company = require('../models/Company');
const mongoose = require('mongoose');
const { deleteStoredImage } = require('../utils/uploadStorage');
const { logActivity } = require('../utils/activityLogger');

const sortByCompanyAndName = (products) => products.sort((a, b) => {
  const companyCompare = (a.companyId?.name || '').localeCompare(b.companyId?.name || '');
  if (companyCompare !== 0) return companyCompare;
  return a.name.localeCompare(b.name);
});

const applyStockRules = (payload) => {
  if (payload.stockQuantity === undefined) return payload;
  const stockQuantity = Math.max(Number(payload.stockQuantity) || 0, 0);
  payload.stockQuantity = stockQuantity;
  if (stockQuantity === 0) {
    payload.stockStatus = 'Out of Stock';
    payload.isAvailable = false;
  } else if (stockQuantity <= 5) {
    payload.stockStatus = 'Low Stock';
  } else {
    payload.stockStatus = 'In Stock';
  }
  return payload;
};

exports.getProducts = async (req, res, next) => {
  try {
    const products = await Product.find().populate('companyId');
    res.status(200).json({ success: true, data: sortByCompanyAndName(products) });
  } catch (error) {
    next(error);
  }
};

exports.getPublicProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ isAvailable: true })
      .populate({ path: 'companyId', match: { isActive: true } })
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: sortByCompanyAndName(products.filter(product => product.companyId))
    });
  } catch (error) {
    next(error);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.body.companyId)) {
      return res.status(400).json({
        success: false,
        message: 'Please select a valid company for this product.'
      });
    }

    const company = await Company.findOne({ _id: req.body.companyId, isActive: true });
    if (!company) {
      return res.status(400).json({
        success: false,
        message: 'Please select an active company for this product.'
      });
    }

    const payload = {
      ...req.body,
      companyId: company._id,
      isAvailable: req.body.isAvailable === undefined ? true : req.body.isAvailable
    };
    applyStockRules(payload);

    const product = await Product.create(payload);
    await product.populate('companyId');
    await logActivity(req, {
      action: 'Product Create',
      entityType: 'Product',
      entityId: product._id,
      details: `${product.name} (${product.stockStatus})`
    });
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (req.body.companyId) {
      if (!mongoose.isValidObjectId(req.body.companyId)) {
        return res.status(400).json({
          success: false,
          message: 'Please select a valid company for this product.'
        });
      }

      const company = await Company.findOne({ _id: req.body.companyId, isActive: true });
      if (!company) {
        return res.status(400).json({
          success: false,
          message: 'Please select an active company for this product.'
        });
      }
    }

    const oldImage = existingProduct.image;
    const payload = { ...req.body };
    applyStockRules(payload);
    const product = await Product.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true
    }).populate('companyId');

    if (payload.image && payload.image !== oldImage) {
      await deleteStoredImage(oldImage);
    }
    await logActivity(req, {
      action: 'Product Update',
      entityType: 'Product',
      entityId: product._id,
      details: `${product.name} (${product.stockStatus})`
    });

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await product.deleteOne();
    await logActivity(req, {
      action: 'Product Delete',
      entityType: 'Product',
      entityId: product._id,
      details: product.name
    });
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
