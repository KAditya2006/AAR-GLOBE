const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  image: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  stockQuantity: {
    type: Number,
    default: 1,
    min: 0
  },
  stockStatus: {
    type: String,
    enum: ['In Stock', 'Low Stock', 'Out of Stock'],
    default: 'Low Stock'
  },
  isBestSeller: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

productSchema.pre('validate', function (next) {
  const quantity = Number(this.stockQuantity) || 0;
  this.stockQuantity = Math.max(quantity, 0);
  if (this.stockQuantity === 0) {
    this.stockStatus = 'Out of Stock';
    this.isAvailable = false;
  } else if (this.stockQuantity <= 5) {
    this.stockStatus = 'Low Stock';
    if (this.isAvailable === undefined) this.isAvailable = true;
  } else {
    this.stockStatus = 'In Stock';
    if (this.isAvailable === undefined) this.isAvailable = true;
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
