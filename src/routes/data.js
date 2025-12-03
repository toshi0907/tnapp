/**
 * データエクスポート/インポートAPIルート
 * JSONファイルのダウンロードとアップロード機能を提供
 */

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const bookmarkStorage = require('../database/bookmarkStorage');
const reminderStorage = require('../database/reminderStorage');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Data
 *   description: データエクスポート/インポートAPI
 */

/**
 * @swagger
 * /api/data/export:
 *   get:
 *     summary: 全データをエクスポート
 *     description: ブックマークとリマインダーの全データをJSON形式でエクスポート
 *     tags: [Data]
 *     responses:
 *       200:
 *         description: エクスポートデータ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 version:
 *                   type: string
 *                   description: エクスポートデータのバージョン
 *                   example: "1.0"
 *                 exportedAt:
 *                   type: string
 *                   format: date-time
 *                   description: エクスポート日時
 *                 bookmarks:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Bookmark'
 *                 reminders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Reminder'
 *       500:
 *         description: サーバーエラー
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// 全データをエクスポート
router.get('/export', async (req, res) => {
  try {
    // 全データを取得
    const bookmarks = await bookmarkStorage.getBookmarks();
    const reminders = await reminderStorage.getReminders();

    // エクスポートデータを構築
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      bookmarks,
      reminders
    };

    // ダウンロード用のヘッダーを設定
    const filename = `tnapp-export-${new Date().toISOString().split('T')[0]}.json`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/json');

    res.json(exportData);
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

/**
 * @swagger
 * /api/data/import:
 *   post:
 *     summary: データをインポート
 *     description: エクスポートされたJSONデータをインポートして既存データを置き換え
 *     tags: [Data]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookmarks
 *               - reminders
 *             properties:
 *               version:
 *                 type: string
 *                 description: エクスポートデータのバージョン
 *               exportedAt:
 *                 type: string
 *                 format: date-time
 *                 description: エクスポート日時
 *               bookmarks:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Bookmark'
 *               reminders:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Reminder'
 *     responses:
 *       200:
 *         description: インポート成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Data imported successfully"
 *                 imported:
 *                   type: object
 *                   properties:
 *                     bookmarks:
 *                       type: integer
 *                       description: インポートされたブックマーク数
 *                     reminders:
 *                       type: integer
 *                       description: インポートされたリマインダー数
 *       400:
 *         description: バリデーションエラー
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
// データをインポート
router.post('/import', async (req, res) => {
  try {
    const { bookmarks, reminders } = req.body;

    // バリデーション
    if (!Array.isArray(bookmarks)) {
      return res.status(400).json({ error: 'bookmarks must be an array' });
    }
    if (!Array.isArray(reminders)) {
      return res.status(400).json({ error: 'reminders must be an array' });
    }

    // データファイルのパスを取得（ストレージモジュールと同じパスを使用）
    const dataDir = path.join(__dirname, '../../data');

    // データディレクトリが存在しない場合は作成
    await fs.mkdir(dataDir, { recursive: true });

    // ブックマークデータを保存
    await fs.writeFile(
      path.join(dataDir, 'bookmarks.json'),
      JSON.stringify(bookmarks, null, 2)
    );

    // リマインダーデータを保存
    await fs.writeFile(
      path.join(dataDir, 'reminders.json'),
      JSON.stringify(reminders, null, 2)
    );

    res.json({
      message: 'Data imported successfully',
      imported: {
        bookmarks: bookmarks.length,
        reminders: reminders.length
      }
    });
  } catch (error) {
    console.error('Error importing data:', error);
    res.status(500).json({ error: 'Failed to import data' });
  }
});

module.exports = router;
