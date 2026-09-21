import express from 'express';
import { sendEmail, verifyEmailTransporter } from '../services/emailService.js';

const router = express.Router();

/**
 * Helper function to validate email address format
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

/**
 * GET /api/email/verify
 * Optional endpoint to verify SMTP credentials and connection status
 */
router.get('/verify', async (req, res) => {
  const result = await verifyEmailTransporter();
  if (result.success) {
    return res.json(result);
  } else {
    return res.status(500).json(result);
  }
});

/**
 * POST /api/email/test
 * Validates recipient, verifies transporter, sends a simple test email,
 * and returns success/failure without exposing sensitive credentials.
 */
router.post('/test', async (req, res) => {
  const { to } = req.body || {};

  if (!to || !isValidEmail(to)) {
    return res.status(400).json({
      success: false,
      message: 'Valid recipient email address is required.',
    });
  }

  // 1. Verify SMTP Connection
  const verifyResult = await verifyEmailTransporter();
  if (!verifyResult.success) {
    return res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: verifyResult.message,
    });
  }

  // 2. Send Test Email
  const timestamp = new Date().toISOString();
  const sendResult = await sendEmail({
    to: to.trim(),
    subject: 'CRM ERP — Test Email Delivery',
    text: `Hello,

This is a test email from your CRM ERP system verifying that SMTP email delivery is operational.

Sent at: ${timestamp}`,
    html: `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <div style="display: flex; align-items: center; margin-bottom: 20px;">
          <h2 style="margin: 0; color: #4f46e5; font-size: 20px;">CRM ERP Email Service</h2>
        </div>
        <p style="color: #334155; font-size: 14px; line-height: 1.6;">Hello,</p>
        <p style="color: #334155; font-size: 14px; line-height: 1.6;">
          This is an automated test email confirming that your backend SMTP Nodemailer email service is correctly configured and capable of delivering messages.
        </p>
        <div style="margin: 20px 0; padding: 12px 16px; background-color: #f8fafc; border-left: 4px solid #6366f1; border-radius: 4px;">
          <span style="font-size: 12px; font-weight: 600; color: #475569;">Delivery Timestamp:</span>
          <code style="display: block; font-size: 12px; color: #1e293b; margin-top: 4px;">${timestamp}</code>
        </div>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
          CRM & HRMS Enterprise ERP Platform • Confidential Automation Message
        </p>
      </div>
    `,
  });

  if (sendResult.success) {
    return res.json({
      success: true,
      message: 'Test email sent successfully',
      messageId: sendResult.messageId,
    });
  } else {
    return res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: sendResult.message,
    });
  }
});

export default router;
