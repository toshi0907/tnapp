const schedule = require('node-schedule');
const axios = require('axios');
const nodemailer = require('nodemailer');
const reminderStorage = require('../database/reminderStorage');
require('dotenv').config();

class NotificationService {
  constructor() {
    this.jobs = new Map(); // Store scheduled jobs
    this.emailTransporter = this.createEmailTransporter();
  }

  createEmailTransporter() {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('SMTP configuration not found. Email notifications will be disabled.');
      return null;
    }

    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: (process.env.SMTP_SECURE === 'true') || false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async initializeSchedules() {
    console.log('🔄 Initializing reminder schedules...');
    
    try {
      const pendingReminders = await reminderStorage.getPendingReminders();
      
      for (const reminder of pendingReminders) {
        await this.scheduleReminder(reminder);
      }
      
      console.log(`✅ Scheduled ${pendingReminders.length} pending reminders`);
    } catch (error) {
      console.error('❌ Error initializing schedules:', error);
    }
  }

  async scheduleReminder(reminder) {
    const notificationDate = new Date(reminder.notificationDateTime);
    
    // Skip if the notification time has already passed
    if (notificationDate <= new Date()) {
      console.log(`⏰ Reminder ${reminder.id} notification time has passed, skipping schedule`);
      return;
    }

    const job = schedule.scheduleJob(notificationDate, async () => {
      await this.sendNotification(reminder);
    });

    if (job) {
      this.jobs.set(reminder.id, job);
      console.log(`📅 Scheduled reminder ${reminder.id} for ${notificationDate.toISOString()}`);
    } else {
      console.error(`❌ Failed to schedule reminder ${reminder.id}`);
    }
  }

  async sendNotification(reminder) {
    try {
      console.log(`📢 Sending notification for reminder ${reminder.id}: ${reminder.title}`);
      
      let success = false;
      
      if (reminder.notificationMethod === 'webhook') {
        success = await this.sendWebhookNotification(reminder);
      } else if (reminder.notificationMethod === 'email') {
        success = await this.sendEmailNotification(reminder);
      } else {
        console.error(`❌ Unknown notification method: ${reminder.notificationMethod}`);
        return;
      }

      if (success) {
        // Update reminder status
        await reminderStorage.updateReminder(reminder.id, {
          notificationStatus: 'sent',
          lastNotificationDateTime: new Date().toISOString()
        });

        // Handle repeat settings
        if (reminder.repeatSettings) {
          await this.handleRepeatReminder(reminder);
        }

        // Remove from scheduled jobs
        this.jobs.delete(reminder.id);
        
        console.log(`✅ Notification sent successfully for reminder ${reminder.id}`);
      } else {
        console.error(`❌ Failed to send notification for reminder ${reminder.id}`);
      }
      
    } catch (error) {
      console.error(`❌ Error sending notification for reminder ${reminder.id}:`, error);
    }
  }

  async sendWebhookNotification(reminder) {
    if (!process.env.WEBHOOK_URL) {
      console.error('❌ WEBHOOK_URL not configured');
      return false;
    }

    try {
      const payload = {
        id: reminder.id,
        title: reminder.title,
        message: reminder.message,
        notificationDateTime: reminder.notificationDateTime,
        timezone: reminder.timezone,
        category: reminder.category,
        tags: reminder.tags
      };

      // Add title and message as query parameters
      const url = new URL(process.env.WEBHOOK_URL);
      url.searchParams.append('title', reminder.title || '');
      if (reminder.message) {
        url.searchParams.append('message', reminder.message);
      }

      const response = await axios.post(url.toString(), payload, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'TN-API-Server-Reminder'
        },
        timeout: 10000
      });

