const Service = require('../models/Service');
const { logActivity } = require('../utils/activityLogger');

exports.getServices = async (req, res, next) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: services });
  } catch (error) {
    next(error);
  }
};

exports.getPublicServices = async (req, res, next) => {
  try {
    const services = await Service.find({ isAvailable: true }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: services });
  } catch (error) {
    next(error);
  }
};

exports.createService = async (req, res, next) => {
  try {
    const service = await Service.create(req.body);
    await logActivity(req, {
      action: 'Service Create',
      entityType: 'Service',
      entityId: service._id,
      details: service.name
    });
    res.status(201).json({ success: true, data: service });
  } catch (error) {
    next(error);
  }
};

exports.updateService = async (req, res, next) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    await logActivity(req, {
      action: 'Service Update',
      entityType: 'Service',
      entityId: service._id,
      details: service.name
    });
    res.status(200).json({ success: true, data: service });
  } catch (error) {
    next(error);
  }
};

exports.deleteService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    await service.deleteOne();
    await logActivity(req, {
      action: 'Service Delete',
      entityType: 'Service',
      entityId: service._id,
      details: service.name
    });
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
