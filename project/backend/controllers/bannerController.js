const Banner = require('../models/Banner');
const { deleteStoredImage } = require('../utils/uploadStorage');
const { logActivity } = require('../utils/activityLogger');

exports.getBanners = async (req, res, next) => {
  try {
    const filter = req.query.active === 'true' ? { isActive: true } : {};
    const banners = await Banner.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: banners });
  } catch (error) {
    next(error);
  }
};

exports.createBanner = async (req, res, next) => {
  try {
    const banner = await Banner.create(req.body);
    await logActivity(req, {
      action: 'Banner Create',
      entityType: 'Banner',
      entityId: banner._id,
      details: banner.title
    });
    res.status(201).json({ success: true, data: banner });
  } catch (error) {
    next(error);
  }
};

exports.updateBanner = async (req, res, next) => {
  try {
    const existingBanner = await Banner.findById(req.params.id);
    if (!existingBanner) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }

    const oldImage = existingBanner.image;
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (req.body.image && req.body.image !== oldImage) {
      await deleteStoredImage(oldImage);
    }
    await logActivity(req, {
      action: 'Banner Update',
      entityType: 'Banner',
      entityId: banner._id,
      details: banner.title
    });

    res.status(200).json({ success: true, data: banner });
  } catch (error) {
    next(error);
  }
};

exports.deleteBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }

    await deleteStoredImage(banner.image);
    await banner.deleteOne();
    await logActivity(req, {
      action: 'Banner Delete',
      entityType: 'Banner',
      entityId: banner._id,
      details: banner.title
    });
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
