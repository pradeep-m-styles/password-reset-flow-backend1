const nodemailer = require("nodemailer");

/**
 * Creates a nodemailer transporter using Gmail 
 */
const nodemailer = require("nodemailer");

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
    ciphers: "SSLv3"
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

/**
 * Sends a password reset email to the user
 * @param {string} toEmail - Recipient email address
 * @param {string} resetLink - The full reset URL with token
 */
const sendResetEmail = async (toEmail, resetLink) => {
  const expiryMinutes = process.env.RESET_TOKEN_EXPIRY || 15;

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
          <a href="${resetLink}" 
             style="background-color: #4f46e5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">
            Reset Password
          </a>
        </div>
        <p style="color: #999; font-size: 12px;">Or copy and paste this link in your browser:</p>
        <p style="color: #4f46e5; font-size: 12px; word-break: break-all;">${resetLink}</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">
          If you did not request this, please ignore this email. Your password will remain unchanged.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendResetEmail };
