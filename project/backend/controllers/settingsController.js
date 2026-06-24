const Settings = require('../models/Settings');
const { logActivity } = require('../utils/activityLogger');

const getSettingsDocument = async () => {
  let settings = await Settings.findOne();
  if (!settings) settings = await Settings.create({});
  return settings;
};

exports.getSettings = async (req, res, next) => {
  try {
    const settings = await getSettingsDocument();
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const current = await getSettingsDocument();
    const settings = await Settings.findByIdAndUpdate(
      current._id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    await logActivity(req, {
      action: 'Settings Update',
      entityType: 'Settings',
      entityId: settings._id,
      details: 'Business settings updated'
    });

    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

const getBaseUrl = (req) => {
  const forwardedProto = req.get('x-forwarded-proto');
  const protocol = forwardedProto || req.protocol;
  return `${protocol}://${req.get('host')}`;
};

exports.getRobotsTxt = async (req, res, next) => {
  try {
    const baseUrl = getBaseUrl(req);
    res.type('text/plain').send([
      'User-agent: *',
      'Allow: /',
      `Sitemap: ${baseUrl}/sitemap.xml`
    ].join('\n'));
  } catch (error) {
    next(error);
  }
};

exports.getSitemapXml = async (req, res, next) => {
  try {
    const baseUrl = getBaseUrl(req);
    const urls = [''];
    const body = urls.map(path => `
  <url>
    <loc>${baseUrl}/${path}</loc>
    <changefreq>weekly</changefreq>
    <priority>${path ? '0.8' : '1.0'}</priority>
  </url>`).join('');

    res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}
</urlset>`);
  } catch (error) {
    next(error);
  }
};
