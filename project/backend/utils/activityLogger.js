const ActivityLog = require('../models/ActivityLog');

const getAdminEmail = (req) => req?.admin?.email || req?.body?.email || 'system';

const logActivity = async (req, { action, entityType, entityId = '', details = '' }) => {
  try {
    await ActivityLog.create({
      action,
      entityType,
      entityId: entityId ? String(entityId) : '',
      adminEmail: getAdminEmail(req),
      details
    });
  } catch (error) {
    console.warn(`Activity log failed: ${error.message}`);
  }
};

module.exports = { logActivity };
