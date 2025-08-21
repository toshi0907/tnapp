const request = require('supertest');
const { createApp } = require('../src/createApp');
const fs = require('fs');
const path = require('path');

// テスト用のデータファイルパス
const testDataDir = path.join(__dirname, '../data');
const remindersFile = path.join(testDataDir, 'reminders.json');

describe('Reminders E2E Tests', () => {
  let app;

  beforeAll(async () => {
    app = createApp();
    
    // データディレクトリの確保
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true });
    }
  });

  beforeEach(async () => {
    // 各テスト前にリマインダーファイルをクリア
    if (fs.existsSync(remindersFile)) {
      fs.unlinkSync(remindersFile);
    }
  });

  afterAll(async () => {
    // テスト後のクリーンアップ
    if (fs.existsSync(remindersFile)) {
      fs.unlinkSync(remindersFile);
    }
  });

  describe('完全なリマインダーワークフロー', () => {
    test('リマインダーのCRUD操作とメタデータ取得', async () => {
      // 1. 初期状態でリマインダーが空であることを確認
      const initialResponse = await request(app)
        .get('/api/reminders')
        .expect(200);
      
      expect(initialResponse.body).toEqual([]);

      // 2. 新しいリマインダーを作成
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const newReminder = {
        title: 'E2E テストリマインダー',
        message: 'これはE2Eテスト用のリマインダーです',
        notificationDateTime: futureDate,
        notificationMethod: 'webhook',
        category: 'testing',
        tags: ['e2e', 'test', 'automation']
      };

      const createResponse = await request(app)
        .post('/api/reminders')
        .send(newReminder)
        .expect(201);

      const createdReminder = createResponse.body;
      expect(createdReminder.id).toBeDefined();
      expect(createdReminder.title).toBe(newReminder.title);
      expect(createdReminder.message).toBe(newReminder.message);
      expect(createdReminder.notificationMethod).toBe('webhook');
      expect(createdReminder.notificationStatus).toBe('pending');
      expect(createdReminder.timezone).toBe('Asia/Tokyo');
      expect(createdReminder.createdAt).toBeDefined();
      expect(createdReminder.updatedAt).toBeDefined();

      // 3. リマインダー一覧を取得して作成されたリマインダーが含まれていることを確認
      const listResponse = await request(app)
        .get('/api/reminders')
        .expect(200);

      expect(listResponse.body).toHaveLength(1);
      expect(listResponse.body[0].id).toBe(createdReminder.id);

      // 4. 特定のリマインダーを取得
      const getResponse = await request(app)
        .get(`/api/reminders/${createdReminder.id}`)
        .expect(200);

      expect(getResponse.body.id).toBe(createdReminder.id);
      expect(getResponse.body.title).toBe(newReminder.title);

      // 5. リマインダーを更新
      const updateData = {
        title: '更新されたE2Eテストリマインダー',
        message: '更新されたメッセージ',
        category: 'updated-testing',
        tags: ['e2e', 'test', 'updated']
      };

      const updateResponse = await request(app)
        .put(`/api/reminders/${createdReminder.id}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.title).toBe(updateData.title);
      expect(updateResponse.body.message).toBe(updateData.message);
      expect(updateResponse.body.category).toBe(updateData.category);
      expect(updateResponse.body.updatedAt).not.toBe(createdReminder.updatedAt);

      // 6. 更新後のリマインダーを再取得して確認
      const updatedGetResponse = await request(app)
        .get(`/api/reminders/${createdReminder.id}`)
        .expect(200);

      expect(updatedGetResponse.body.title).toBe(updateData.title);
      expect(updatedGetResponse.body.category).toBe(updateData.category);

      // 7. メタデータのテスト - カテゴリ一覧
      const categoriesResponse = await request(app)
        .get('/api/reminders/meta/categories')
        .expect(200);

      expect(categoriesResponse.body).toContain('updated-testing');

      // 8. メタデータのテスト - タグ一覧
      const tagsResponse = await request(app)
        .get('/api/reminders/meta/tags')
        .expect(200);

      expect(tagsResponse.body).toContain('e2e');
      expect(tagsResponse.body).toContain('test');
      expect(tagsResponse.body).toContain('updated');

      // 9. 統計情報の取得
      const statsResponse = await request(app)
        .get('/api/reminders/meta/stats')
        .expect(200);

      expect(statsResponse.body.total).toBe(1);
      expect(statsResponse.body.pending).toBe(1);
      expect(statsResponse.body.sent).toBe(0);
      expect(statsResponse.body.notificationMethods.webhook).toBe(1);
      expect(statsResponse.body.notificationMethods.email).toBe(0);

      // 10. リマインダーを削除
      const deleteResponse = await request(app)
        .delete(`/api/reminders/${createdReminder.id}`)
        .expect(200);

      expect(deleteResponse.body.message).toBe('Reminder deleted successfully');

      // 11. 削除後に一覧が空になっていることを確認
      const finalListResponse = await request(app)
        .get('/api/reminders')
        .expect(200);

      expect(finalListResponse.body).toEqual([]);

      // 12. 削除されたリマインダーにアクセスすると404が返ることを確認
      await request(app)
        .get(`/api/reminders/${createdReminder.id}`)
        .expect(404);
    });

    test('複数のリマインダーとフィルタリング機能', async () => {
      // 複数の異なるリマインダーを作成
      const futureDate1 = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const futureDate2 = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
      const futureDate3 = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

      const reminders = [
        {
          title: 'Webhook リマインダー 1',
          notificationDateTime: futureDate1,
          notificationMethod: 'webhook',
          category: 'work',
          tags: ['meeting', 'important']
        },
        {
          title: 'Email リマインダー 1',
          notificationDateTime: futureDate2,
          notificationMethod: 'email',
          category: 'personal',
          tags: ['health', 'appointment']
        },
        {
          title: 'Webhook リマインダー 2',
          notificationDateTime: futureDate3,
          notificationMethod: 'webhook',
          category: 'work',
          tags: ['project', 'deadline']
        }
      ];

      const createdReminders = [];
      for (const reminder of reminders) {
        const response = await request(app)
          .post('/api/reminders')
          .send(reminder)
          .expect(201);
        createdReminders.push(response.body);
      }

      // ステータスでフィルタリング（すべてpending）
      const pendingResponse = await request(app)
        .get('/api/reminders?status=pending')
        .expect(200);
      expect(pendingResponse.body).toHaveLength(3);

      // 通知手段でフィルタリング
      const webhookResponse = await request(app)
        .get('/api/reminders?method=webhook')
        .expect(200);
      expect(webhookResponse.body).toHaveLength(2);

      const emailResponse = await request(app)
        .get('/api/reminders?method=email')
        .expect(200);
      expect(emailResponse.body).toHaveLength(1);

      // カテゴリでフィルタリング
      const workResponse = await request(app)
        .get('/api/reminders?category=work')
        .expect(200);
      expect(workResponse.body).toHaveLength(2);

      const personalResponse = await request(app)
        .get('/api/reminders?category=personal')
        .expect(200);
      expect(personalResponse.body).toHaveLength(1);

      // 今後24時間のリマインダー
      const upcomingResponse = await request(app)
        .get('/api/reminders?upcoming=24')
        .expect(200);
      expect(upcomingResponse.body).toHaveLength(1);
      expect(upcomingResponse.body[0].title).toBe('Webhook リマインダー 1');

      // 統計情報の確認
      const statsResponse = await request(app)
        .get('/api/reminders/meta/stats')
        .expect(200);

      expect(statsResponse.body.total).toBe(3);
      expect(statsResponse.body.pending).toBe(3);
      expect(statsResponse.body.sent).toBe(0);
      expect(statsResponse.body.notificationMethods.webhook).toBe(2);
      expect(statsResponse.body.notificationMethods.email).toBe(1);
    });

    test('繰り返し設定付きリマインダーの作成', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const reminderWithRepeat = {
        title: '繰り返しリマインダー',
        message: '毎日繰り返されるリマインダーです',
        notificationDateTime: futureDate,
        notificationMethod: 'webhook',
        category: 'routine',
        tags: ['daily', 'routine'],
        repeatSettings: {
          interval: 'daily',
          endDate: endDate,
          maxOccurrences: 5
        }
      };

      const createResponse = await request(app)
        .post('/api/reminders')
        .send(reminderWithRepeat)
        .expect(201);

      const createdReminder = createResponse.body;
      expect(createdReminder.repeatSettings).toBeDefined();
      expect(createdReminder.repeatSettings.interval).toBe('daily');
      expect(createdReminder.repeatSettings.endDate).toBe(endDate);
      expect(createdReminder.repeatSettings.maxOccurrences).toBe(5);
      expect(createdReminder.repeatSettings.currentOccurrence).toBe(1);
    });
  });

  describe('データ永続性のテスト', () => {
    test('データがファイルに正しく保存され読み込まれる', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      
      // リマインダーを作成
      const newReminder = {
        title: '永続性テストリマインダー',
        notificationDateTime: futureDate,
        category: 'persistence-test'
      };

      const createResponse = await request(app)
        .post('/api/reminders')
        .send(newReminder)
        .expect(201);

      const createdReminder = createResponse.body;

      // ファイルが作成されていることを確認
      expect(fs.existsSync(remindersFile)).toBe(true);

      // ファイルの内容を直接読み取って確認
      const fileContent = fs.readFileSync(remindersFile, 'utf-8');
      const savedData = JSON.parse(fileContent);
      
      expect(savedData).toHaveLength(1);
      expect(savedData[0].id).toBe(createdReminder.id);
      expect(savedData[0].title).toBe(newReminder.title);
      expect(savedData[0].category).toBe(newReminder.category);

      // API経由でデータを取得して一致することを確認
      const getResponse = await request(app)
        .get('/api/reminders')
        .expect(200);

      expect(getResponse.body).toHaveLength(1);
      expect(getResponse.body[0].id).toBe(createdReminder.id);
    });
  });

  describe('エラーハンドリングのテスト', () => {
    test('無効なデータでのリマインダー作成', async () => {
      // タイトルなし
      await request(app)
        .post('/api/reminders')
        .send({ notificationDateTime: new Date(Date.now() + 3600000).toISOString() })
        .expect(400);

      // 通知日時なし
      await request(app)
        .post('/api/reminders')
        .send({ title: 'テストリマインダー' })
        .expect(400);

      // 過去の通知日時
      const pastDate = new Date(Date.now() - 3600000).toISOString();
      await request(app)
        .post('/api/reminders')
        .send({ 
          title: 'テストリマインダー', 
          notificationDateTime: pastDate 
        })
        .expect(400);

      // 無効な通知手段
      const futureDate = new Date(Date.now() + 3600000).toISOString();
      await request(app)
        .post('/api/reminders')
        .send({ 
          title: 'テストリマインダー', 
          notificationDateTime: futureDate,
          notificationMethod: 'invalid'
        })
        .expect(400);
    });

    test('存在しないリマインダーへの操作', async () => {
      // 存在しないリマインダーの取得
      await request(app)
        .get('/api/reminders/999999')
        .expect(404);

      // 存在しないリマインダーの更新
      await request(app)
        .put('/api/reminders/999999')
        .send({ title: '更新されたタイトル' })
        .expect(404);

      // 存在しないリマインダーの削除
      await request(app)
        .delete('/api/reminders/999999')
        .expect(404);
    });
  });

  describe('通知テスト機能', () => {
    test('通知テストエンドポイント', async () => {
      // Webhook テスト（設定がない場合は失敗する可能性が高い）
      const webhookResponse = await request(app)
        .post('/api/reminders/test/webhook')
        .expect(200);

      expect(webhookResponse.body).toHaveProperty('success');
      expect(webhookResponse.body).toHaveProperty('message');

      // Email テスト（設定がない場合は失敗する可能性が高い）
      const emailResponse = await request(app)
        .post('/api/reminders/test/email')
        .expect(200);

      expect(emailResponse.body).toHaveProperty('success');
      expect(emailResponse.body).toHaveProperty('message');

      // 無効な通知手段でのテスト
      await request(app)
        .post('/api/reminders/test/invalid')
        .expect(400);
    });
  });
});