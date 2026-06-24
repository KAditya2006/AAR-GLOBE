const mongoose = require('mongoose');

exports.getHealth = (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({
    status: connected ? 'ok' : 'degraded',
    database: connected ? 'connected' : 'disconnected',
    uploads: process.env.UPLOAD_STORAGE === 'cloudinary' ? 'cloudinary' : 'local',
    timestamp: new Date().toISOString()
  });
};
