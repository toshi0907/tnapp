/**
 * データエクスポート/インポートAPIのテスト
 * dataフォルダのJSONファイルを個別にダウンロード/アップロード
 */

const request = require('supertest');
const { createApp } = require('../src/createApp');
const fs = require('fs').promises;
const path = require('path');

describe('Data Export/Import API', () => {
  let app;
  const dataDir = path.join(__dirname, '../data');

  beforeEach(async () => {
    jest.clearAllMocks();
    app = createApp();
    // テスト用のデータディレクトリを確保
    await fs.mkdir(dataDir, { recursive: true });
  });

  describe('GET /api/data/files', () => {
    it('利用可能なファイル一覧を取得できる', async () => {
      // Given - テスト用のファイルを作成
      await fs.writeFile(path.join(dataDir, 'bookmarks.json'), '[]');
      await fs.writeFile(path.join(dataDir, 'reminders.json'), '[]');

      // When
      const response = await request(app)
        .get('/api/data/files')
        .expect(200);

      // Then
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
      expect(response.body.some(f => f.name === 'bookmarks.json')).toBe(true);
      expect(response.body.some(f => f.name === 'reminders.json')).toBe(true);
    });
  });

  describe('GET /api/data/export/:filename', () => {
    it('bookmarks.jsonをダウンロードできる', async () => {
      // Given
      const testData = [{ id: 1, title: 'Test', url: 'https://test.com' }];
      await fs.writeFile(path.join(dataDir, 'bookmarks.json'), JSON.stringify(testData, null, 2));

      // When
      const response = await request(app)
        .get('/api/data/export/bookmarks.json')
        .expect(200);

      // Then
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.headers['content-disposition']).toContain('bookmarks.json');
      expect(JSON.parse(response.text)).toEqual(testData);
    });

    it('reminders.jsonをダウンロードできる', async () => {
      // Given
      const testData = [{ id: 1, title: 'Test Reminder' }];
      await fs.writeFile(path.join(dataDir, 'reminders.json'), JSON.stringify(testData, null, 2));

      // When
      const response = await request(app)
        .get('/api/data/export/reminders.json')
        .expect(200);

      // Then
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.headers['content-disposition']).toContain('reminders.json');
      expect(JSON.parse(response.text)).toEqual(testData);
    });

    it('サポートされていないファイル名はエラーを返す', async () => {
      // When
      const response = await request(app)
        .get('/api/data/export/invalid.json')
        .expect(400);

      // Then
      expect(response.body).toHaveProperty('error', 'Unsupported file name');
    });

    it('存在しないファイルは404を返す', async () => {
      // Given - ファイルが存在しない場合を確認するため削除
      try {
        await fs.unlink(path.join(dataDir, 'bookmarks.json'));
      } catch {
        // ファイルが存在しない場合は無視
      }

      // When
      const response = await request(app)
        .get('/api/data/export/bookmarks.json')
        .expect(404);

      // Then
      expect(response.body).toHaveProperty('error', 'File not found');
    });
  });

  describe('POST /api/data/import/:filename', () => {
    it('bookmarks.jsonをインポートできる', async () => {
      // Given
      const importData = [{ id: 1, title: 'Imported', url: 'https://imported.com' }];

      // When
      const response = await request(app)
        .post('/api/data/import/bookmarks.json')
        .send(importData)
        .expect(200);

      // Then
      expect(response.body).toHaveProperty('message', 'File imported successfully');
      expect(response.body).toHaveProperty('filename', 'bookmarks.json');
      expect(response.body).toHaveProperty('count', 1);

      // ファイルが正しく保存されたか確認
      const savedData = JSON.parse(
        await fs.readFile(path.join(dataDir, 'bookmarks.json'), 'utf-8')
      );
      expect(savedData).toEqual(importData);
    });

    it('reminders.jsonをインポートできる', async () => {
      // Given
      const importData = [{ id: 1, title: 'Imported Reminder' }];

      // When
      const response = await request(app)
        .post('/api/data/import/reminders.json')
        .send(importData)
        .expect(200);

      // Then
      expect(response.body).toHaveProperty('message', 'File imported successfully');
      expect(response.body).toHaveProperty('filename', 'reminders.json');
      expect(response.body).toHaveProperty('count', 1);
    });

    it('サポートされていないファイル名はエラーを返す', async () => {
      // When
      const response = await request(app)
        .post('/api/data/import/invalid.json')
        .send([])
        .expect(400);

      // Then
      expect(response.body).toHaveProperty('error', 'Unsupported file name');
    });

    it('配列以外のデータはエラーを返す', async () => {
      // When
      const response = await request(app)
        .post('/api/data/import/bookmarks.json')
        .send({ notAnArray: true })
        .expect(400);

      // Then
      expect(response.body).toHaveProperty('error', 'Data must be an array');
    });

    it('空の配列をインポートできる', async () => {
      // When
      const response = await request(app)
        .post('/api/data/import/bookmarks.json')
        .send([])
        .expect(200);

      // Then
      expect(response.body).toHaveProperty('count', 0);
    });
  });
});
