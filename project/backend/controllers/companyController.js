const Company = require('../models/Company');
const Product = require('../models/Product');
const { deleteStoredImage } = require('../utils/uploadStorage');
const { logActivity } = require('../utils/activityLogger');

const buildCompanyStats = async (companies) => {
  const stats = await Product.aggregate([
    {
      $group: {
        _id: '$companyId',
        totalProducts: { $sum: 1 },
        availableProducts: { $sum: { $cond: ['$isAvailable', 1, 0] } },
        bestSellers: { $sum: { $cond: ['$isBestSeller', 1, 0] } }
      }
    }
  ]);

  const statsMap = stats.reduce((acc, item) => {
    acc[String(item._id)] = item;
    return acc;
  }, {});

  return companies.map(company => ({
    ...company.toObject(),
    productCount: statsMap[String(company._id)]?.totalProducts || 0,
    totalProducts: statsMap[String(company._id)]?.totalProducts || 0,
    availableProducts: statsMap[String(company._id)]?.availableProducts || 0,
    bestSellers: statsMap[String(company._id)]?.bestSellers || 0
  }));
};

const normalizeName = (name = '') => name.trim().toLowerCase();

const ensureUniqueCompanyName = async (name, existingId = null) => {
  const duplicate = await Company.findOne({ nameKey: normalizeName(name) }).select('+nameKey');
  if (duplicate && String(duplicate._id) !== String(existingId)) {
    return false;
  }
  return true;
};

exports.getCompanies = async (req, res, next) => {
  try {
    const filter = req.query.active === 'true' ? { isActive: true } : {};
    const companies = await Company.find(filter).sort({ name: 1 });
    res.status(200).json({ success: true, data: await buildCompanyStats(companies) });
  } catch (error) {
    next(error);
  }
};

exports.createCompany = async (req, res, next) => {
  try {
    const payload = { ...req.body, name: req.body.name?.trim() };
    payload.nameKey = normalizeName(payload.name);
    if (!await ensureUniqueCompanyName(payload.name)) {
      return res.status(400).json({ success: false, message: 'Company name already exists' });
    }

    const company = await Company.create(payload);
    await logActivity(req, {
      action: 'Company Create',
      entityType: 'Company',
      entityId: company._id,
      details: company.name
    });
    res.status(201).json({ success: true, data: company });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Company name already exists' });
    }
    next(error);
  }
};

exports.updateCompany = async (req, res, next) => {
  try {
    const payload = { ...req.body };
    if (payload.name) payload.name = payload.name.trim();
    if (payload.name) payload.nameKey = normalizeName(payload.name);

    if (payload.name && !await ensureUniqueCompanyName(payload.name, req.params.id)) {
      return res.status(400).json({ success: false, message: 'Company name already exists' });
    }

    const existingCompany = await Company.findById(req.params.id);
    if (!existingCompany) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    const oldLogo = existingCompany.logo;
    const company = await Company.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true
    });

    if (payload.logo && payload.logo !== oldLogo) {
      await deleteStoredImage(oldLogo);
    }
    await logActivity(req, {
      action: 'Company Update',
      entityType: 'Company',
      entityId: company._id,
      details: company.name
    });

    res.status(200).json({ success: true, data: company });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Company name already exists' });
    }
    next(error);
  }
};

exports.deleteCompany = async (req, res, next) => {
  try {
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    await logActivity(req, {
      action: 'Company Disable',
      entityType: 'Company',
      entityId: company._id,
      details: company.name
    });

    res.status(200).json({
      success: true,
      message: 'Company disabled. Companies are kept for future reuse.',
      data: company
    });
  } catch (error) {
    next(error);
  }
};
