const keys = require('../config/keys');
const Notification = require('../models/Notification');
const logger = require('../utils/logger');
const axios = require('axios');

class NotificationService {
  /**
   * Log notification to MongoDB and send via enabled channel
   * @param {object} params 
   * @param {string} params.userId 
   * @param {string} params.role 
   * @param {string} params.type - email, sms, whatsapp, in_app
   * @param {string} params.recipient 
   * @param {string} params.subject 
   * @param {string} params.body 
   * @param {string} params.orderId 
   */
  async notify({ userId, role = 'customer', type, recipient, subject, body, orderId }) {
    // Create DB entry
    const notification = new Notification({
      user_id: userId,
      role,
      type,
      recipient,
      subject,
      body,
      status: 'pending',
      order_id: orderId
    });

    try {
      if (type === 'email') {
        await this.sendEmail(recipient, subject, body);
      } else if (type === 'whatsapp') {
        await this.sendWhatsApp(recipient, body);
      } else if (type === 'sms') {
        await this.sendSMS(recipient, body);
      } else {
        // In-app
        logger.info(`In-app notification queued for user ${userId || role}: ${body}`);
      }

      notification.status = 'sent';
      await notification.save();
      return notification;
    } catch (error) {
      notification.status = 'failed';
      notification.error = error.message;
      await notification.save();
      logger.error(`Notification failed: ${error.message}`);
      return notification;
    }
  }

  /**
   * Send Email notification (via SMTP if credentials are provided)
   */
  async sendEmail(to, subject, body) {
    logger.info(`[Email Dispatch] To: ${to} | Subject: ${subject}`);
    
    if (!keys.SMTP_HOST || !keys.SMTP_USERNAME) {
      logger.warn('SMTP credentials not configured. Email logged to DB but not dispatched.');
      return;
    }

    try {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: keys.SMTP_HOST,
        port: keys.SMTP_PORT,
        secure: keys.SMTP_PORT === 465, // true for 465, false for other ports
        auth: {
          user: keys.SMTP_USERNAME,
          pass: keys.SMTP_PASSWORD
        }
      });

      await transporter.sendMail({
        from: `"${keys.SMTP_FROM_NAME}" <${keys.SMTP_FROM_EMAIL}>`,
        to,
        subject,
        text: body,
        html: `<p>${body.replace(/\n/g, '<br>')}</p>`
      });
      logger.info(`Email successfully sent to ${to}`);
    } catch (error) {
      logger.error(`Error sending SMTP email: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send WhatsApp notification (via Meta Cloud API)
   */
  async sendWhatsApp(phone, body) {
    logger.info(`[WhatsApp Dispatch] To: ${phone} | Body: ${body}`);

    if (!keys.WHATSAPP_ACCESS_TOKEN || !keys.WHATSAPP_PHONE_NUMBER_ID) {
      logger.warn('WhatsApp API credentials not configured. WhatsApp logged to DB but not dispatched.');
      return;
    }

    try {
      const url = `https://graph.facebook.com/${keys.WHATSAPP_API_VERSION}/${keys.WHATSAPP_PHONE_NUMBER_ID}/messages`;
      
      // For templates or text messages, send standard Meta message structure
      const payload = {
        messaging_product: 'whatsapp',
        to: phone.startsWith('+') ? phone.substring(1) : phone,
        type: 'text',
        text: { body }
      };

      await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${keys.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      logger.info(`WhatsApp message successfully sent to ${phone}`);
    } catch (error) {
      const errMsg = error.response?.data?.error?.message || error.message;
      logger.error(`Error sending WhatsApp via Meta Cloud API: ${errMsg}`);
      throw new Error(`WhatsApp API error: ${errMsg}`);
    }
  }

  /**
   * Send SMS notification
   */
  async sendSMS(phone, body) {
    logger.info(`[SMS Dispatch] To: ${phone} | Body: ${body}`);
    // Place SMS provider logic here (e.g. Twilio, MSG91)
    // For now we simulate/log it, as no specific SMS provider keys are configured.
    logger.info(`SMS successfully processed for ${phone}`);
  }

  /**
   * Helper to notify administrators
   */
  async notifyAdmins(subject, body, orderId = null) {
    logger.info(`[Admin Alert] Subject: ${subject} | Details: ${body}`);
    // Logs notification for role 'admin'
    await this.notify({
      role: 'admin',
      type: 'in_app',
      recipient: 'admin@naripehnawa.com',
      subject,
      body,
      orderId
    });
  }
}

module.exports = new NotificationService();