      console.log(`🔗 Webhook sent (${response.status}): ${reminder.title}`);
      return response.status >= 200 && response.status < 300;
      
    } catch (error) {
      console.error('❌ Webhook error:', error.message);
      return false;
    }
  }

  async sendEmailNotification(reminder) {
    if (!this.emailTransporter) {
      console.error('❌ Email transporter not configured');
      return false;
    }

    if (!process.env.EMAIL_TO) {
      console.error('❌ EMAIL_TO not configured');
      return false;
    }

    try {
      const mailOptions = {
        from: process.env.SMTP_USER,
        to: process.env.EMAIL_TO,
        subject: `🔔 Reminder: ${reminder.title}`,
        text: this.createEmailText(reminder),
        html: this.createEmailHtml(reminder)
      };

      const info = await this.emailTransporter.sendMail(mailOptions);
      console.log(`📧 Email sent: ${info.messageId}`);
      return true;
      
    } catch (error) {
      console.error('❌ Email error:', error.message);
      return false;
    }
  }

  createEmailText(reminder) {
    let text = `リマインダー: ${reminder.title}\n\n`;
    
    if (reminder.message) {
      text += `メッセージ: ${reminder.message}\n\n`;
    }
    
    text += `通知日時: ${new Date(reminder.notificationDateTime).toLocaleString('ja-JP', { timeZone: reminder.timezone })}\n`;
    
    if (reminder.category) {
      text += `カテゴリ: ${reminder.category}\n`;
    }
    
    if (reminder.tags && reminder.tags.length > 0) {
      text += `タグ: ${reminder.tags.join(', ')}\n`;
    }
    
    text += '\n---\nTN API Server';
    
    return text;
  }

  createEmailHtml(reminder) {
    let html = `
      <h2>🔔 リマインダー: ${reminder.title}</h2>
    `;
    
    if (reminder.message) {
      html += `<p><strong>メッセージ:</strong><br>${reminder.message.replace(/\n/g, '<br>')}</p>`;
    }
    
    html += `<p><strong>通知日時:</strong> ${new Date(reminder.notificationDateTime).toLocaleString('ja-JP', { timeZone: reminder.timezone })}</p>`;
    
    if (reminder.category) {
      html += `<p><strong>カテゴリ:</strong> ${reminder.category}</p>`;
    }
    
    if (reminder.tags && reminder.tags.length > 0) {
      html += `<p><strong>タグ:</strong> ${reminder.tags.join(', ')}</p>`;
    }
    
    html += '<hr><p><small>TN API Server</small></p>';
    
    return html;
  }

  async handleRepeatReminder(reminder) {
    const { repeatSettings } = reminder;
    
    if (!repeatSettings || !repeatSettings.interval) {
      return;
    }

    try {
      let nextDateTime;
      const currentDateTime = new Date(reminder.notificationDateTime);
      
      switch (repeatSettings.interval) {
        case 'daily':
          nextDateTime = new Date(currentDateTime.getTime() + 24 * 60 * 60 * 1000);
          break;
        case 'weekly':
          nextDateTime = new Date(currentDateTime.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case 'monthly':
          nextDateTime = new Date(currentDateTime);
          nextDateTime.setMonth(nextDateTime.getMonth() + 1);
          break;
        case 'yearly':
          nextDateTime = new Date(currentDateTime);
          nextDateTime.setFullYear(nextDateTime.getFullYear() + 1);
          break;
        default:
          console.error(`❌ Unknown repeat interval: ${repeatSettings.interval}`);
          return;
      }

      // Check if we should continue repeating
      if (repeatSettings.endDate && nextDateTime > new Date(repeatSettings.endDate)) {
        console.log(`🔄 Repeat ended for reminder ${reminder.id} (past end date)`);
        return;
      }

      if (repeatSettings.maxOccurrences && repeatSettings.currentOccurrence >= repeatSettings.maxOccurrences) {
        console.log(`🔄 Repeat ended for reminder ${reminder.id} (max occurrences reached)`);
        return;
      }

      // Create new reminder for next occurrence
      const nextReminder = {
        ...reminder,
        id: Date.now() + Math.floor(Math.random() * 1000), // Ensure unique ID
        notificationDateTime: nextDateTime.toISOString(),
        notificationStatus: 'pending',
        lastNotificationDateTime: null,
        repeatSettings: {
          ...repeatSettings,
          currentOccurrence: (repeatSettings.currentOccurrence || 1) + 1
        }
      };

      await reminderStorage.addReminder(nextReminder);
      await this.scheduleReminder(nextReminder);
      
      console.log(`🔄 Created repeat reminder ${nextReminder.id} for ${nextDateTime.toISOString()}`);
      
    } catch (error) {
      console.error(`❌ Error handling repeat reminder ${reminder.id}:`, error);
    }
  }

  async rescheduleReminder(reminder) {
    // Cancel existing job if any
    if (this.jobs.has(reminder.id)) {
      this.jobs.get(reminder.id).cancel();
      this.jobs.delete(reminder.id);
    }

    // Schedule new job
    await this.scheduleReminder(reminder);
  }

  cancelReminder(reminderId) {
    if (this.jobs.has(reminderId)) {
      this.jobs.get(reminderId).cancel();
      this.jobs.delete(reminderId);
      console.log(`🚫 Cancelled scheduled reminder ${reminderId}`);
    }
  }

  getScheduledJobsCount() {
    return this.jobs.size;
  }

  async testNotification(method = 'webhook') {
    const testReminder = {
      id: 'test-' + Date.now(),
      title: 'Test Notification',
      message: 'This is a test notification from TN API Server',
      notificationDateTime: new Date().toISOString(),
      timezone: 'Asia/Tokyo',
      category: 'test',
      tags: ['test', 'notification']
    };

    if (method === 'webhook') {
      return await this.sendWebhookNotification(testReminder);
    } else if (method === 'email') {
      return await this.sendEmailNotification(testReminder);
    }

    return false;
  }
}

module.exports = new NotificationService();