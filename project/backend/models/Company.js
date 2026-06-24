const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  nameKey: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    select: false
  },
  logo: {
    type: String,
    default: '',
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

companySchema.pre('validate', function (next) {
  if (this.name) this.nameKey = this.name.trim().toLowerCase();
  next();
});

module.exports = mongoose.model('Company', companySchema);
