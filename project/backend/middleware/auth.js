const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { logActivity } = require('../utils/activityLogger');

/**
 * Middleware: Protect routes.
 * Checks for a valid JWT in the Authorization header (Bearer token)
 * and attaches the admin to the request.
 */
const protect = async (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = await Admin.findById(decoded.id).select('-password');
    if (!req.admin) {
      return res.status(401).json({ success: false, message: 'Admin no longer exists' });
    }
    next();
  } catch (err) {
    await logActivity(req, {
      action: 'Invalid JWT',
      entityType: 'Security',
      details: `${req.method} ${req.originalUrl}`
    });
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token. Please login again.'
    });
  }
};

module.exports = { protect };
