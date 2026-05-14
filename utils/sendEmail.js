const nodemailer = require("nodemailer");
const https = require("https");

const sendResetEmail = async (toEmail, resetLink) => {
  const expiryMinutes = process.env.RESET_TOKEN_EXPIRY || 15;

  const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  const mailOptions = {
    from: `"Password Reset" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Password Reset Request",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
        <p style="color: #666;">You requested to reset your password. Click the button below to reset it.</p>
        <p style="color: #e74c3c; font-weight: bold;">⚠️ This link expires in ${expiryMinutes} minutes.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #4f46e5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">
            Reset Password
          </a>
        </div>
        <p style="color: #999; font-size: 12px;">Or copy and paste this link:</p>
        <p style="color: #4f46e5; font-size: 12px; word-break: break-all;">${resetLink}</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendResetEmail };