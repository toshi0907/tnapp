const express = require('express');
const geminiStorage = require('../database/geminiStorage');
const geminiService = require('../services/geminiService');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Gemini
 *   description: "Gemini AI API 管理"
 */

/**
 * @swagger
 * /api/gemini:
 *   get:
 *     summary: Gemini結果一覧取得
 *     description: "Gemini API実行結果の一覧を取得。検索、フィルタリング機能あり"
 *     tags: [Gemini]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: "検索キーワード（プロンプト、レスポンス、タグを対象）"
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: "カテゴリでフィルタ"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [success, error]
 *         description: "ステータスでフィルタ"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: "取得件数（デフォルト: 50）"
 *     responses:
 *       200:
 *         description: Gemini結果一覧
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/GeminiResult'
 *       500:
 *         description: サーバーエラー
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Gemini結果一覧取得
router.get('/', async (req, res) => {
  try {
    let results = await geminiStorage.getGeminiResults();
    
    // 検索フィルタ
    if (req.query.search) {
      const searchTerm = req.query.search.toLowerCase();
      results = results.filter(result => 
        (result.prompt && result.prompt.toLowerCase().includes(searchTerm)) ||
        (result.response && result.response.toLowerCase().includes(searchTerm)) ||
        (result.tags && result.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
      );
    }
    
    // カテゴリフィルタ
    if (req.query.category) {
      results = results.filter(result => result.category === req.query.category);
    }
    
    // ステータスフィルタ
    if (req.query.status) {
      results = results.filter(result => result.status === req.query.status);
    }
    
    // 日付順でソート（新しいものから）
    results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // 取得件数制限
    const limit = parseInt(req.query.limit) || 50;
    results = results.slice(0, limit);
    
    res.json(results);
  } catch (error) {
    console.error('Error fetching gemini results:', error);
    res.status(500).json({ error: 'Failed to fetch gemini results' });
  }
});

/**
 * @swagger
 * /api/gemini/jobs:
 *   get:
 *     summary: アクティブなジョブ一覧取得
 *     description: 現在実行中のGeminiスケジュールジョブ一覧を取得
 *     tags: [Gemini]
 *     responses:
 *       200:
 *         description: ジョブ一覧
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 jobs:
 *                   type: array
 *                   items:
 *                     type: string
 *                 count:
 *                   type: integer
 */
