const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

async function sendClaimApprovedEmail({
  recipientEmail,
  recipientName,
  foundItemTitle,
  reporterName,
  reporterEmail,
}) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    throw new Error('Email credentials are not configured.');
  }

  return transporter.sendMail({
    from: `"${process.env.EMAIL_FROM || 'Campus Lost & Found'}" <${process.env.EMAIL_USER}>`,
    to: recipientEmail,
    subject: `Good news! Your lost item claim has been approved`,
    text: `
Hello ${recipientName || 'there'},

Good news! Your claim for "${foundItemTitle}" has been approved.

Here are the contact details of the person who reported the item as found:

Name: ${reporterName || 'Not provided'}
Email: ${reporterEmail}

Please contact them to coordinate the return of your item.

Regards,
Campus Lost & Found Team
    `.trim(),
  });
}

module.exports = { sendClaimApprovedEmail };