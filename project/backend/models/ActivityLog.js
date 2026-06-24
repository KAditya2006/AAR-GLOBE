const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    trim: true
  },
  entityType: {
    type: String,
    required: true,
    trim: true
  },
  entityId: {
    type: String,
    default: '',
    trim: true
  },
  adminEmail: {
    type: String,
    default: 'system',
    trim: true,
    lowercase: true
  },
  details: {
    type: String,
    default: '',
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ action: 1, entityType: 1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
