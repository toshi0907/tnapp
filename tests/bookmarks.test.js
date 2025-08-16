const request = require('supertest');
const express = require('express');
const path = require('path');
const fs = require('fs').promises;

// テスト用のサーバーアプリケーションを作成
const app = express();
app.use(express.json());

// テスト用のデータファイルパス
const testDataDir = path.join(__dirname, 'test-data');
const testBookmarksFile = path.join(testDataDir, 'bookmarks.json');

// テスト用のストレージモジュールをモック
jest.mock('../src/database/bookmarkStorage', () => {
  return {
    getBookmarks: jest.fn(),
    getBookmarkById: jest.fn(),
    addBookmark: jest.fn(),
    updateBookmark: jest.fn(),
    deleteBookmark: jest.fn(),
    getCategories: jest.fn(),
    getTags: jest.fn(),
    getBookmarkCount: jest.fn(),
    searchBookmarks: jest.fn()
  };
});

const bookmarkStorage = require('../src/database/bookmarkStorage');
const bookmarkRouter = require('../src/routes/bookmarks');

// ルーターをアプリにマウント
app.use('/api/bookmarks', bookmarkRouter);

describe('Bookmarks API', () => {
  // テストデータ
  const sampleBookmarks = [
    {
      id: 1,
      title: 'テストブックマーク1',
      url: 'https://example.com',
      description: 'テスト用のブックマークです',
      tags: ['test', 'sample'],
      category: 'development',
      createdAt: '2025-08-03T12:00:00.000Z',
      updatedAt: '2025-08-03T12:00:00.000Z'
    },
    {
      id: 2,
      title: 'テストブックマーク2',
      url: 'https://example2.com',
      description: 'もう一つのテスト用ブックマーク',
      tags: ['test', 'reference'],
      category: 'reference',
      createdAt: '2025-08-03T12:00:00.000Z',
      updatedAt: '2025-08-03T12:00:00.000Z'
    }
  ];

  beforeEach(() => {
    // 各テストの前にモックをリセット
    jest.clearAllMocks();
  });

  describe('GET /api/bookmarks', () => {
    it('すべてのブックマークを取得できる', async () => {
      bookmarkStorage.getBookmarks.mockResolvedValue(sampleBookmarks);

      const response = await request(app)
        .get('/api/bookmarks')
        .expect(200);

      expect(response.body).toEqual(sampleBookmarks);
      expect(bookmarkStorage.getBookmarks).toHaveBeenCalledTimes(1);
    });

    it('検索パラメータでブックマークをフィルタできる', async () => {
      const filteredBookmarks = [sampleBookmarks[0]];
      bookmarkStorage.searchBookmarks.mockResolvedValue(filteredBookmarks);

      const response = await request(app)
        .get('/api/bookmarks')
        .query({ search: 'テスト', category: 'development' })
        .expect(200);

      expect(response.body).toEqual(filteredBookmarks);
      expect(bookmarkStorage.searchBookmarks).toHaveBeenCalledWith({
        search: 'テスト',
        category: 'development'
      });
    });

    it('サーバーエラーの場合500を返す', async () => {
      bookmarkStorage.getBookmarks.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/bookmarks')
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Failed to fetch bookmarks');
    });
  });

  describe('GET /api/bookmarks/:id', () => {
    it('指定されたIDのブックマークを取得できる', async () => {
      bookmarkStorage.getBookmarkById.mockResolvedValue(sampleBookmarks[0]);

      const response = await request(app)
        .get('/api/bookmarks/1')
        .expect(200);

      expect(response.body).toEqual(sampleBookmarks[0]);
      expect(bookmarkStorage.getBookmarkById).toHaveBeenCalledWith('1');
    });

    it('存在しないIDの場合404を返す', async () => {
      bookmarkStorage.getBookmarkById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/bookmarks/999')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Bookmark not found');
    });

    it('サーバーエラーの場合500を返す', async () => {
      bookmarkStorage.getBookmarkById.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/bookmarks/1')
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Failed to fetch bookmark');
    });
  });

  describe('POST /api/bookmarks', () => {
    const newBookmark = {
      title: '新しいブックマーク',
      url: 'https://newexample.com',
      description: '新しいテスト用ブックマーク',
      tags: ['new', 'test'],
      category: 'development'
    };

    it('新しいブックマークを作成できる', async () => {
      const createdBookmark = { id: 3, ...newBookmark };
      bookmarkStorage.addBookmark.mockResolvedValue(createdBookmark);

      const response = await request(app)
        .post('/api/bookmarks')
        .send(newBookmark)
        .expect(201);

      expect(response.body).toEqual(createdBookmark);
      expect(bookmarkStorage.addBookmark).toHaveBeenCalledWith(newBookmark);
    });

    it('必須フィールドがない場合400を返す', async () => {
      const invalidBookmark = { description: 'URLなし' };

      const response = await request(app)
        .post('/api/bookmarks')
        .send(invalidBookmark)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Title and URL are required');
    });

    it('無効なURLの場合400を返す', async () => {
      const invalidBookmark = {
        title: 'テスト',
        url: 'invalid-url'
      };

      const response = await request(app)
        .post('/api/bookmarks')
        .send(invalidBookmark)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid URL format');
    });

    it('重複URLの場合409を返す', async () => {
      bookmarkStorage.addBookmark.mockRejectedValue(new Error('URL already exists'));

      const response = await request(app)
        .post('/api/bookmarks')
        .send(newBookmark)
        .expect(409);

      expect(response.body).toHaveProperty('error', 'URL already exists');
    });

    it('サーバーエラーの場合500を返す', async () => {
      bookmarkStorage.addBookmark.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/bookmarks')
        .send(newBookmark)
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Failed to create bookmark');
    });
  });

  describe('PUT /api/bookmarks/:id', () => {
    const updateData = {
      title: '更新されたブックマーク',
      url: 'https://updated-example.com',
      description: '更新された説明',
      category: 'updated'
    };

    it('ブックマークを更新できる', async () => {
      const updatedBookmark = { id: 1, ...sampleBookmarks[0], ...updateData };
      bookmarkStorage.updateBookmark.mockResolvedValue(updatedBookmark);

      const response = await request(app)
        .put('/api/bookmarks/1')
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual(updatedBookmark);
      expect(bookmarkStorage.updateBookmark).toHaveBeenCalledWith('1', updateData);
    });

    it('存在しないIDの場合404を返す', async () => {
      bookmarkStorage.updateBookmark.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/bookmarks/999')
        .send(updateData)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Bookmark not found');
    });

    it('URL重複の場合409を返す', async () => {
      bookmarkStorage.updateBookmark.mockRejectedValue(new Error('URL already exists'));

      const response = await request(app)
        .put('/api/bookmarks/1')
        .send({ url: 'https://duplicate.com' })
        .expect(409);

      expect(response.body).toHaveProperty('error', 'URL already exists');
    });

    it('サーバーエラーの場合500を返す', async () => {
      bookmarkStorage.updateBookmark.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .put('/api/bookmarks/1')
        .send(updateData)
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Failed to update bookmark');
    });
  });

  describe('DELETE /api/bookmarks/:id', () => {
    it('ブックマークを削除できる', async () => {
      bookmarkStorage.deleteBookmark.mockResolvedValue(true);

      const response = await request(app)
        .delete('/api/bookmarks/1')
        .expect(204);

      expect(response.body).toEqual({});
      expect(bookmarkStorage.deleteBookmark).toHaveBeenCalledWith('1');
    });

    it('存在しないIDの場合404を返す', async () => {
      bookmarkStorage.deleteBookmark.mockResolvedValue(false);

      const response = await request(app)
        .delete('/api/bookmarks/999')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Bookmark not found');
    });

    it('サーバーエラーの場合500を返す', async () => {
      bookmarkStorage.deleteBookmark.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .delete('/api/bookmarks/1')
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Failed to delete bookmark');
    });
  });

  describe('Meta endpoints', () => {
    describe('GET /api/bookmarks/meta/categories', () => {
      it('カテゴリ一覧を取得できる', async () => {
        const categories = ['development', 'reference', 'tools'];
        bookmarkStorage.getCategories.mockResolvedValue(categories);

        const response = await request(app)
          .get('/api/bookmarks/meta/categories')
          .expect(200);

        expect(response.body).toEqual(categories);
        expect(bookmarkStorage.getCategories).toHaveBeenCalledTimes(1);
      });

      it('サーバーエラーの場合500を返す', async () => {
        bookmarkStorage.getCategories.mockRejectedValue(new Error('Database error'));

        const response = await request(app)
          .get('/api/bookmarks/meta/categories')
          .expect(500);

        expect(response.body).toHaveProperty('error', 'Failed to fetch categories');
      });
    });

    describe('GET /api/bookmarks/meta/tags', () => {
      it('タグ一覧を取得できる', async () => {
        const tags = ['javascript', 'nodejs', 'test', 'reference'];
        bookmarkStorage.getTags.mockResolvedValue(tags);

        const response = await request(app)
          .get('/api/bookmarks/meta/tags')
          .expect(200);

        expect(response.body).toEqual(tags);
        expect(bookmarkStorage.getTags).toHaveBeenCalledTimes(1);
      });

      it('サーバーエラーの場合500を返す', async () => {
        bookmarkStorage.getTags.mockRejectedValue(new Error('Database error'));

        const response = await request(app)
          .get('/api/bookmarks/meta/tags')
          .expect(500);

        expect(response.body).toHaveProperty('error', 'Failed to fetch tags');
      });
    });

    describe('GET /api/bookmarks/meta/stats', () => {
      it('統計情報を取得できる', async () => {
        const mockStats = {
          totalBookmarks: 10,
          totalCategories: 3,
          totalTags: 5,
          categories: ['development', 'reference', 'tools'],
          tags: ['javascript', 'nodejs', 'test', 'reference', 'tools']
        };

        bookmarkStorage.getBookmarkCount.mockResolvedValue(10);
        bookmarkStorage.getCategories.mockResolvedValue(['development', 'reference', 'tools']);
        bookmarkStorage.getTags.mockResolvedValue(['javascript', 'nodejs', 'test', 'reference', 'tools']);

        const response = await request(app)
          .get('/api/bookmarks/meta/stats')
          .expect(200);

        expect(response.body).toEqual(mockStats);
        expect(bookmarkStorage.getBookmarkCount).toHaveBeenCalledTimes(1);
        expect(bookmarkStorage.getCategories).toHaveBeenCalledTimes(1);
        expect(bookmarkStorage.getTags).toHaveBeenCalledTimes(1);
      });

      it('サーバーエラーの場合500を返す', async () => {
        bookmarkStorage.getBookmarkCount.mockRejectedValue(new Error('Database error'));

        const response = await request(app)
          .get('/api/bookmarks/meta/stats')
          .expect(500);

        expect(response.body).toHaveProperty('error', 'Failed to fetch bookmark statistics');
      });
    });
  });
});
