const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Admin = require('../models/Admin');
const Company = require('../models/Company');
const Product = require('../models/Product');
const Service = require('../models/Service');
const Order = require('../models/Order');
const Settings = require('../models/Settings');

dotenv.config();

const companyNames = ['Samsung', 'boAt', 'JBL', 'Realme'];

const seedProducts = [
  { company: 'Samsung', name: 'Fast Charger', category: 'Charger', price: 799, description: 'Reliable fast charging adapter', isAvailable: true, isBestSeller: true },
  { company: 'Samsung', name: 'Type-C Cable', category: 'Cable', price: 249, description: 'Durable USB Type-C cable', isAvailable: true },
  { company: 'boAt', name: 'Airdopes 141', category: 'Earbuds', price: 1299, description: 'Wireless earbuds for daily use', isAvailable: true, isBestSeller: true },
  { company: 'JBL', name: 'Bluetooth Speaker', category: 'Speaker', price: 1999, description: 'Portable speaker with clear sound', isAvailable: true },
  { company: 'Realme', name: 'Buds Wireless', category: 'Neckband', price: 999, description: 'Wireless neckband earphones', isAvailable: true }
];

const seedServices = [
  { name: 'Screen Replacement', type: 'repair', price: 999, description: 'Display replacement for supported phones', isAvailable: true },
  { name: 'Battery Replacement', type: 'repair', price: 799, description: 'Battery replacement service', isAvailable: true },
  { name: 'Charging Port Repair', type: 'repair', price: 499, description: 'Charging jack repair service', isAvailable: true },
  { name: 'PAN Card Apply', type: 'online', price: 150, description: 'PAN card application support', isAvailable: true },
  { name: 'Aadhaar Print', type: 'online', price: 50, description: 'Aadhaar print service', isAvailable: true },
  { name: 'Bill Payment', type: 'online', price: 20, description: 'Utility bill payment support', isAvailable: true }
];

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const counts = await Promise.all([
    Company.countDocuments(),
    Product.countDocuments(),
    Service.countDocuments(),
    Order.countDocuments(),
    Settings.countDocuments()
  ]);

  if (counts.some(count => count > 0)) {
    console.log('Seed skipped: database already contains business data.');
    await mongoose.disconnect();
    return;
  }

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@aarglobe.local';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin1234';
  const adminExists = await Admin.findOne({ email: adminEmail });
  if (!adminExists) {
    const salt = await bcrypt.genSalt(10);
    await Admin.create({
      email: adminEmail,
      password: await bcrypt.hash(adminPassword, salt),
      name: 'AAR GLOBE Admin'
    });
  }

  const companies = {};
  for (const name of companyNames) {
    companies[name] = await Company.create({ name, isActive: true });
  }

  for (const product of seedProducts) {
    await Product.create({
      companyId: companies[product.company]._id,
      name: product.name,
      category: product.category,
      price: product.price,
      description: product.description,
      isAvailable: product.isAvailable,
      isBestSeller: Boolean(product.isBestSeller)
    });
  }

  await Service.insertMany(seedServices);

  await Settings.create({
    shopName: 'AAR GLOBE',
    phoneNumber: '+91 9608187900',
    whatsappNumber: '+91 9608187900',
    address: 'Satighat Kuseshwarasthan, Darbhanga - 848213',
    heroTitle: 'Mobile Repair, Accessories & Digital Services',
    heroSubtitle: 'Browse products and services, then send a request. We will contact you soon.',
    offerBanner: 'Trusted local mobile and digital service center',
    themeColor: '#06b6d4',
    footerInformation: 'Your trusted mobile repair, accessories, and digital services center.'
  });

  console.log('Demo seed completed.');
  await mongoose.disconnect();
};

seed().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
