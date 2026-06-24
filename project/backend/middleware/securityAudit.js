const { logActivity } = require('../utils/activityLogger');

const securityAudit = async (req, res, next) => {
  const suspiciousPatterns = [
    /\$where/i,
    /<script/i,
    /javascript:/i,
    /\.\.\//,
    /union\s+select/i
  ];

  const source = `${req.originalUrl} ${JSON.stringify(req.query || {})} ${JSON.stringify(req.body || {})}`;
  if (suspiciousPatterns.some(pattern => pattern.test(source))) {
    await logActivity(req, {
      action: 'Suspicious Activity',
      entityType: 'Security',
      details: `${req.method} ${req.originalUrl}`
    });
  }

  next();
};

module.exports = { securityAudit };
