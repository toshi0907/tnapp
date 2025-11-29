/**
 * Express アプリケーション作成ファクトリー
 * ミドルウェア、ルーター、エンドポイントを設定したExpressアプリを生成
 */

// 必要なライブラリとモジュールのインポート
const express = require('express');  // Express.js フレームワーク
const cors = require('cors');  // Cross-Origin Resource Sharing 対応
const helmet = require('helmet');  // セキュリティヘッダー設定
const { specs, swaggerUi, swaggerUiOptions, createSwaggerSetup } = require('./config/swagger');  // Swagger UI 設定
const bookmarkRouter = require('./routes/bookmarks');  // ブックマーク API ルーター
const reminderRouter = require('./routes/reminders');  // リマインダー API ルーター

const path = require('path');  // パス操作ユーティリティ
require('dotenv').config();  // 環境変数の読み込み

/**
 * Express アプリケーションを作成し設定する関数
 * @returns {Object} 設定済みの Express アプリケーションインスタンス
 */
function createApp() {
  // Express アプリケーションインスタンスを作成
  const app = express();

  // Swagger UI の設定 - API仕様書を提供（動的サーバー設定対応）
  app.use('/api-docs', swaggerUi.serve);
  app.get('/api-docs', (req, res, next) => {
    // リクエストコンテキストに基づいて動的にサーバー設定を作成
    const dynamicSpecs = createSwaggerSetup(req);
    swaggerUi.setup(dynamicSpecs, swaggerUiOptions)(req, res, next);
  });

  // セキュリティとCORS設定
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "img-src": ["'self'", "data:", "https://www.google.com", "https://cdn-ak.favicon.st-hatena.com"],
        "script-src": ["'self'", "https://cdn.jsdelivr.net"]
      }
    }
  }));  // セキュリティヘッダーを自動設定（XSS, CSP等）、favicon用のimg-src許可とChart.js CDN用のscript-src許可を含む
  app.use(cors());  // 全オリジンからのアクセスを許可
  
  // リクエストボディの解析設定
  app.use(express.json());  // JSON形式のリクエストボディを解析
  app.use(express.urlencoded({ extended: true }));  // URL エンコード形式のボディを解析

  // ヘルスチェックエンドポイント - システム状態とデータベース統計を返す
  const bookmarkStorage = require('./database/bookmarkStorage');
  const reminderStorage = require('./database/reminderStorage');
  
  app.get('/health', async (req, res) => {
    try {
      // 各データベースから統計情報を非同期で取得
      const bookmarkCount = await bookmarkStorage.getBookmarkCount();  // ブックマーク総数
      const reminderCount = await reminderStorage.getReminderCount();  // リマインダー総数
      const pendingReminders = await reminderStorage.getPendingCount();  // 未送信リマインダー数
      const sentReminders = await reminderStorage.getSentCount();  // 送信済みリマインダー数
      
      // 正常な統計情報を含むレスポンスを返す
      res.status(200).json({
        status: 'OK',
        message: 'API Server is running',
        database: 'JSON File Storage',
        bookmarkCount,
        reminderCount, pendingReminders, sentReminders,
        timestamp: new Date().toISOString()
      });
    } catch {
      // データベースアクセスに失敗した場合でもサーバー状態は正常として返す
      res.status(200).json({
        status: 'OK',
        message: 'API Server is running',
        database: 'JSON File Storage',
        warning: 'Could not access database',
        timestamp: new Date().toISOString()
      });
    }
  });

  // 設定情報エンドポイント - フロントエンドが設定を取得するため
  app.get('/config', (req, res) => {
    res.json({
      port: process.env.PORT || 3000,  // サーバーポート番号
      authEnabled: process.env.BASIC_AUTH_ENABLED !== 'false'  // Basic認証の有効/無効状態
    });
  });

  // 静的ファイル配信設定 - フロントエンドファイル（HTML, CSS, JS）を提供
  const publicDir = path.join(__dirname, '..', 'public');
  app.use('/public', express.static(publicDir));
  
  // フロントエンドページのルーティング設定
  // 各機能ごとの個別Webインターフェースを提供
  
  // メインページ - 全機能へのリンクページ
  app.get('/', (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });
  
  // ブックマーク管理ページ
  app.get('/bookmark', (req, res) => {
    res.sendFile(path.join(publicDir, 'bookmark', 'index.html'));
  });
  
  // リマインダー管理ページ
  app.get('/reminder', (req, res) => {
    res.sendFile(path.join(publicDir, 'reminder', 'index.html'));
  });


  // API ルーターの設定 - 各機能のRESTful APIエンドポイントを設定
  app.use('/api/bookmarks', bookmarkRouter);  // ブックマーク関連API
  app.use('/api/reminders', reminderRouter);  // リマインダー関連API

  // 404エラーハンドラー - 存在しないルートへのアクセス時
  app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });

  // グローバルエラーハンドラー - 未処理の例外をキャッチ
  app.use((err, req, res, next) => {
    console.error(err.stack);  // エラーの詳細をコンソールに出力
    res.status(500).json({ error: 'Something went wrong!' });
  });

  // 設定済みのExpressアプリケーションを返す
  return app;
}

module.exports = { createApp };