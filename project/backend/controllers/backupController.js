const Company = require('../models/Company');
const Product = require('../models/Product');
const Service = require('../models/Service');
const Order = require('../models/Order');
const Settings = require('../models/Settings');
const { logActivity } = require('../utils/activityLogger');

const collections = {
  companies: { model: Company, unique: 'nameKey', label: 'Companies' },
  products: { model: Product, unique: 'name', label: 'Products' },
  services: { model: Service, unique: 'name', label: 'Services' },
  requests: { model: Order, unique: null, label: 'Requests' },
  settings: { model: Settings, unique: null, label: 'Settings' }
};

const escapeCsv = (value = '') => {
  const stringValue = value === null || value === undefined ? '' : String(value);
  return `"${stringValue.replace(/"/g, '""')}"`;
};

const toCsv = (records) => {
  if (!records.length) return '';
  const keys = [...new Set(records.flatMap(record => Object.keys(record)))];
  const rows = records.map(record => keys.map(key => {
    const value = record[key];
    return escapeCsv(typeof value === 'object' && value !== null ? JSON.stringify(value) : value);
  }).join(','));
  return [keys.map(escapeCsv).join(','), ...rows].join('\n');
};

const getCollection = (name) => collections[name];

exports.exportCollection = async (req, res, next) => {
  try {
    const collection = getCollection(req.params.collection);
    if (!collection) return res.status(404).json({ success: false, message: 'Unknown backup collection' });

    const format = req.query.format === 'csv' ? 'csv' : 'json';
    const records = await collection.model.find().lean();
    const fileName = `aarglobe-${req.params.collection}-${new Date().toISOString().slice(0, 10)}`;

    await logActivity(req, {
      action: 'Backup Export',
      entityType: collection.label,
      details: `${records.length} records exported as ${format.toUpperCase()}`
    });

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}.csv"`);
      return res.send(toCsv(records));
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}.json"`);
    res.send(JSON.stringify({ collection: req.params.collection, exportedAt: new Date(), records }, null, 2));
  } catch (error) {
    next(error);
  }
};

exports.previewRestore = async (req, res, next) => {
  try {
    const collection = getCollection(req.params.collection);
    if (!collection) return res.status(404).json({ success: false, message: 'Unknown restore collection' });

    const records = Array.isArray(req.body.records) ? req.body.records : Array.isArray(req.body) ? req.body : [];
    if (!records.length) return res.status(400).json({ success: false, message: 'Backup file has no records array' });

    let existingRecords = 0;
    if (collection.unique) {
      const values = records.map(record => record[collection.unique] || record.name?.trim?.().toLowerCase()).filter(Boolean);
      existingRecords = await collection.model.countDocuments({ [collection.unique]: { $in: values } });
    }

    res.status(200).json({
      success: true,
      data: {
        recordsFound: records.length,
        existingRecords,
        newRecords: Math.max(records.length - existingRecords, 0)
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.restoreCollection = async (req, res, next) => {
  try {
    const collection = getCollection(req.params.collection);
    if (!collection) return res.status(404).json({ success: false, message: 'Unknown restore collection' });

    const records = Array.isArray(req.body.records) ? req.body.records : Array.isArray(req.body) ? req.body : [];
    if (!records.length) return res.status(400).json({ success: false, message: 'Backup file has no records array' });

    let inserted = 0;
    let skipped = 0;

    for (const record of records) {
      const payload = { ...record };
      delete payload._id;
      delete payload.__v;

      if (collection.unique) {
        if (collection.unique === 'nameKey' && payload.name && !payload.nameKey) {
          payload.nameKey = payload.name.trim().toLowerCase();
        }
        const uniqueValue = payload[collection.unique];
        if (uniqueValue && await collection.model.exists({ [collection.unique]: uniqueValue })) {
          skipped += 1;
          continue;
        }
      }

      await collection.model.create(payload);
      inserted += 1;
    }

    await logActivity(req, {
      action: 'Backup Restore',
      entityType: collection.label,
      details: `${inserted} inserted, ${skipped} skipped`
    });

    res.status(200).json({ success: true, data: { inserted, skipped, recordsFound: records.length } });
  } catch (error) {
    next(error);
  }
};
