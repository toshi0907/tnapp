const request = require('supertest');
const express = require('express');

// テスト用のサーバーアプリケーションを作成
const app = express();
app.use(express.json());

// テスト用のストレージモジュールをモック
jest.mock('../src/database/reminderStorage', () => {
  return {
    getReminders: jest.fn(),
    getReminderById: jest.fn(),
    addReminder: jest.fn(),
    updateReminder: jest.fn(),
    deleteReminder: jest.fn(),
    getPendingReminders: jest.fn(),
    getSentReminders: jest.fn(),
    getPendingCount: jest.fn(),
    getSentCount: jest.fn(),
    getCategories: jest.fn(),
    getTags: jest.fn(),
    getStats: jest.fn(),
    getUpcomingReminders: jest.fn()
  };
});

// 通知サービスをモック
jest.mock('../src/services/notificationService', () => {
  return {
    scheduleReminder: jest.fn(),
    rescheduleReminder: jest.fn(),
    cancelReminder: jest.fn(),
    getScheduledJobsCount: jest.fn(),
    testNotification: jest.fn()
  };
});

const reminderStorage = require('../src/database/reminderStorage');
const notificationService = require('../src/services/notificationService');
const reminderRouter = require('../src/routes/reminders');

app.use('/api/reminders', reminderRouter);

