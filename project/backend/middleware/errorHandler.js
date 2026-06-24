/**
 * Centralized Error Handler Middleware.
 * Must be registered LAST in server.js (after all routes).
 * Catches any error passed via next(err).
 */
const errorHandler = (err, req, res, next) => {
  // Log the full error in development
  if (process.env.NODE_ENV !== 'production') {
    console.error('❌ ERROR:', err.stack || err.message);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ success: false, message: messages.join(', ') });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    return res.status(409).json({ success: false, message: 'Duplicate entry detected.' });
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Invalid ID format.' });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid authentication token.' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Session expired. Please login again.' });
  }

  // Generic fallback
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'An unexpected server error occurred.'
  });
};

module.exports = errorHandler;
