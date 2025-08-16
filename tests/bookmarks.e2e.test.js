const request = require('supertest');
const path = require('path');
const fs = require('fs').promises;
const { createTestDataDir, cleanupTestFiles, validateBookmarkResponse } = require('./helpers/testHelpers');

// 実際のサーバーアプリケーションを使用したE2Eテスト
describe('Bookmarks API - E2E Tests', () => {
  let app;
  let testDataDir;
  let originalBookmarksFile;
  let backupBookmarksFile;

  beforeAll(async () => {
    // テスト用データディレクトリ作成
    testDataDir = await createTestDataDir();
    
    // 実際のブックマークファイルのバックアップ
    const dataDir = path.join(__dirname, '..', 'data');
    originalBookmarksFile = path.join(dataDir, 'bookmarks.json');
    backupBookmarksFile = path.join(dataDir, 'bookmarks.backup.json');
    
    try {
      const originalData = await fs.readFile(originalBookmarksFile, 'utf8');
      await fs.writeFile(backupBookmarksFile, originalData);
    } catch (error) {
      // ファイルが存在しない場合は無視
      console.warn('Original bookmarks file not found, creating new one');
    }

    // テスト用の初期データを設定
    const testBookmarks = [
      {
        id: 1,
        title: 'E2E テストブックマーク1',
        url: 'https://e2e-test1.com',
        description: 'E2Eテスト用',
        tags: ['e2e', 'test'],
        category: 'testing',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    await fs.writeFile(originalBookmarksFile, JSON.stringify(testBookmarks, null, 2));

    // テスト用環境変数を設定
    process.env.NODE_ENV = 'test';
    process.env.PORT = '3001';
    
    // Basic認証をバイパスするミドルウェアを作成
    const express = require('express');
    const cors = require('cors');
    const helmet = require('helmet');
    const bookmarkRouter = require('../src/routes/bookmarks');
    
    app = express();
    app.use(helmet());
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    // 認証なしでAPIにアクセス可能
    app.use('/api/bookmarks', bookmarkRouter);
  });

  afterAll(async () => {
    // バックアップファイルから復元
    try {
      const backupData = await fs.readFile(backupBookmarksFile, 'utf8');
      await fs.writeFile(originalBookmarksFile, backupData);
      await fs.unlink(backupBookmarksFile);
    } catch (error) {
      // バックアップファイルが存在しない場合
      try {
        await fs.unlink(originalBookmarksFile);
      } catch (unlinkError) {
        // ファイルが存在しない場合は無視
      }
    }
    
    // テストデータクリーンアップ
    await cleanupTestFiles();
    
    // 環境変数をリセット
    delete process.env.DISABLE_AUTH;
  });

  describe('完全なワークフロー', () => {
    let createdBookmarkId;

    it('新しいブックマークを作成 → 取得 → 更新 → 削除のフローが正常に動作する', async () => {
      // 1. 新しいブックマークを作成
      const newBookmark = {
        title: 'ワークフローテスト',
        url: 'https://workflow-test.com',
        description: 'ワークフローテスト用のブックマーク',
        tags: ['workflow', 'test'],
        category: 'testing'
      };

      const createResponse = await request(app)
        .post('/api/bookmarks')
        .send(newBookmark)
        .expect(201);

      validateBookmarkResponse(createResponse.body);
      expect(createResponse.body.title).toBe(newBookmark.title);
      expect(createResponse.body.url).toBe(newBookmark.url);
      
      createdBookmarkId = createResponse.body.id;

      // 2. 作成したブックマークを取得
      const getResponse = await request(app)
        .get(`/api/bookmarks/${createdBookmarkId}`)
        .expect(200);

      validateBookmarkResponse(getResponse.body);
      expect(getResponse.body.id).toBe(createdBookmarkId);
      expect(getResponse.body.title).toBe(newBookmark.title);

      // 3. ブックマーク一覧に含まれていることを確認
      const listResponse = await request(app)
        .get('/api/bookmarks')
        .expect(200);

      expect(Array.isArray(listResponse.body)).toBe(true);
      const foundBookmark = listResponse.body.find(b => b.id === createdBookmarkId);
      expect(foundBookmark).toBeDefined();

      // 4. ブックマークを更新
      const updateData = {
        title: '更新されたワークフローテスト',
        description: '更新された説明',
        tags: ['workflow', 'test', 'updated']
      };

      const updateResponse = await request(app)
        .put(`/api/bookmarks/${createdBookmarkId}`)
        .send(updateData)
        .expect(200);

      validateBookmarkResponse(updateResponse.body);
      expect(updateResponse.body.title).toBe(updateData.title);
      expect(updateResponse.body.description).toBe(updateData.description);
      expect(updateResponse.body.tags).toEqual(updateData.tags);

      // 5. 更新されたデータを再取得して確認
      const getUpdatedResponse = await request(app)
        .get(`/api/bookmarks/${createdBookmarkId}`)
        .expect(200);

      expect(getUpdatedResponse.body.title).toBe(updateData.title);
      expect(getUpdatedResponse.body.description).toBe(updateData.description);

      // 6. ブックマークを削除
      await request(app)
        .delete(`/api/bookmarks/${createdBookmarkId}`)
        .expect(204);

      // 7. 削除されたブックマークが取得できないことを確認
      await request(app)
        .get(`/api/bookmarks/${createdBookmarkId}`)
        .expect(404);
    });

    it('検索とフィルタリング機能が正常に動作する', async () => {
      // テスト用のブックマークを複数作成
      const testBookmarks = [
        {
          title: 'JavaScript ガイド',
          url: 'https://js-guide.com',
          description: 'JavaScript学習用',
          tags: ['javascript', 'programming'],
          category: 'development'
        },
        {
          title: 'Node.js ドキュメント',
          url: 'https://nodejs-docs.com',
          description: 'Node.js公式ドキュメント',
          tags: ['nodejs', 'backend'],
          category: 'development'
        },
        {
          title: 'デザインツール',
          url: 'https://design-tool.com',
          description: 'UI/UXデザイン用ツール',
          tags: ['design', 'ui'],
          category: 'tools'
        }
      ];

      const createdIds = [];
      for (const bookmark of testBookmarks) {
        const response = await request(app)
          .post('/api/bookmarks')
          .send(bookmark)
          .expect(201);
        createdIds.push(response.body.id);
      }

      try {
        // カテゴリでフィルタ
        const devResponse = await request(app)
          .get('/api/bookmarks?category=development')
          .expect(200);

        const devBookmarks = devResponse.body.filter(b => createdIds.includes(b.id));
        expect(devBookmarks).toHaveLength(2);
        devBookmarks.forEach(bookmark => {
          expect(bookmark.category).toBe('development');
        });

        // タグでフィルタ
        const jsResponse = await request(app)
          .get('/api/bookmarks?tag=javascript')
          .expect(200);

        const jsBookmarks = jsResponse.body.filter(b => createdIds.includes(b.id));
        expect(jsBookmarks).toHaveLength(1);
        expect(jsBookmarks[0].tags).toContain('javascript');

        // 検索機能
        const searchResponse = await request(app)
          .get('/api/bookmarks?search=Node.js')
          .expect(200);

        const searchResults = searchResponse.body.filter(b => createdIds.includes(b.id));
        expect(searchResults).toHaveLength(1);
        expect(searchResults[0].title).toContain('Node.js');

      } finally {
        // テスト用ブックマークを削除
        for (const id of createdIds) {
          await request(app)
            .delete(`/api/bookmarks/${id}`)
            .expect(204);
        }
      }
    });

    it('メタデータエンドポイントが正常に動作する', async () => {
      // カテゴリ一覧取得
      const categoriesResponse = await request(app)
        .get('/api/bookmarks/meta/categories')
        .expect(200);

      expect(Array.isArray(categoriesResponse.body)).toBe(true);

      // タグ一覧取得
      const tagsResponse = await request(app)
        .get('/api/bookmarks/meta/tags')
        .expect(200);

      expect(Array.isArray(tagsResponse.body)).toBe(true);

      // 統計情報取得
      const statsResponse = await request(app)
        .get('/api/bookmarks/meta/stats')
        .expect(200);

      expect(statsResponse.body).toHaveProperty('totalBookmarks');
      expect(statsResponse.body).toHaveProperty('totalCategories');
      expect(statsResponse.body).toHaveProperty('totalTags');
      expect(statsResponse.body).toHaveProperty('categories');
      expect(statsResponse.body).toHaveProperty('tags');
      expect(typeof statsResponse.body.totalBookmarks).toBe('number');
    });
  });

  describe('エラーハンドリング', () => {
    it('バリデーションエラーが適切に処理される', async () => {
      // タイトルなし
      await request(app)
        .post('/api/bookmarks')
        .send({ url: 'https://example.com' })
        .expect(400);

      // URLなし
      await request(app)
        .post('/api/bookmarks')
        .send({ title: 'テスト' })
        .expect(400);

      // 無効なURL
      await request(app)
        .post('/api/bookmarks')
        .send({ title: 'テスト', url: 'invalid-url' })
        .expect(400);
    });

    it('存在しないリソースに対する操作が適切に処理される', async () => {
      const nonExistentId = 999999;

      // 存在しないブックマークの取得
      await request(app)
        .get(`/api/bookmarks/${nonExistentId}`)
        .expect(404);

      // 存在しないブックマークの更新
      await request(app)
        .put(`/api/bookmarks/${nonExistentId}`)
        .send({ title: '更新テスト' })
        .expect(404);

      // 存在しないブックマークの削除
      await request(app)
        .delete(`/api/bookmarks/${nonExistentId}`)
        .expect(404);
    });
  });
});
