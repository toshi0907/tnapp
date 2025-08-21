const fs = require('fs').promises;
const path = require('path');

class ReminderStorage {
  constructor(filename = 'reminders.json') {
    this.dataDir = path.join(__dirname, '../../data');
    this.filePath = path.join(this.dataDir, filename);
  }

  async ensureDataFile() {
    try {
      await fs.access(this.filePath);
    } catch {
      // データディレクトリが存在しない場合は作成
      await fs.mkdir(this.dataDir, { recursive: true });
      // 初期データファイルを作成
      await fs.writeFile(this.filePath, JSON.stringify([], null, 2));
    }
  }

  async readData() {
    await this.ensureDataFile();
    try {
      const data = await fs.readFile(this.filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading reminder data file:', error);
      return [];
    }
  }

  async writeData(data) {
    try {
      await this.ensureDataFile();
      await fs.writeFile(this.filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error writing reminder data file:', error);
      throw error;
    }
  }

  async getReminders() {
    return await this.readData();
  }

  async getReminderById(id) {
    const reminders = await this.readData();
    return reminders.find(reminder => reminder.id === parseInt(id));
  }

  async addReminder(reminderData) {
    const reminders = await this.readData();
    const newReminder = {
      id: Date.now(),
      title: reminderData.title,
      message: reminderData.message || '',
      notificationDateTime: reminderData.notificationDateTime,
      repeatSettings: reminderData.repeatSettings || null,
      notificationMethod: reminderData.notificationMethod || 'webhook',
      notificationStatus: 'pending',
      lastNotificationDateTime: null,
      timezone: 'Asia/Tokyo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...reminderData
    };
    
    reminders.push(newReminder);
    await this.writeData(reminders);
    return newReminder;
  }

  async updateReminder(id, updateData) {
    const reminders = await this.readData();
    const index = reminders.findIndex(reminder => reminder.id === parseInt(id));
    
    if (index === -1) {
      return null;
    }
    
    reminders[index] = {
      ...reminders[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    await this.writeData(reminders);
    return reminders[index];
  }

  async deleteReminder(id) {
    const reminders = await this.readData();
    const index = reminders.findIndex(reminder => reminder.id === parseInt(id));
    
    if (index === -1) {
      return false;
    }
    
    reminders.splice(index, 1);
    await this.writeData(reminders);
    return true;
  }

  async getReminderCount() {
    const reminders = await this.readData();
    return reminders.length;
  }

  async getPendingReminders() {
    const reminders = await this.readData();
    return reminders.filter(reminder => reminder.notificationStatus === 'pending');
  }

  async getSentReminders() {
    const reminders = await this.readData();
    return reminders.filter(reminder => reminder.notificationStatus === 'sent');
  }

  async getPendingCount() {
    const pendingReminders = await this.getPendingReminders();
    return pendingReminders.length;
  }

  async getSentCount() {
    const sentReminders = await this.getSentReminders();
    return sentReminders.length;
  }

  async getCategories() {
    const reminders = await this.readData();
    const categories = [...new Set(reminders.map(reminder => reminder.category).filter(Boolean))];
    return categories.sort();
  }

  async getTags() {
    const reminders = await this.readData();
    const allTags = reminders.flatMap(reminder => reminder.tags || []);
    const uniqueTags = [...new Set(allTags)];
    return uniqueTags.sort();
  }

  async getStats() {
    const reminders = await this.readData();
    const total = reminders.length;
    const pending = reminders.filter(r => r.notificationStatus === 'pending').length;
    const sent = reminders.filter(r => r.notificationStatus === 'sent').length;
    const webhook = reminders.filter(r => r.notificationMethod === 'webhook').length;
    const email = reminders.filter(r => r.notificationMethod === 'email').length;
    
    return {
      total,
      pending,
      sent,
      notificationMethods: {
        webhook,
        email
      }
    };
  }

  async getUpcomingReminders(hours = 24) {
    const reminders = await this.readData();
    const now = new Date();
    const cutoffTime = new Date(now.getTime() + (hours * 60 * 60 * 1000));
    
    return reminders.filter(reminder => {
      if (reminder.notificationStatus !== 'pending') return false;
      const notificationTime = new Date(reminder.notificationDateTime);
      return notificationTime >= now && notificationTime <= cutoffTime;
    });
  }
}

module.exports = new ReminderStorage();