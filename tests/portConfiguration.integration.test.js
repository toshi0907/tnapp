const request = require('supertest');
const { createApp } = require('../src/createApp');

/**
 * ポート設定の統合テスト
 * 実際のアプリケーション設定での動作を確認
 */
describe('ポート設定統合テスト - Port Configuration Integration Tests', () => {
  
  describe('環境変数によるポート設定テスト', () => {
    test('様々なポート番号でのアプリケーション起動確認', async () => {
      const testPorts = ['3000', '3001', '4000', '8080'];
      
      for (const port of testPorts) {
        // 環境変数を設定
        const originalPort = process.env.PORT;
        const originalAuth = process.env.BASIC_AUTH_ENABLED;
        
        process.env.PORT = port;
        process.env.BASIC_AUTH_ENABLED = 'false';
        
        try {
          const app = createApp();
          
          // アプリケーションが正常に初期化されることを確認
          expect(app).toBeDefined();
          
          // 設定エンドポイントが正しいポートを返すことを確認
          const response = await request(app)
            .get('/config')
            .expect(200);
          
          expect(response.body.port).toBe(port);
          expect(response.body.authEnabled).toBe(false);
          
          // 基本的なAPIエンドポイントが動作することを確認
          await request(app)
            .get('/health')
            .expect(200);
          
          await request(app)
            .get('/api/bookmarks')
            .expect(200);
          
        } finally {
          // 環境変数を復元
          process.env.PORT = originalPort;
          process.env.BASIC_AUTH_ENABLED = originalAuth;
        }
      }
    });

    test('認証設定とポート設定の組み合わせテスト', async () => {
      const testCases = [
        { port: '3001', auth: 'true' },
        { port: '3002', auth: 'false' },
        { port: '4001', auth: 'true' },
        { port: '8080', auth: 'false' }
      ];
      
      for (const testCase of testCases) {
        const originalPort = process.env.PORT;
        const originalAuth = process.env.BASIC_AUTH_ENABLED;
        const originalUser = process.env.AUTH_USER;
        const originalPass = process.env.AUTH_PASSWORD;
        
        process.env.PORT = testCase.port;
        process.env.BASIC_AUTH_ENABLED = testCase.auth;
        process.env.AUTH_USER = 'testuser';
        process.env.AUTH_PASSWORD = 'testpass';
        
        try {
          const app = createApp();
          
          if (testCase.auth === 'true') {
            // 認証有効時：認証なしでは401
            await request(app)
              .get('/health')
              .expect(401);
            
            // 正しい認証情報では200
            const configResponse = await request(app)
              .get('/config')
              .auth('testuser', 'testpass')
              .expect(200);
            
            expect(configResponse.body.port).toBe(testCase.port);
            expect(configResponse.body.authEnabled).toBe(true);
          } else {
            // 認証無効時：認証なしでも200
            const configResponse = await request(app)
              .get('/config')
              .expect(200);
            
            expect(configResponse.body.port).toBe(testCase.port);
            expect(configResponse.body.authEnabled).toBe(false);
          }
          
        } finally {
          process.env.PORT = originalPort;
          process.env.BASIC_AUTH_ENABLED = originalAuth;
          process.env.AUTH_USER = originalUser;
          process.env.AUTH_PASSWORD = originalPass;
        }
      }
    });
  });

  describe('フロントエンド連携テスト', () => {
    test('フロントエンドページが適切なポート設定でアクセス可能', async () => {
      const originalPort = process.env.PORT;
      const originalAuth = process.env.BASIC_AUTH_ENABLED;
      
      process.env.PORT = '3333';
      process.env.BASIC_AUTH_ENABLED = 'false';
      
      try {
        const app = createApp();
        
        // 設定エンドポイント確認
        const configResponse = await request(app)
          .get('/config')
          .expect(200);
        
        expect(configResponse.body.port).toBe('3333');
        
        // フロントエンドページアクセス確認
        const bookmarkPageResponse = await request(app)
          .get('/bookmark')
          .expect(200);
        
        expect(bookmarkPageResponse.headers['content-type']).toMatch(/text\/html/);
        
        const todoPageResponse = await request(app)
          .get('/todo')
          .expect(200);
        
        expect(todoPageResponse.headers['content-type']).toMatch(/text\/html/);
        
      } finally {
        process.env.PORT = originalPort;
        process.env.BASIC_AUTH_ENABLED = originalAuth;
      }
    });

    test('API呼び出しが設定ポートに対して正常動作', async () => {
      const originalPort = process.env.PORT;
      const originalAuth = process.env.BASIC_AUTH_ENABLED;
      
      process.env.PORT = '9999';
      process.env.BASIC_AUTH_ENABLED = 'false';
      
      try {
        const app = createApp();
        
        // 設定確認
        const configResponse = await request(app)
          .get('/config')
          .expect(200);
        
        expect(configResponse.body.port).toBe('9999');
        
        // 各API エンドポイントの動作確認
        const apiEndpoints = [
          '/api/bookmarks',
          '/api/todos',
          '/health'
        ];
        
        for (const endpoint of apiEndpoints) {
          const response = await request(app)
            .get(endpoint)
            .expect(200);
          
          expect(response.body).toBeDefined();
        }
        
      } finally {
        process.env.PORT = originalPort;
        process.env.BASIC_AUTH_ENABLED = originalAuth;
      }
    });
  });

  describe('エラー条件でのテスト', () => {
    test('デフォルト値への適切なフォールバック', async () => {
      const originalPort = process.env.PORT;
      const originalAuth = process.env.BASIC_AUTH_ENABLED;
      const originalUser = process.env.AUTH_USER;
      const originalPass = process.env.AUTH_PASSWORD;
      
      // 環境変数を未設定にする
      delete process.env.PORT;
      delete process.env.BASIC_AUTH_ENABLED;
      process.env.AUTH_USER = 'admin';
      process.env.AUTH_PASSWORD = 'password123';
      
      try {
        const app = createApp();
        
        // デフォルトでは認証が有効なので、認証付きでアクセス
        const configResponse = await request(app)
          .get('/config')
          .auth('admin', 'password123')
          .expect(200);
        
        // デフォルト値が使用されることを確認
        expect(configResponse.body.port).toBe(3000);
        expect(configResponse.body.authEnabled).toBe(true); // デフォルトは認証有効
        
      } finally {
        if (originalPort) {
          process.env.PORT = originalPort;
        }
        if (originalAuth) {
          process.env.BASIC_AUTH_ENABLED = originalAuth;
        }
        if (originalUser) {
          process.env.AUTH_USER = originalUser;
        }
        if (originalPass) {
          process.env.AUTH_PASSWORD = originalPass;
        }
      }
    });
  });
});
