const notificationTemplates = {
  New: {
    type: 'Request Received',
    message: 'Thank you for contacting AAR GLOBE. Your request has been received.'
  },
  Contacted: {
    type: 'Contacted',
    message: 'Our team has reviewed your request and will contact you shortly.'
  },
  Confirmed: {
    type: 'Confirmed',
    message: 'Your request has been confirmed.'
  },
  Completed: {
    type: 'Completed',
    message: 'Your request/service has been completed.'
  }
};

const getNotificationTemplate = (status = 'New') => {
  return notificationTemplates[status] || notificationTemplates.New;
};

const buildWhatsAppUrl = (phone = '', message = '') => {
  const cleanPhone = String(phone).replace(/\D/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
};

module.exports = {
  notificationTemplates,
  getNotificationTemplate,
  buildWhatsAppUrl
};
