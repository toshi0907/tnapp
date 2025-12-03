/**
 * データエクスポート/インポートAPIのテスト
 */

const request = require('supertest');
const { createApp } = require('../src/createApp');
const fs = require('fs').promises;
const path = require('path');

// モック
jest.mock('../src/database/bookmarkStorage', () => ({
  getBookmarks: jest.fn(),
}));

jest.mock('../src/database/reminderStorage', () => ({
  getReminders: jest.fn(),
}));

const bookmarkStorage = require('../src/database/bookmarkStorage');
const reminderStorage = require('../src/database/reminderStorage');

describe('Data Export/Import API', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createApp();
  });

  describe('GET /api/data/export', () => {
    it('全データをエクスポートできる', async () => {
      // Given
      const mockBookmarks = [
        { id: 1, title: 'Test Bookmark', url: 'https://example.com' }
      ];
      const mockReminders = [
        { id: 1, title: 'Test Reminder', notificationDateTime: '2025-12-25T10:00:00.000Z' }
      ];
      
      bookmarkStorage.getBookmarks.mockResolvedValue(mockBookmarks);
      reminderStorage.getReminders.mockResolvedValue(mockReminders);

      // When
      const response = await request(app)
        .get('/api/data/export')
        .expect(200);

      // Then
      expect(response.body).toHaveProperty('version', '1.0');
      expect(response.body).toHaveProperty('exportedAt');
      expect(response.body).toHaveProperty('bookmarks');
      expect(response.body).toHaveProperty('reminders');
      expect(response.body.bookmarks).toEqual(mockBookmarks);
      expect(response.body.reminders).toEqual(mockReminders);
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('空のデータでもエクスポートできる', async () => {
      // Given
      bookmarkStorage.getBookmarks.mockResolvedValue([]);
      reminderStorage.getReminders.mockResolvedValue([]);

      // When
      const response = await request(app)
        .get('/api/data/export')
        .expect(200);

      // Then
      expect(response.body.bookmarks).toEqual([]);
      expect(response.body.reminders).toEqual([]);
    });
  });

  describe('POST /api/data/import', () => {
    const dataDir = path.join(__dirname, '../data');

    beforeEach(async () => {
      // テスト用のデータディレクトリを確保
      await fs.mkdir(dataDir, { recursive: true });
    });

    it('有効なデータをインポートできる', async () => {
      // Given
      const importData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        bookmarks: [
          { id: 1, title: 'Imported Bookmark', url: 'https://imported.com' }
        ],
        reminders: [
          { id: 1, title: 'Imported Reminder' }
        ]
      };

      // When
      const response = await request(app)
        .post('/api/data/import')
        .send(importData)
        .expect(200);

      // Then
      expect(response.body).toHaveProperty('message', 'Data imported successfully');
      expect(response.body.imported).toEqual({
        bookmarks: 1,
        reminders: 1
      });

      // ファイルが正しく保存されたか確認
      const savedBookmarks = JSON.parse(
        await fs.readFile(path.join(dataDir, 'bookmarks.json'), 'utf-8')
      );
      const savedReminders = JSON.parse(
        await fs.readFile(path.join(dataDir, 'reminders.json'), 'utf-8')
      );

      expect(savedBookmarks).toEqual(importData.bookmarks);
      expect(savedReminders).toEqual(importData.reminders);
    });

    it('bookmarksが配列でない場合はエラーを返す', async () => {
      // Given
      const invalidData = {
        bookmarks: 'not an array',
        reminders: []
      };

      // When
      const response = await request(app)
        .post('/api/data/import')
        .send(invalidData)
        .expect(400);

      // Then
      expect(response.body).toHaveProperty('error', 'bookmarks must be an array');
    });

    it('remindersが配列でない場合はエラーを返す', async () => {
      // Given
      const invalidData = {
        bookmarks: [],
        reminders: 'not an array'
      };

      // When
      const response = await request(app)
        .post('/api/data/import')
        .send(invalidData)
        .expect(400);

      // Then
      expect(response.body).toHaveProperty('error', 'reminders must be an array');
    });

    it('空の配列をインポートできる', async () => {
      // Given
      const emptyData = {
        bookmarks: [],
        reminders: []
      };

      // When
      const response = await request(app)
        .post('/api/data/import')
        .send(emptyData)
        .expect(200);

      // Then
      expect(response.body.imported).toEqual({
        bookmarks: 0,
        reminders: 0
      });
    });
  });
});