// アクティブなジョブ一覧取得
router.get('/jobs', async (req, res) => {
  try {
    const jobs = geminiService.listActiveJobs();
    res.json({
      jobs,
      count: jobs.length
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

/**
 * @swagger
 * /api/gemini/meta/categories:
 *   get:
 *     summary: カテゴリ一覧取得
 *     description: Gemini結果で使用されているカテゴリ一覧を取得
 *     tags: [Gemini]
 *     responses:
 *       200:
 *         description: カテゴリ一覧
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 */
// カテゴリ一覧取得
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = await geminiStorage.getCategories();
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

/**
 * @swagger
 * /api/gemini/meta/tags:
 *   get:
 *     summary: タグ一覧取得
 *     description: Gemini結果で使用されているタグ一覧を取得
 *     tags: [Gemini]
 *     responses:
 *       200:
 *         description: タグ一覧
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 */
// タグ一覧取得
router.get('/meta/tags', async (req, res) => {
  try {
    const tags = await geminiStorage.getTags();
    res.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

/**
 * @swagger
 * /api/gemini/meta/stats:
 *   get:
 *     summary: 統計情報取得
 *     description: Gemini API使用統計を取得
 *     tags: [Gemini]
 *     responses:
 *       200:
 *         description: 統計情報
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   description: 総実行回数
 *                 successful:
 *                   type: integer
 *                   description: 成功回数
 *                 failed:
 *                   type: integer
 *                   description: 失敗回数
 *                 successRate:
 *                   type: string
 *                   description: "成功率（%）"
 *                 avgExecutionTime:
 *                   type: integer
 *                   description: "平均実行時間（ms）"
 *                 totalTokens:
 *                   type: integer
 *                   description: 総トークン使用量
 */
// 統計情報取得
router.get('/meta/stats', async (req, res) => {
  try {
    const stats = await geminiStorage.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/**
 * @swagger
 * /api/gemini/test:
 *   post:
 *     summary: Gemini API接続テスト
 *     description: Gemini APIとの接続をテストし、設定が正しいか確認
 *     tags: [Gemini]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               prompt:
 *                 type: string
 *                 description: "テスト用プロンプト（省略可）"
 *     responses:
 *       200:
 *         description: テスト結果
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 result:
 *                   $ref: '#/components/schemas/GeminiResult'
 *                 error:
 *                   type: string
 */
// Gemini API接続テスト
router.post('/test', async (req, res) => {
  try {
    const { prompt } = req.body;
    const testResult = await geminiService.testGeminiAPI(prompt);
    
    res.json(testResult);
  } catch (error) {
    console.error('Error testing gemini API:', error);
    res.status(500).json({
      success: false,
      message: 'Test failed with internal error',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/gemini:
 *   post:
 *     summary: Gemini API実行
 *     description: プロンプトを指定してGemini APIを実行し、結果を保存
 *     tags: [Gemini]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prompt
 *             properties:
 *               prompt:
 *                 type: string
 *                 description: Geminiに送信するプロンプト
 *               category:
 *                 type: string
 *                 description: "カテゴリ（デフォルト: general）"
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: タグ
 *     responses:
 *       201:
 *         description: Gemini API実行成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GeminiResult'
 *       400:
 *         description: リクエストエラー
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
// Gemini API実行
router.post('/', async (req, res) => {
  try {
    const { prompt, category, tags } = req.body;
    
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ error: 'Prompt is required and must be a non-empty string' });
    }
    
    const result = await geminiService.executeCustomPrompt(
      prompt.trim(),
      category || 'general',
      tags || []
    );
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Error executing gemini prompt:', error);
    if (error.message.includes('not configured')) {
      res.status(400).json({ error: 'Gemini API key not configured' });
    } else {
      res.status(500).json({ error: 'Failed to execute gemini prompt' });
    }
  }
});

/**
 * @swagger
 * /api/gemini/{id}:
 *   get:
 *     summary: 特定Gemini結果取得
 *     description: 指定されたIDのGemini結果を取得
 *     tags: [Gemini]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Gemini結果ID
 *     responses:
 *       200:
 *         description: Gemini結果詳細
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GeminiResult'
 *       404:
 *         description: 結果が見つからない
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
// 特定Gemini結果取得
router.get('/:id', async (req, res) => {
  try {
    const result = await geminiStorage.getGeminiResultById(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'Gemini result not found' });
    }
    res.json(result);
  } catch (error) {
    console.error('Error fetching gemini result:', error);
    res.status(500).json({ error: 'Failed to fetch gemini result' });
  }
});

/**
 * @swagger
 * /api/gemini/{id}:
 *   delete:
 *     summary: Gemini結果削除
 *     description: 指定されたGemini結果を削除
 *     tags: [Gemini]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Gemini結果ID
 *     responses:
 *       200:
 *         description: 削除成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Gemini result deleted successfully
 *       404:
 *         description: 結果が見つからない
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
// Gemini結果削除
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await geminiStorage.deleteGeminiResult(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Gemini result not found' });
    }
    
    res.json({ message: 'Gemini result deleted successfully' });
  } catch (error) {
    console.error('Error deleting gemini result:', error);
    res.status(500).json({ error: 'Failed to delete gemini result' });
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     GeminiResult:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 結果ID
 *         prompt:
 *           type: string
 *           description: 送信されたプロンプト
 *         response:
 *           type: string
 *           description: Geminiからのレスポンス
 *         model:
 *           type: string
 *           description: 使用されたモデル名
 *         status:
 *           type: string
 *           enum: [success, error]
 *           description: 実行ステータス
 *         errorMessage:
 *           type: string
 *           description: "エラーメッセージ（エラー時のみ）"
 *         executionTime:
 *           type: integer
 *           description: "実行時間（ms）"
 *         tokensUsed:
 *           type: integer
 *           description: 使用トークン数
 *         category:
 *           type: string
 *           description: カテゴリ
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: タグ
 *         scheduledBy:
 *           type: string
 *           description: 実行方法（manual/scheduled/test）
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 作成日時
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: 更新日時
 */

module.exports = router;