const Order = require('../models/Order');
const Notification = require('../models/Notification');
const {
  getNotificationTemplate,
  buildWhatsAppUrl
} = require('../utils/notificationTemplates');
const { logActivity } = require('../utils/activityLogger');

const createNotification = async (requestId, status) => {
  const template = getNotificationTemplate(status);
  return Notification.create({
    requestId,
    notificationType: template.type,
    type: template.type,
    message: template.message
  });
};

exports.requestOrder = async (req, res, next) => {
  try {
    const { customerName, customerPhone, type, item, amount, message } = req.body;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentDuplicate = await Order.findOne({
      customerPhone,
      item,
      createdAt: { $gte: fiveMinutesAgo }
    });

    if (recentDuplicate) {
      return res.status(429).json({
        success: false,
        message: 'Request already submitted recently.'
      });
    }

    const request = await Order.create({
      customerName,
      customerPhone,
      type,
      item,
      amount: amount === undefined || amount === '' ? null : Number(amount),
      message,
      status: 'New'
    });
    await createNotification(request._id, 'New');

    res.status(201).json({
      success: true,
      message: 'Your request has been submitted. Shop owner will contact you soon.',
      data: request
    });
  } catch (error) {
    next(error);
  }
};

exports.getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).lean();
    const orderIds = orders.map(order => order._id);
    const notifications = await Notification.find({ requestId: { $in: orderIds } })
      .sort({ createdAt: -1 })
      .lean();
    const notificationsByRequest = notifications.reduce((acc, notification) => {
      const key = String(notification.requestId);
      acc[key] = acc[key] || [];
      acc[key].push(notification);
      return acc;
    }, {});

    const data = orders.map(order => ({
      ...order,
      notificationHistory: notificationsByRequest[String(order._id)] || []
    }));

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, leadStatus, notes, lastContactDate, nextFollowUpDate, followUpNotes } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    const previousStatus = order.status;
    if (status) order.status = status;
    if (leadStatus) order.leadStatus = leadStatus;
    if (notes !== undefined) order.notes = notes;
    if (lastContactDate !== undefined) {
      order.lastContactDate = lastContactDate ? new Date(lastContactDate) : null;
    }
    if (nextFollowUpDate !== undefined) {
      order.nextFollowUpDate = nextFollowUpDate ? new Date(nextFollowUpDate) : null;
    }
    if (followUpNotes !== undefined) order.followUpNotes = followUpNotes;
    await order.save();
    if (status && status !== previousStatus && ['Contacted', 'Confirmed', 'Completed'].includes(status)) {
      await createNotification(order._id, status);
    }
    await logActivity(req, {
      action: 'Request Status Update',
      entityType: 'Request',
      entityId: order._id,
      details: `${order.item}: ${previousStatus} -> ${order.status}`
    });

    res.status(200).json({ success: true, message: 'Request updated', data: order });
  } catch (error) {
    next(error);
  }
};

exports.markContacted = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    order.status = 'Contacted';
    order.lastContactDate = new Date();
    await order.save();
    await createNotification(order._id, 'Contacted');
    await logActivity(req, {
      action: 'Request Status Update',
      entityType: 'Request',
      entityId: order._id,
      details: `${order.item}: Contacted`
    });

    res.status(200).json({ success: true, message: 'Request marked as contacted', data: order });
  } catch (error) {
    next(error);
  }
};

exports.prepareWhatsAppNotification = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    const notification = await createNotification(order._id, order.status);

    res.status(201).json({
      success: true,
      message: 'WhatsApp notification prepared',
      data: {
        notification,
        whatsappUrl: buildWhatsAppUrl(order.customerPhone, notification.message)
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.scheduleFollowUp = async (req, res, next) => {
  try {
    const { nextFollowUpDate, followUpNotes } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    order.nextFollowUpDate = new Date(nextFollowUpDate);
    if (followUpNotes !== undefined) order.followUpNotes = followUpNotes;
    await order.save();

    res.status(200).json({ success: true, message: 'Follow-up scheduled', data: order });
  } catch (error) {
    next(error);
  }
};
