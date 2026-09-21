import nodemailer from 'nodemailer';

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
  if (!host) missing.push('SMTP_HOST');
  if (!user) missing.push('SMTP_USER');
  if (!pass) missing.push('SMTP_PASS');

  if (missing.length > 0) {
    const errorMsg = `SMTP configuration incomplete. Missing environment variable(s): ${missing.join(', ')}`;
    throw new Error(errorMsg);
  }

  return {
    host,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
    user,
    pass,
    from: process.env.MAIL_FROM || user,
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
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function verifyEmailTransporter() {
  try {
    const config = validateSmtpConfig();
    const transporter = getTransporter();
    await transporter.verify();
    return {
      success: true,
      message: `SMTP Transporter verified successfully for ${config.host}:${config.port}`,
    };
  } catch (err) {
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
