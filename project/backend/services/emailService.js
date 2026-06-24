const nodemailer = require('nodemailer');

/**
 * Send an email notification (optional feature)
 * Used for admin alerts or customer receipts if configured.
 */
const sendEmail = async ({ to, subject, text, html }) => {
  // Only attempt if email credentials are provided
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('Skipping email notification: Email credentials not configured in .env');
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail', // or your preferred service
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: `"AAR GLOBE" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

module.exports = { sendEmail };
