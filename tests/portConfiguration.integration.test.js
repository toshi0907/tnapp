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
        
        process.env.PORT = port;
        
        try {
          const app = createApp();
          
          // アプリケーションが正常に初期化されることを確認
          expect(app).toBeDefined();
          
          // 設定エンドポイントが正しいポートを返すことを確認
          const response = await request(app)
            .get('/config')
            .expect(200);
          
          expect(response.body.port).toBe(port);
          
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
        }
      }
    });

    test('ポート設定動作テスト', async () => {
      const testCases = [
        { port: '3001' },
        { port: '3002' },
        { port: '4001' },
        { port: '8080' }
      ];
      
      for (const testCase of testCases) {
        const originalPort = process.env.PORT;
        
        process.env.PORT = testCase.port;
        
        try {
          const app = createApp();
          
          // 認証なしでアクセス可能
          const configResponse = await request(app)
            .get('/config')
            .expect(200);
          
          expect(configResponse.body.port).toBe(testCase.port);
          
        } finally {
          process.env.PORT = originalPort;
        }
      }
    });
  });

  describe('フロントエンド連携テスト', () => {
    test('フロントエンドページが適切なポート設定でアクセス可能', async () => {
      const originalPort = process.env.PORT;
      
      process.env.PORT = '3333';
      
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
      }
    });

    test('API呼び出しが設定ポートに対して正常動作', async () => {
      const originalPort = process.env.PORT;
      
      process.env.PORT = '9999';
      
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
      }
    });
  });

  describe('エラー条件でのテスト', () => {
    test('デフォルト値への適切なフォールバック', async () => {
      const originalPort = process.env.PORT;
      
      // 環境変数を未設定にする
      delete process.env.PORT;
      
      try {
        const app = createApp();
        
        // 認証なしでアクセス可能
        const configResponse = await request(app)
          .get('/config')
          .expect(200);
        
        // デフォルト値が使用されることを確認
        expect(configResponse.body.port).toBe(3000);
        
      } finally {
        if (originalPort) {
          process.env.PORT = originalPort;
        }
      }
    });
  });
});
