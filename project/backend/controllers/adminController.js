const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { logActivity } = require('../utils/activityLogger');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, {
  expiresIn: process.env.JWT_EXPIRES_IN || '8h'
});

const getOrCreateBootstrapAdmin = async (email, password) => {
  let admin = await Admin.findOne({ email });
  if (admin) return admin;

  const adminCount = await Admin.countDocuments();
  const bootstrapEmail = process.env.ADMIN_EMAIL || 'admin@aarglobe.local';
  const bootstrapPassword = process.env.ADMIN_PASSWORD || 'admin123';

  if (adminCount > 0 || email !== bootstrapEmail || password !== bootstrapPassword) {
    return null;
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(bootstrapPassword, salt);
  return Admin.create({
    email: bootstrapEmail,
    password: hashedPassword,
    name: 'AAR GLOBE Admin'
  });
};

exports.loginAdmin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const admin = await getOrCreateBootstrapAdmin(email, password);

    if (admin && await bcrypt.compare(password, admin.password)) {
      await logActivity(req, {
        action: 'Admin Login',
        entityType: 'Admin',
        entityId: admin._id,
        details: 'Admin logged in successfully'
      });
      return res.status(200).json({
        success: true,
        data: {
          _id: admin._id,
          email: admin.email,
          name: admin.name,
          token: generateToken(admin._id)
        },
        token: generateToken(admin._id)
      });
    }

    await logActivity(req, {
      action: 'Failed Login',
      entityType: 'Security',
      details: `Failed login attempt for ${email}`
    });
    res.status(401).json({ success: false, message: 'Invalid email or password' });
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'New password and confirm password must match' });
    }

    const admin = await Admin.findById(req.admin._id);
    if (!admin || !await bcrypt.compare(currentPassword, admin.password)) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(newPassword, salt);
    await admin.save();
    await logActivity(req, {
      action: 'Password Change',
      entityType: 'Admin',
      entityId: admin._id,
      details: 'Admin password changed'
    });

    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};
