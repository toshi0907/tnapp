const express = require('express');
const bookmarkStorage = require('../database/bookmarkStorage');
const { fetchPageTitle } = require('../utils/urlUtils');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Bookmarks
 *   description: ブックマーク管理API
 */

/**
 * @swagger
 * /api/bookmarks:
 *   get:
 *     summary: ブックマーク一覧取得
 *     description: ブックマーク一覧を取得。検索、フィルタリング機能あり
 *     tags: [Bookmarks]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 検索キーワード（タイトル、説明、タグを対象）
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: カテゴリでフィルタ
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *         description: タグでフィルタ
 *     responses:
 *       200:
 *         description: ブックマーク一覧
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Bookmark'
 *       500:
 *         description: サーバーエラー
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     summary: 新規ブックマーク作成
 *     description: 新しいブックマークを作成。タイトルが指定されていない場合、URLからページタイトルを自動取得
 *     tags: [Bookmarks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *             properties:
 *               title:
 *                 type: string
 *                 description: ブックマークタイトル（省略可能：URLから自動取得）
 *                 example: "Node.js"
 *               url:
 *                 type: string
 *                 format: uri
 *                 description: URL（必須、ユニーク）
 *                 example: "https://nodejs.org"
 *               description:
 *                 type: string
 *                 description: 説明
 *                 example: "Node.js JavaScript runtime"
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: タグ配列
 *                 example: ["javascript", "nodejs", "backend"]
 *               category:
 *                 type: string
 *                 description: カテゴリ
 *                 example: "development"
 *     responses:
 *       201:
 *         description: ブックマーク作成成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Bookmark'
 *       400:
 *         description: バリデーションエラー
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: URL重複エラー
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: サーバーエラー
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// ブックマーク一覧取得
router.get('/', async (req, res) => {
  try {
    const { category, tag, search } = req.query;
    
    let bookmarks;
    
    if (search || category || tag) {
      // 検索・フィルタリング機能を使用
      const filters = {};
      if (search) filters.search = search;
      if (category) filters.category = category;
      if (tag) filters.tag = tag;
      
      bookmarks = await bookmarkStorage.searchBookmarks(filters);
    } else {
      bookmarks = await bookmarkStorage.getBookmarks();
    }
    
    res.json(bookmarks);
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    res.status(500).json({ error: 'Failed to fetch bookmarks' });
  }
});

/**
 * @swagger
 * /api/bookmarks/{id}:
 *   get:
 *     summary: 特定ブックマーク取得
 *     description: 指定されたIDのブックマーク情報を取得
 *     tags: [Bookmarks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           format: int64
 *         description: ブックマークID
 *     responses:
 *       200:
 *         description: ブックマーク情報
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Bookmark'
 *       404:
 *         description: ブックマークが見つからない
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: サーバーエラー
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     summary: ブックマーク更新
 *     description: 指定されたIDのブックマーク情報を更新
 *     tags: [Bookmarks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           format: int64
 *         description: ブックマークID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - url
 *             properties:
 *               title:
 *                 type: string
 *                 description: ブックマークタイトル
 *               url:
 *                 type: string
 *                 format: uri
 *                 description: URL
 *               description:
 *                 type: string
 *                 description: 説明
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: タグ配列
 *               category:
 *                 type: string
 *                 description: カテゴリ
 *     responses:
 *       200:
 *         description: ブックマーク更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Bookmark'
 *       400:
 *         description: バリデーションエラー
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: ブックマークが見つからない
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: URL重複エラー
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: サーバーエラー
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     summary: ブックマーク削除
 *     description: 指定されたIDのブックマークを削除
 *     tags: [Bookmarks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           format: int64
 *         description: ブックマークID
 *     responses:
 *       204:
 *         description: ブックマーク削除成功
 *       404:
 *         description: ブックマークが見つからない
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: サーバーエラー
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// 特定ブックマーク取得
router.get('/:id', async (req, res) => {
  try {
    const bookmark = await bookmarkStorage.getBookmarkById(req.params.id);
    if (!bookmark) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }
    res.json(bookmark);
  } catch (error) {
    console.error('Error fetching bookmark:', error);
    res.status(500).json({ error: 'Failed to fetch bookmark' });
  }
});

// 新規ブックマーク作成
router.post('/', async (req, res) => {
  try {
    let { title, url, description, tags, category } = req.body;
    
    if (!url) {
      return res.status(400).json({
        error: 'URL is required'
      });
    }

    // URLの形式チェック
    try {
      new URL(url);
    } catch {
      return res.status(400).json({
        error: 'Invalid URL format'
      });
    }

    // タイトルが提供されていない場合、URLからタイトルを取得
    if (!title || title.trim() === '') {
      try {
        const fetchedTitle = await fetchPageTitle(url);
        if (fetchedTitle) {
          title = fetchedTitle;
        } else {
          // タイトル取得に失敗した場合はURLからホスト名を使用
          const urlObj = new URL(url);
          title = urlObj.hostname;
        }
      } catch (error) {
        console.warn('Failed to fetch title for URL:', url, error.message);
        // タイトル取得に失敗した場合はURLからホスト名を使用
        const urlObj = new URL(url);
        title = urlObj.hostname;
      }
    }

    const newBookmark = await bookmarkStorage.addBookmark({ 
      title, 
      url, 
      description, 
      tags: Array.isArray(tags) ? tags : [], 
      category 
    });
    res.status(201).json(newBookmark);
  } catch (error) {
    console.error('Error creating bookmark:', error);
    if (error.message === 'URL already exists') {
      res.status(409).json({ error: 'URL already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create bookmark' });
    }
  }
});

// ブックマーク更新
router.put('/:id', async (req, res) => {
  try {
    const { title, url, description, tags, category } = req.body;
    
    // URLが提供された場合のみ形式チェック
    if (url) {
      try {
        new URL(url);
      } catch {
        return res.status(400).json({
          error: 'Invalid URL format'
        });
      }
    }

    const updatedBookmark = await bookmarkStorage.updateBookmark(req.params.id, { 
      title, 
      url, 
      description, 
      tags: Array.isArray(tags) ? tags : undefined, 
      category 
    });
    
    if (!updatedBookmark) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }
    
    res.json(updatedBookmark);
  } catch (error) {
    console.error('Error updating bookmark:', error);
    if (error.message === 'URL already exists') {
      res.status(409).json({ error: 'URL already exists' });
    } else {
      res.status(500).json({ error: 'Failed to update bookmark' });
    }
  }
});

// ブックマーク削除
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await bookmarkStorage.deleteBookmark(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting bookmark:', error);
    res.status(500).json({ error: 'Failed to delete bookmark' });
  }
});

// カテゴリ一覧取得
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = await bookmarkStorage.getCategories();
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// タグ一覧取得
router.get('/meta/tags', async (req, res) => {
  try {
    const tags = await bookmarkStorage.getTags();
    res.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// ブックマーク統計
router.get('/meta/stats', async (req, res) => {
  try {
    const totalCount = await bookmarkStorage.getBookmarkCount();
    const categories = await bookmarkStorage.getCategories();
    const tags = await bookmarkStorage.getTags();
    
    res.json({
      totalBookmarks: totalCount,
      totalCategories: categories.length,
      totalTags: tags.length,
      categories,
      tags
    });
  } catch (error) {
    console.error('Error fetching bookmark stats:', error);
    res.status(500).json({ error: 'Failed to fetch bookmark statistics' });
  }
});

module.exports = router;
