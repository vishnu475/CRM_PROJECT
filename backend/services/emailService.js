import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');

dotenv.config({ path: envPath });

let transporterInstance = null;

/**
 * Validates that necessary SMTP environment variables are configured.
 * Throws a clear error if required variables are missing, without exposing sensitive values.
 */
function validateSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  const missing = [];
  if (!host || !host.trim()) missing.push('SMTP_HOST');
  if (!user || !user.trim()) missing.push('SMTP_USER');
  if (!pass || !pass.trim()) missing.push('SMTP_PASS');

  if (missing.length > 0) {
    const errorMsg = `SMTP configuration incomplete. Missing environment variable(s): ${missing.join(', ')}`;
    throw new Error(errorMsg);
  }

  return {
    host: host.trim(),
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
    user: user.trim(),
    pass: pass.trim(),
    from: (process.env.MAIL_FROM && process.env.MAIL_FROM.trim()) ? process.env.MAIL_FROM.trim() : user.trim(),
  };
}

/**
 * Returns a singleton Nodemailer SMTP transporter instance.
 * Reuses the existing transporter rather than creating a new one for each email.
 */
function getTransporter() {
  if (transporterInstance) {
    return transporterInstance;
  }

  const config = validateSmtpConfig();

  transporterInstance = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
  });

  return transporterInstance;
}

/**
 * Verifies the connection and authentication with the configured SMTP server.
 * Logs safe diagnostic status to console without exposing passwords or tokens.
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function verifyEmailTransporter() {
  const hostConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_HOST.trim());
  const userConfigured = !!(process.env.SMTP_USER && process.env.SMTP_USER.trim());
  const passConfigured = !!(process.env.SMTP_PASS && process.env.SMTP_PASS.trim());

  console.log(`[SMTP] Host configured: ${hostConfigured}`);
  console.log(`[SMTP] User configured: ${userConfigured}`);
  console.log(`[SMTP] Password configured: ${passConfigured}`);

  try {
    const config = validateSmtpConfig();
    const transporter = getTransporter();
    await transporter.verify();
    console.log(`[SMTP] Transport verification: SUCCESS`);
    return {
      success: true,
      message: `SMTP Transporter verified successfully for ${config.host}:${config.port}`,
    };
  } catch (err) {
    console.error(`[SMTP] Transport verification: FAILED`);
    console.error(`[SMTP] Error: ${err.message || 'SMTP Transporter verification failed'}`);
    return {
      success: false,
      message: err.message || 'SMTP Transporter verification failed',
    };
  }
}

/**
 * Sends an email using Nodemailer.
 * 
 * @param {Object} options
 * @param {string|string[]} options.to - Recipient email address(es)
 * @param {string} options.subject - Subject line
 * @param {string} [options.text] - Plain text body
 * @param {string} [options.html] - HTML body
 * @param {Array} [options.attachments] - Array of Nodemailer attachment objects
 * @param {string} [options.from] - Optional custom sender address
 * @returns {Promise<{ success: boolean, messageId?: string, message?: string }>}
 */
export async function sendEmail({ to, subject, text, html, attachments, from }) {
  try {
    if (!to) {
      throw new Error('Recipient email ("to") is required.');
    }
    if (!subject) {
      throw new Error('Email "subject" is required.');
    }
    if (!text && !html) {
      throw new Error('Email body ("text" or "html") is required.');
    }

    if (process.env.MOCK_EMAIL === 'true') {
      return {
        success: true,
        messageId: `MOCK-MSG-${Date.now()}`,
        response: '250 OK Mocked Email Sent',
      };
    }

    const config = validateSmtpConfig();
    const transporter = getTransporter();

    const mailOptions = {
      from: from || config.from,
      to,
      subject,
      text,
      html,
      attachments,
    };

    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      messageId: info.messageId,
      response: info.response,
    };
  } catch (err) {
    console.error(`[SMTP] Email Delivery Error: ${err.message || 'Failed to send email via SMTP service'}`);
    return {
      success: false,
      message: err.message || 'Failed to send email via SMTP service',
    };
  }
}

/**
 * Utility function to reset transporter (useful for testing or config changes)
 */
export function resetTransporter() {
  transporterInstance = null;
}
