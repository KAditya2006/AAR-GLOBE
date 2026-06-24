const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  shopName: {
    type: String,
    default: 'AAR GLOBE',
    trim: true
  },
  phoneNumber: {
    type: String,
    default: '+91 9608187900',
    trim: true
  },
  whatsappNumber: {
    type: String,
    default: '+91 9608187900',
    trim: true
  },
  address: {
    type: String,
    default: 'Satighat Kuseshwarasthan, Darbhanga - 848213',
    trim: true
  },
  heroTitle: {
    type: String,
    default: 'Mobile Repair, Accessories & Digital Services',
    trim: true
  },
  heroSubtitle: {
    type: String,
    default: 'Browse products and services, then send a request. We will contact you soon.',
    trim: true
  },
  offerBanner: {
    type: String,
    default: 'Send requests directly to AAR GLOBE',
    trim: true
  },
  themeColor: {
    type: String,
    default: '#06b6d4',
    trim: true
  },
  footerInformation: {
    type: String,
    default: 'Your trusted mobile repair, accessories, and digital services center.',
    trim: true
  },
  metaTitle: {
    type: String,
    default: 'AAR GLOBE | Mobile Repair & Digital Services',
    trim: true
  },
  metaDescription: {
    type: String,
    default: 'AAR GLOBE provides mobile repair, accessories, and digital services.',
    trim: true
  },
  keywords: {
    type: String,
    default: 'AAR GLOBE, mobile repair, accessories, digital services',
    trim: true
  },
  googleSiteVerification: {
    type: String,
    default: '',
    trim: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Settings', settingsSchema);
