/**
 * リマインダーデータストレージクラス
 * JSONファイルを使用してリマインダーデータの永続化を行う
 * スケジュール管理、通知設定、繰り返し設定機能を提供
 */

// ファイルシステム操作とパス操作のモジュールをインポート
const fs = require('fs').promises;  // ファイルシステム操作（Promise版）
const path = require('path');       // パス操作ユーティリティ

/**
 * リマインダーデータの管理を行うクラス
 * シングルトンパターンで実装され、JSONファイルによる永続化を提供
 * 通知スケジューリング、繰り返し設定、通知手段管理をサポート
 */
class ReminderStorage {
  /**
   * コンストラクタ
   * @param {string} filename - データファイル名（デフォルト: 'reminders.json'）
   */
  constructor(filename = 'reminders.json') {
    // データディレクトリのパスを設定（プロジェクトルート/data）
    this.dataDir = path.join(__dirname, '../../data');
    // データファイルの完全パスを設定
    this.filePath = path.join(this.dataDir, filename);
  }

  /**
   * データファイルの存在確認と初期化
   * ファイルが存在しない場合は空配列のJSONファイルを作成
   */
  async ensureDataFile() {
    try {
      // ファイルの存在確認（アクセス可能かチェック）
      await fs.access(this.filePath);
    } catch {
      // ファイルが存在しない場合の初期化処理
      
      // データディレクトリが存在しない場合は再帰的に作成
      await fs.mkdir(this.dataDir, { recursive: true });
      
      // 空配列の初期データファイルを作成（整形されたJSON形式）
      await fs.writeFile(this.filePath, JSON.stringify([], null, 2));
    }
  }

  /**
   * データファイルからリマインダーデータを読み込む
   * @returns {Array} リマインダーデータの配列
   */
  async readData() {
    // データファイルの存在確認・初期化
    await this.ensureDataFile();
    
    try {
      // ファイルからテキストデータを読み込み
      const data = await fs.readFile(this.filePath, 'utf-8');
      // JSONテキストをJavaScriptオブジェクトに変換して返す
      return JSON.parse(data);
    } catch (error) {
      // ファイル読み込みまたはJSON解析に失敗した場合
      console.error('Error reading reminder data file:', error);
      // エラー時は空配列を返す（フォールバック処理）
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
      url: reminderData.url || '',
      notificationDateTime: reminderData.notificationDateTime,
      notificationMethod: reminderData.notificationMethod || 'webhook',
      category: reminderData.category,
      tags: reminderData.tags || [],
      repeatSettings: reminderData.repeatSettings || null,
      notificationStatus: 'pending',
      lastNotificationDateTime: null,
      timezone: 'Asia/Tokyo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
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