const request = require('supertest');
const { createApp } = require('../src/createApp');

describe('本番環境テスト - Production Environment Tests', () => {
  let app;
  
  beforeEach(() => {
    // 本番環境の設定を模擬
    process.env.NODE_ENV = 'production';
    process.env.PORT = '3001';
    app = createApp();
  });

  afterEach(() => {
    // 環境変数をリセット
    process.env.NODE_ENV = 'development';
    delete process.env.PORT;
  });

  describe('リバースプロキシ環境での動作確認', () => {
    it('HTTPSからのconfig取得が正常動作する', async () => {
      const response = await request(app)
        .get('/config')
        .expect(200);

      expect(response.body).toHaveProperty('port', '3001');
    });

    it('フロントエンドページが認証なしでアクセス可能', async () => {
      // /bookmark ページ
      const bookmarkResponse = await request(app)
        .get('/bookmark')
        .expect(200);
      
      expect(bookmarkResponse.text).toContain('<title>Bookmarks</title>');

      // /reminder ページ  
      const reminderResponse = await request(app)
        .get('/reminder')
        .expect(200);
      
      expect(reminderResponse.text).toContain('<title>Reminders</title>');
    });

    it('API エンドポイントが認証なしでアクセス可能', async () => {
      // 認証なしでアクセス可能
      await request(app)
        .get('/api/bookmarks')
        .expect(200);

      await request(app)
        .get('/api/reminders')
        .expect(200);
    });

    it('ヘルスチェックが認証なしで動作する', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('database');
    });
  });

  describe('HTTPS環境での設定確認', () => {
    it('設定エンドポイントがHTTPS環境に適した情報を返す', async () => {
      const response = await request(app)
        .get('/config')
        .expect(200);

      // 本番環境の設定が正しく反映されることを確認
      expect(response.body.port).toBe('3001');
    });

    it('静的ファイルのContent-Typeが正しく設定される', async () => {
      // HTMLファイル
      await request(app)
        .get('/bookmark')
        .expect('Content-Type', /text\/html/);

      // CSSファイル
      await request(app)
        .get('/public/style.css')
        .expect('Content-Type', /text\/css/);

      // JavaScriptファイル
      const jsResponse = await request(app)
        .get('/public/bookmark/app.js')
        .expect(200);
      
      expect(jsResponse.headers['content-type']).toMatch(/application\/javascript|text\/javascript/);
    });
  });

  describe('Nginx リバースプロキシ互換性テスト', () => {
    it('X-Forwarded-Proto ヘッダーを適切に処理する', async () => {
      // HTTPS リクエストのシミュレーション
      const response = await request(app)
        .get('/config')
        .set('X-Forwarded-Proto', 'https')
        .set('X-Forwarded-For', '192.168.1.100')
        .set('Host', 'app.totos97.com')
        .expect(200);

      expect(response.body).toHaveProperty('port', '3001');
    });

    it('プロキシ経由でのAPI呼び出しが正常動作する', async () => {
      const response = await request(app)
        .get('/api/bookmarks')
        .set('X-Forwarded-Proto', 'https')
        .set('Host', 'app.totos97.com')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('セキュリティヘッダー確認', () => {
    it('適切なセキュリティヘッダーが設定されている', async () => {
      const response = await request(app)
        .get('/config')
        .expect(200);

      // Helmet によるセキュリティヘッダーの確認
      expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(response.headers).toHaveProperty('x-frame-options', 'SAMEORIGIN');
      expect(response.headers).toHaveProperty('x-xss-protection', '0');
    });
  });
});