describe('Reminders API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/reminders', () => {
    test('すべてのリマインダーの取得に成功', async () => {
      const mockReminders = [
        {
          id: 1,
          title: 'テストリマインダー1',
          message: 'テストメッセージ1',
          notificationDateTime: '2025-08-15T09:00:00.000Z',
          notificationMethod: 'webhook',
          notificationStatus: 'pending',
          category: 'work',
          tags: ['meeting', 'important'],
          createdAt: '2025-08-01T10:00:00.000Z',
          updatedAt: '2025-08-01T10:00:00.000Z'
        },
        {
          id: 2,
          title: 'テストリマインダー2',
          message: 'テストメッセージ2',
          notificationDateTime: '2025-08-16T14:00:00.000Z',
          notificationMethod: 'email',
          notificationStatus: 'sent',
          category: 'personal',
          tags: ['health'],
          createdAt: '2025-08-01T11:00:00.000Z',
          updatedAt: '2025-08-01T11:00:00.000Z'
        }
      ];

      reminderStorage.getReminders.mockResolvedValue(mockReminders);

      const response = await request(app)
        .get('/api/reminders')
        .expect(200);

      expect(response.body).toEqual(mockReminders);
      expect(reminderStorage.getReminders).toHaveBeenCalledTimes(1);
    });

    test('ステータスでフィルタリングしたリマインダーの取得', async () => {
      const mockReminders = [
        {
          id: 1,
          title: 'ペンディングリマインダー',
          notificationStatus: 'pending'
        }
      ];

      reminderStorage.getReminders.mockResolvedValue([
        { id: 1, notificationStatus: 'pending' },
        { id: 2, notificationStatus: 'sent' }
      ]);

      const response = await request(app)
        .get('/api/reminders?status=pending')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].notificationStatus).toBe('pending');
    });

    test('通知手段でフィルタリングしたリマインダーの取得', async () => {
      reminderStorage.getReminders.mockResolvedValue([
        { id: 1, notificationMethod: 'webhook' },
        { id: 2, notificationMethod: 'email' }
      ]);

      const response = await request(app)
        .get('/api/reminders?method=webhook')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].notificationMethod).toBe('webhook');
    });

    test('カテゴリでフィルタリングしたリマインダーの取得', async () => {
      reminderStorage.getReminders.mockResolvedValue([
        { id: 1, category: 'work' },
        { id: 2, category: 'personal' }
      ]);

      const response = await request(app)
        .get('/api/reminders?category=work')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].category).toBe('work');
    });

    test('今後のリマインダーの取得', async () => {
      const mockUpcoming = [
        {
          id: 1,
          title: '今後のリマインダー',
          notificationDateTime: '2025-08-15T09:00:00.000Z'
        }
      ];

      reminderStorage.getUpcomingReminders.mockResolvedValue(mockUpcoming);

      const response = await request(app)
        .get('/api/reminders?upcoming=24')
        .expect(200);

      expect(response.body).toEqual(mockUpcoming);
      expect(reminderStorage.getUpcomingReminders).toHaveBeenCalledWith(24);
    });

    test('データベースエラー時の処理', async () => {
      reminderStorage.getReminders.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/reminders')
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to fetch reminders' });
    });
  });

  describe('GET /api/reminders/:id', () => {
    test('特定のリマインダーの取得に成功', async () => {
      const mockReminder = {
        id: 1,
        title: 'テストリマインダー',
        message: 'テストメッセージ',
        notificationDateTime: '2025-08-15T09:00:00.000Z',
        notificationMethod: 'webhook',
        notificationStatus: 'pending'
      };

      reminderStorage.getReminderById.mockResolvedValue(mockReminder);

      const response = await request(app)
        .get('/api/reminders/1')
        .expect(200);

      expect(response.body).toEqual(mockReminder);
      expect(reminderStorage.getReminderById).toHaveBeenCalledWith('1');
    });

    test('存在しないリマインダーのリクエスト', async () => {
      reminderStorage.getReminderById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/reminders/999')
        .expect(404);

      expect(response.body).toEqual({ error: 'Reminder not found' });
    });

    test('データベースエラー時の処理', async () => {
      reminderStorage.getReminderById.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/reminders/1')
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to fetch reminder' });
    });
  });

  describe('POST /api/reminders', () => {
    test('新しいリマインダーの作成に成功', async () => {
      const newReminderData = {
        title: '新しいリマインダー',
        message: 'テストメッセージ',
        notificationDateTime: '2025-08-15T09:00:00.000Z',
        notificationMethod: 'webhook',
        category: 'work',
        tags: ['meeting', 'important']
      };

      const mockCreatedReminder = {
        id: 1,
        ...newReminderData,
        notificationStatus: 'pending',
        timezone: 'Asia/Tokyo',
        createdAt: '2025-08-01T10:00:00.000Z',
        updatedAt: '2025-08-01T10:00:00.000Z'
      };

      reminderStorage.addReminder.mockResolvedValue(mockCreatedReminder);
      notificationService.scheduleReminder.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/reminders')
        .send(newReminderData)
        .expect(201);

      expect(response.body).toEqual(mockCreatedReminder);
      expect(reminderStorage.addReminder).toHaveBeenCalledWith(expect.objectContaining({
        title: newReminderData.title,
        message: newReminderData.message,
        notificationDateTime: newReminderData.notificationDateTime,
        notificationMethod: 'webhook',
        category: newReminderData.category,
        tags: newReminderData.tags
      }));
      expect(notificationService.scheduleReminder).toHaveBeenCalledWith(mockCreatedReminder);
    });

    test('必須フィールドなしでの作成', async () => {
      const response = await request(app)
        .post('/api/reminders')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Title is required');
    });

    test('空のタイトルでの作成', async () => {
      const response = await request(app)
        .post('/api/reminders')
        .send({ title: '   ', notificationDateTime: '2025-08-15T09:00:00.000Z' })
        .expect(400);

      expect(response.body.error).toBe('Title is required');
    });

    test('通知日時なしでの作成', async () => {
      const response = await request(app)
        .post('/api/reminders')
        .send({ title: 'テストリマインダー' })
        .expect(400);

      expect(response.body.error).toBe('Notification date time is required');
    });

    test('無効な通知日時フォーマットでの作成', async () => {
      const response = await request(app)
        .post('/api/reminders')
        .send({ 
          title: 'テストリマインダー', 
          notificationDateTime: 'invalid-date' 
        })
        .expect(400);

      expect(response.body.error).toBe('Invalid notification date time format');
    });

    test('過去の通知日時での作成', async () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const response = await request(app)
        .post('/api/reminders')
        .send({ 
          title: 'テストリマインダー', 
          notificationDateTime: pastDate 
        })
        .expect(400);

      expect(response.body.error).toBe('Notification date time must be in the future');
    });

    test('無効な通知手段での作成', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      
      const response = await request(app)
        .post('/api/reminders')
        .send({ 
          title: 'テストリマインダー', 
          notificationDateTime: futureDate,
          notificationMethod: 'invalid-method'
        })
        .expect(400);

      expect(response.body.error).toBe('Notification method must be one of: webhook, email');
    });

    test('繰り返し設定付きでの作成', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const newReminderData = {
        title: '繰り返しリマインダー',
        notificationDateTime: futureDate,
        repeatSettings: {
          interval: 'daily',
          endDate: endDate,
          maxOccurrences: 5
        }
      };

      const mockCreatedReminder = {
        id: 1,
        ...newReminderData,
        notificationMethod: 'webhook',
        notificationStatus: 'pending',
        repeatSettings: {
          ...newReminderData.repeatSettings,
          currentOccurrence: 1
        }
      };

      reminderStorage.addReminder.mockResolvedValue(mockCreatedReminder);
      notificationService.scheduleReminder.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/reminders')
        .send(newReminderData)
        .expect(201);

      expect(response.body.repeatSettings.currentOccurrence).toBe(1);
    });

    test('データベースエラー時の処理', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      
      reminderStorage.addReminder.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/reminders')
        .send({ 
          title: 'テストリマインダー', 
          notificationDateTime: futureDate 
        })
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to create reminder' });
    });
  });

  describe('PUT /api/reminders/:id', () => {
    test('リマインダーの更新に成功', async () => {
      const existingReminder = {
        id: 1,
        title: '既存のリマインダー',
        notificationStatus: 'pending'
      };

      const updateData = {
        title: '更新されたリマインダー',
        message: '更新されたメッセージ'
      };

      const updatedReminder = {
        ...existingReminder,
        ...updateData,
        updatedAt: '2025-08-01T11:00:00.000Z'
      };

      reminderStorage.getReminderById.mockResolvedValue(existingReminder);
      reminderStorage.updateReminder.mockResolvedValue(updatedReminder);

      const response = await request(app)
        .put('/api/reminders/1')
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual(updatedReminder);
      expect(reminderStorage.updateReminder).toHaveBeenCalledWith('1', expect.objectContaining({
        title: updateData.title,
        message: updateData.message
      }));
    });

    test('存在しないリマインダーの更新', async () => {
      reminderStorage.getReminderById.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/reminders/999')
        .send({ title: '更新されたタイトル' })
        .expect(404);

      expect(response.body).toEqual({ error: 'Reminder not found' });
    });

    test('空のタイトルでの更新', async () => {
      const existingReminder = { id: 1, title: '既存のリマインダー' };
      reminderStorage.getReminderById.mockResolvedValue(existingReminder);

      const response = await request(app)
        .put('/api/reminders/1')
        .send({ title: '   ' })
        .expect(400);

      expect(response.body.error).toBe('Title cannot be empty');
    });

    test('通知日時更新時のスケジュール再設定', async () => {
      const existingReminder = { 
        id: 1, 
        title: '既存のリマインダー',
        notificationStatus: 'pending' 
      };
      
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const updatedReminder = {
        ...existingReminder,
        notificationDateTime: futureDate,
        notificationStatus: 'pending'
      };

      reminderStorage.getReminderById.mockResolvedValue(existingReminder);
      reminderStorage.updateReminder.mockResolvedValue(updatedReminder);
      notificationService.rescheduleReminder.mockResolvedValue(true);

      const response = await request(app)
        .put('/api/reminders/1')
        .send({ notificationDateTime: futureDate })
        .expect(200);

      expect(notificationService.rescheduleReminder).toHaveBeenCalledWith(updatedReminder);
    });

    test('データベースエラー時の処理', async () => {
      reminderStorage.getReminderById.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .put('/api/reminders/1')
        .send({ title: '更新されたタイトル' })
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to update reminder' });
    });
  });

  describe('DELETE /api/reminders/:id', () => {
    test('リマインダーの削除に成功', async () => {
      reminderStorage.deleteReminder.mockResolvedValue(true);
      notificationService.cancelReminder.mockReturnValue(true);

      const response = await request(app)
        .delete('/api/reminders/1')
        .expect(200);

      expect(response.body).toEqual({ message: 'Reminder deleted successfully' });
      expect(reminderStorage.deleteReminder).toHaveBeenCalledWith('1');
      expect(notificationService.cancelReminder).toHaveBeenCalledWith(1);
    });

    test('存在しないリマインダーの削除', async () => {
      reminderStorage.deleteReminder.mockResolvedValue(false);

      const response = await request(app)
        .delete('/api/reminders/999')
        .expect(404);

      expect(response.body).toEqual({ error: 'Reminder not found' });
    });

    test('データベースエラー時の処理', async () => {
      reminderStorage.deleteReminder.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .delete('/api/reminders/1')
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to delete reminder' });
    });
  });

  describe('Meta endpoints', () => {
    test('GET /api/reminders/meta/stats - 統計情報の取得', async () => {
      const mockStats = {
        total: 10,
        pending: 6,
        sent: 4,
        notificationMethods: {
          webhook: 7,
          email: 3
        }
      };

      reminderStorage.getStats.mockResolvedValue(mockStats);
      notificationService.getScheduledJobsCount.mockReturnValue(6);

      const response = await request(app)
        .get('/api/reminders/meta/stats')
        .expect(200);

      expect(response.body).toEqual({
        ...mockStats,
        scheduledJobs: 6
      });
    });

    test('GET /api/reminders/meta/categories - カテゴリ一覧の取得', async () => {
      const mockCategories = ['work', 'personal', 'health'];
      reminderStorage.getCategories.mockResolvedValue(mockCategories);

      const response = await request(app)
        .get('/api/reminders/meta/categories')
        .expect(200);

      expect(response.body).toEqual(mockCategories);
    });

    test('GET /api/reminders/meta/tags - タグ一覧の取得', async () => {
      const mockTags = ['important', 'urgent', 'meeting', 'health'];
      reminderStorage.getTags.mockResolvedValue(mockTags);

      const response = await request(app)
        .get('/api/reminders/meta/tags')
        .expect(200);

      expect(response.body).toEqual(mockTags);
    });
  });

  describe('POST /api/reminders/test/:method', () => {
    test('webhook通知テストの成功', async () => {
      notificationService.testNotification.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/reminders/test/webhook')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Test webhook notification sent successfully'
      });
      expect(notificationService.testNotification).toHaveBeenCalledWith('webhook');
    });

    test('email通知テストの成功', async () => {
      notificationService.testNotification.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/reminders/test/email')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Test email notification sent successfully'
      });
      expect(notificationService.testNotification).toHaveBeenCalledWith('email');
    });

    test('無効な通知手段でのテスト', async () => {
      const response = await request(app)
        .post('/api/reminders/test/invalid')
        .expect(400);

      expect(response.body.error).toBe('Invalid notification method. Must be webhook or email');
    });

    test('通知テストの失敗', async () => {
      notificationService.testNotification.mockResolvedValue(false);

      const response = await request(app)
        .post('/api/reminders/test/webhook')
        .expect(200);

      expect(response.body).toEqual({
        success: false,
        message: 'Failed to send test webhook notification'
      });
    });
  });
});