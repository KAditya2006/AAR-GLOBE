const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  customerPhone: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['product', 'service', 'repair']
  },
  item: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    min: 0,
    default: null
  },
  message: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['New', 'Contacted', 'Confirmed', 'Completed', 'Cancelled'],
    default: 'New'
  },
  leadStatus: {
    type: String,
    enum: ['New', 'Contacted', 'Qualified', 'Converted', 'Closed'],
    default: 'New'
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  lastContactDate: {
    type: Date,
    default: null
  },
  nextFollowUpDate: {
    type: Date,
    default: null
  },
  followUpNotes: {
    type: String,
    trim: true,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Order', orderSchema);
