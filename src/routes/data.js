/**
 * データエクスポート/インポートAPIルート
 * dataフォルダのJSONファイルのダウンロードとアップロード機能を提供
 */

const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();

// dataフォルダのパス
const DATA_DIR = path.join(__dirname, '../../data');

// サポートするファイル名のリスト
const SUPPORTED_FILES = ['bookmarks.json', 'reminders.json'];

/**
 * @swagger
 * tags:
 *   name: Data
 *   description: データエクスポート/インポートAPI
 */

/**
 * @swagger
 * /api/data/files:
 *   get:
 *     summary: 利用可能なデータファイル一覧を取得
 *     description: dataフォルダにあるJSONファイルの一覧を取得
 *     tags: [Data]
 *     responses:
 *       200:
 *         description: ファイル一覧
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     description: ファイル名
 *                   size:
 *                     type: integer
 *                     description: ファイルサイズ（バイト）
 */
// 利用可能なデータファイル一覧を取得
router.get('/files', async (req, res) => {
  try {
    const files = [];
    for (const filename of SUPPORTED_FILES) {
      const filePath = path.join(DATA_DIR, filename);
      try {
        const stats = await fs.stat(filePath);
        files.push({
          name: filename,
          size: stats.size
        });
      } catch (error) {
        // ファイルが存在しない場合はスキップ（ENOENTエラーのみ）
        if (error.code !== 'ENOENT') {
          console.error(`Error accessing file ${filename}:`, error);
        }
      }
    }
    res.json(files);
  } catch (error) {
    console.error('Error listing data files:', error);
    res.status(500).json({ error: 'Failed to list data files' });
  }
});

/**
 * @swagger
 * /api/data/export/{filename}:
 *   get:
 *     summary: 指定したJSONファイルをダウンロード
 *     description: dataフォルダのJSONファイルをそのままダウンロード
 *     tags: [Data]
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *           enum: [bookmarks.json, reminders.json]
 *         description: ダウンロードするファイル名
 *     responses:
 *       200:
 *         description: JSONファイル
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *       404:
 *         description: ファイルが見つからない
 *       500:
 *         description: サーバーエラー
 */
// 指定したJSONファイルをダウンロード
router.get('/export/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    
    // サポートされていないファイル名をブロック（ホワイトリストでパストラバーサルを防止）
    if (!SUPPORTED_FILES.includes(filename)) {
      return res.status(400).json({ error: 'Unsupported file name' });
    }
    
    const filePath = path.join(DATA_DIR, filename);
    
    // ファイルの存在確認
    try {
      await fs.access(filePath);
    } catch (error) {
      // ファイルが存在しない場合のみ404を返す
      if (error.code === 'ENOENT') {
        return res.status(404).json({ error: 'File not found' });
      }
      // その他のエラーは500を返す
      console.error('Error accessing file:', error);
      return res.status(500).json({ error: 'Failed to access file' });
    }
    
    // ファイルの内容を読み込み
    const content = await fs.readFile(filePath, 'utf-8');
    
    // ダウンロード用のヘッダーを設定
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/json');
    
    res.send(content);
  } catch (error) {
    console.error('Error exporting data file:', error);
    res.status(500).json({ error: 'Failed to export data file' });
  }
});

/**
 * @swagger
 * /api/data/import/{filename}:
 *   post:
 *     summary: 指定したJSONファイルをアップロード
 *     description: dataフォルダのJSONファイルを上書き保存
 *     tags: [Data]
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *           enum: [bookmarks.json, reminders.json]
 *         description: アップロードするファイル名
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             description: インポートするデータの配列
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
 *                   example: "File imported successfully"
 *                 filename:
 *                   type: string
 *                   description: インポートされたファイル名
 *                 count:
 *                   type: integer
 *                   description: インポートされたアイテム数
 *       400:
 *         description: バリデーションエラー
 *       500:
 *         description: サーバーエラー
 */
// 指定したJSONファイルをアップロード
router.post('/import/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const data = req.body;
    
    // サポートされていないファイル名をブロック
    if (!SUPPORTED_FILES.includes(filename)) {
      return res.status(400).json({ error: 'Unsupported file name' });
    }
    
    // データが配列であることを確認
    if (!Array.isArray(data)) {
      return res.status(400).json({ error: 'Data must be an array' });
    }
    
    const filePath = path.join(DATA_DIR, filename);
    
    // データディレクトリが存在しない場合は作成
    await fs.mkdir(DATA_DIR, { recursive: true });
    
    // ファイルに保存
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    
    res.json({
      message: 'File imported successfully',
      filename,
      count: data.length
    });
  } catch (error) {
    console.error('Error importing data file:', error);
    res.status(500).json({ error: 'Failed to import data file' });
  }
});

module.exports = router;
