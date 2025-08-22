const request = require('supertest');
const { createApp } = require('../src/createApp');
const { createTestDataDir, cleanupTestFiles } = require('./helpers/testHelpers');

describe('ポート設定テスト - Port Configuration Tests', () => {
  let testDataDir;
  
  beforeAll(async () => {
    testDataDir = await createTestDataDir();
  });

  afterAll(async () => {
    await cleanupTestFiles([testDataDir]);
  });

  describe('設定エンドポイント - Config Endpoint', () => {
    test('デフォルトポート3000での設定情報取得', async () => {
      // 環境変数を一時的にクリア
      const originalPort = process.env.PORT;
      delete process.env.PORT;
      
      const app = createApp();
      
      const response = await request(app)
        .get('/config')
        .expect(200);

      expect(response.body).toEqual({
        port: 3000,
        authEnabled: false,
        authUsername: 'admin',
        authPassword: 'your-secure-password'
      });

      // 環境変数を復元
      if (originalPort) {
        process.env.PORT = originalPort;
      }
    });

    test('カスタムポート3005での設定情報取得', async () => {
      const originalPort = process.env.PORT;
      process.env.PORT = '3005';
      
      const app = createApp();
      
      const response = await request(app)
        .get('/config')
        .expect(200);

      expect(response.body).toEqual({
        port: '3005',
        authEnabled: false,
        authUsername: 'admin',
        authPassword: 'your-secure-password'
      });

      // 環境変数を復元
      process.env.PORT = originalPort;
    });

    test('設定情報取得テスト', async () => {
      const originalPort = process.env.PORT;
      
      process.env.PORT = '3000';
      
      const app = createApp();
      
      // /config エンドポイントで設定情報が取得できる
      const response = await request(app)
        .get('/config')
        .expect(200);

      expect(response.body).toHaveProperty('port');

      // 環境変数を復元
      process.env.PORT = originalPort;
    });
  });

  describe('異なるポートでのAPI動作確認 - API Functionality on Different Ports', () => {
    test('ポート3010でのブックマークAPI動作確認', async () => {
      const originalPort = process.env.PORT;
      
      process.env.PORT = '3010';
      
      const app = createApp();
      
      // 設定確認
      const configResponse = await request(app)
        .get('/config')
        .expect(200);
      
      expect(configResponse.body.port).toBe('3010');

      // ブックマーク一覧取得
      const bookmarksResponse = await request(app)
        .get('/api/bookmarks')
        .expect(200);
      
      expect(Array.isArray(bookmarksResponse.body)).toBe(true);

      // 環境変数を復元
      process.env.PORT = originalPort;
      
    });

    test('ポート3020でのTODO API動作確認', async () => {
      const originalPort = process.env.PORT;
      
      process.env.PORT = '3020';
      
      const app = createApp();
      
      // 設定確認
      const configResponse = await request(app)
        .get('/config')
        .expect(200);
      
      expect(configResponse.body.port).toBe('3020');

      // TODO一覧取得
      const todosResponse = await request(app)
        .get('/api/todos')
        .expect(200);
      
      expect(Array.isArray(todosResponse.body)).toBe(true);

      // 環境変数を復元
      process.env.PORT = originalPort;
      
    });

    test('ポート4000でのヘルスチェック動作確認', async () => {
      const originalPort = process.env.PORT;
      
      process.env.PORT = '4000';
      
      const app = createApp();
      
      // ヘルスチェック
      const healthResponse = await request(app)
        .get('/health')
        .expect(200);
      
      expect(healthResponse.body).toHaveProperty('status', 'OK');
      expect(healthResponse.body).toHaveProperty('message');

      // 環境変数を復元
      process.env.PORT = originalPort;
      
    });
  });

  describe('フロントエンドページルーティング - Frontend Page Routing', () => {
    test('ポート3030でのブックマークページアクセス', async () => {
      const originalPort = process.env.PORT;
      
      process.env.PORT = '3030';
      
      const app = createApp();
      
      // ブックマークページのHTMLファイルが返される
      const response = await request(app)
        .get('/bookmark')
        .expect(200);
      
      expect(response.headers['content-type']).toMatch(/text\/html/);

      // 環境変数を復元
      process.env.PORT = originalPort;
      
    });

    test('ポート3040でのTODOページアクセス', async () => {
      const originalPort = process.env.PORT;
      
      process.env.PORT = '3040';
      
      const app = createApp();
      
      // TODOページのHTMLファイルが返される
      const response = await request(app)
        .get('/todo')
        .expect(200);
      
      expect(response.headers['content-type']).toMatch(/text\/html/);

      // 環境変数を復元
      process.env.PORT = originalPort;
      
    });
  });

  describe('ポート設定の境界値テスト - Port Configuration Boundary Tests', () => {
    test('最小ポート番号1024での動作確認', async () => {
      const originalPort = process.env.PORT;
      
      process.env.PORT = '1024';
      
      const app = createApp();
      
      const response = await request(app)
        .get('/config')
        .expect(200);

      expect(response.body.port).toBe('1024');

      // 環境変数を復元
      process.env.PORT = originalPort;
      
    });

    test('高ポート番号65530での動作確認', async () => {
      const originalPort = process.env.PORT;
      
      process.env.PORT = '65530';
      
      const app = createApp();
      
      const response = await request(app)
        .get('/config')
        .expect(200);

      expect(response.body.port).toBe('65530');

      // 環境変数を復元
      process.env.PORT = originalPort;
      
    });
  });

  describe('設定変更時の一貫性テスト - Configuration Consistency Tests', () => {
    test('ポート変更後も全エンドポイントが正常動作することを確認', async () => {
      const originalPort = process.env.PORT;
      
      const testPort = '3999';
      process.env.PORT = testPort;
      
      const app = createApp();
      
      // 各エンドポイントの動作確認
      const endpoints = [
        { path: '/config', method: 'get', expectedStatus: 200 },
        { path: '/health', method: 'get', expectedStatus: 200 },
        { path: '/api/bookmarks', method: 'get', expectedStatus: 200 },
        { path: '/api/todos', method: 'get', expectedStatus: 200 },
        { path: '/bookmark', method: 'get', expectedStatus: 200 },
        { path: '/todo', method: 'get', expectedStatus: 200 },
        { path: '/api-docs', method: 'get', expectedStatus: 301 } // Swagger UIはリダイレクト
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)[endpoint.method](endpoint.path);
        expect(response.status).toBe(endpoint.expectedStatus);
      }

      // 設定エンドポイントで正しいポートが返されることを確認
      const configResponse = await request(app)
        .get('/config')
        .expect(200);
      
      expect(configResponse.body.port).toBe(testPort);

      // 環境変数を復元
      process.env.PORT = originalPort;
      
    });

    test('ポート変更後もCRUD操作が正常動作することを確認', async () => {
      const originalPort = process.env.PORT;
      
      process.env.PORT = '4001';
      
      const app = createApp();
      
      // ブックマーク作成
      const createResponse = await request(app)
        .post('/api/bookmarks')
        .send({
          title: 'ポートテスト用ブックマーク',
          url: 'https://port-test.example.com',
          description: 'ポート変更テスト用のブックマーク',
          tags: ['test', 'port'],
          category: 'testing'
        })
        .expect(201);

      const bookmarkId = createResponse.body.id;
      expect(bookmarkId).toBeDefined();

      // ブックマーク取得
      const getResponse = await request(app)
        .get(`/api/bookmarks/${bookmarkId}`)
        .expect(200);

      expect(getResponse.body.title).toBe('ポートテスト用ブックマーク');

      // ブックマーク更新
      const updateResponse = await request(app)
        .put(`/api/bookmarks/${bookmarkId}`)
        .send({
          title: '更新されたポートテストブックマーク',
          description: '更新されたポート変更テスト用のブックマーク'
        })
        .expect(200);

      expect(updateResponse.body.title).toBe('更新されたポートテストブックマーク');

      // ブックマーク削除
      await request(app)
        .delete(`/api/bookmarks/${bookmarkId}`)
        .expect(204);

      // 削除確認
      await request(app)
        .get(`/api/bookmarks/${bookmarkId}`)
        .expect(404);

      // 環境変数を復元
      process.env.PORT = originalPort;
      
    });
  });

  describe('エラーハンドリング - Error Handling', () => {
    test('不正なポート番号文字列での設定取得', async () => {
      const originalPort = process.env.PORT;
      
      process.env.PORT = 'invalid-port';
      
      const app = createApp();
      
      // 設定エンドポイントは文字列として返すため、エラーにはならない
      const response = await request(app)
        .get('/config')
        .expect(200);

      expect(response.body.port).toBe('invalid-port');

      // 環境変数を復元
      process.env.PORT = originalPort;
      
    });

    test('空のポート番号での設定取得', async () => {
      const originalPort = process.env.PORT;
      
      process.env.PORT = '';
      
      const app = createApp();
      
      const response = await request(app)
        .get('/config')
        .expect(200);

      // 空文字の場合はデフォルト値3000が使用される
      expect(response.body.port).toBe(3000);

      // 環境変数を復元
      process.env.PORT = originalPort;
      
    });
  });
});
