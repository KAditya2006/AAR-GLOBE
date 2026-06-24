const ActivityLog = require('../models/ActivityLog');

exports.getActivityLogs = async (req, res, next) => {
  try {
    const { search = '', action = '', entityType = '', startDate = '', endDate = '' } = req.query;
    const filter = {};

    if (action) filter.action = action;
    if (entityType) filter.entityType = entityType;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }
    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { action: regex },
        { entityType: regex },
        { adminEmail: regex },
        { details: regex }
      ];
    }

    const logs = await ActivityLog.find(filter).sort({ createdAt: -1 }).limit(300);
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
};
