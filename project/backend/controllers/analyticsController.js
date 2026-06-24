const Company = require('../models/Company');
const Product = require('../models/Product');
const Service = require('../models/Service');
const Order = require('../models/Order');

const getDateFilter = (range = 'all') => {
  const now = new Date();
  const start = new Date(now);

  if (range === 'today') {
    start.setHours(0, 0, 0, 0);
    return { createdAt: { $gte: start } };
  }

  if (range === '7d') {
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return { createdAt: { $gte: start } };
  }

  if (range === '30d') {
    start.setDate(start.getDate() - 29);
    start.setHours(0, 0, 0, 0);
    return { createdAt: { $gte: start } };
  }

  return {};
};

const escapeCsv = (value = '') => {
  const stringValue = value === null || value === undefined ? '' : String(value);
  return `"${stringValue.replace(/"/g, '""')}"`;
};

const escapeHtml = (value = '') => {
  return String(value === null || value === undefined ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toISOString();
};

exports.getAnalytics = async (req, res, next) => {
  try {
    const range = ['today', '7d', '30d', 'all'].includes(req.query.range)
      ? req.query.range
      : 'all';
    const orderFilter = getDateFilter(range);

    const [
      totalCompanies,
      totalProducts,
      totalServices,
      totalRequests,
      newRequests,
      totalFollowUps,
      totalContacted,
      totalConfirmed,
      completedRequests,
      totalLeads,
      convertedLeads,
      requestsByType,
      requestsByStatus,
      mostRequestedItems
    ] = await Promise.all([
      Company.countDocuments(),
      Product.countDocuments(),
      Service.countDocuments(),
      Order.countDocuments(orderFilter),
      Order.countDocuments({ ...orderFilter, status: 'New' }),
      Order.countDocuments({ ...orderFilter, nextFollowUpDate: { $exists: true, $ne: null } }),
      Order.countDocuments({ ...orderFilter, status: 'Contacted' }),
      Order.countDocuments({ ...orderFilter, status: 'Confirmed' }),
      Order.countDocuments({ ...orderFilter, status: 'Completed' }),
      Order.countDocuments(orderFilter),
      Order.countDocuments({ ...orderFilter, leadStatus: 'Converted' }),
      Order.aggregate([{ $match: orderFilter }, { $group: { _id: '$type', count: { $sum: 1 } } }]),
      Order.aggregate([{ $match: orderFilter }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Order.aggregate([
        { $match: orderFilter },
        { $group: { _id: { item: '$item', type: '$type' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        range,
        cards: {
          totalCompanies,
          totalProducts,
          totalServices,
          totalRequests,
          newRequests,
          totalFollowUps,
          totalContacted,
          totalConfirmed,
          completedRequests,
          totalLeads,
          convertedLeads,
          conversionRate: totalLeads ? Number(((convertedLeads / totalLeads) * 100).toFixed(2)) : 0
        },
        requestsByType,
        requestsByStatus,
        mostRequestedItems
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.exportRequests = async (req, res, next) => {
  try {
    const format = req.query.format === 'excel' ? 'excel' : 'csv';
    const range = ['today', '7d', '30d', 'all'].includes(req.query.range)
      ? req.query.range
      : 'all';
    const orders = await Order.find(getDateFilter(range))
      .sort({ createdAt: -1 })
      .select('customerName customerPhone item status createdAt')
      .lean();

    if (format === 'excel') {
      const rows = orders.map(order => `
        <tr>
          <td>${escapeHtml(order.customerName)}</td>
          <td>${escapeHtml(order.customerPhone)}</td>
          <td>${escapeHtml(order.item)}</td>
          <td>${escapeHtml(order.status)}</td>
          <td>${escapeHtml(formatDate(order.createdAt))}</td>
        </tr>
      `).join('');

      res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="aarglobe-requests-${range}.xls"`);
      return res.send(`
        <table>
          <thead><tr><th>Customer</th><th>Phone</th><th>Item</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      `);
    }

    const header = ['Customer', 'Phone', 'Item', 'Status', 'Date'];
    const lines = orders.map(order => [
      order.customerName,
      order.customerPhone,
      order.item,
      order.status,
      formatDate(order.createdAt)
    ].map(escapeCsv).join(','));

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="aarglobe-requests-${range}.csv"`);
    res.send([header.map(escapeCsv).join(','), ...lines].join('\n'));
  } catch (error) {
    next(error);
  }
};
