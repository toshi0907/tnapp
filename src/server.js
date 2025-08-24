/**
 * メインサーバーファイル
 * Express.js アプリケーションサーバーを起動し、各種サービスを初期化する
 */

// 必要なモジュールとサービスをインポート
const { createApp } = require('./createApp');  // Express アプリケーション作成ファクトリー
const { initializeData } = require('./initData');  // サンプルデータ初期化機能
const notificationService = require('./services/notificationService');  // 通知サービス（リマインダー機能）
const geminiService = require('./services/geminiService');  // Gemini AI サービス
require('dotenv').config();  // 環境変数の読み込み

// サーバーのポート番号を環境変数から取得（デフォルト: 3000）
const PORT = process.env.PORT || 3000;

// Express アプリケーションインスタンスを作成
const app = createApp();

/**
 * サーバーを起動する非同期関数
 * データ初期化、スケジュール設定、サーバー起動を順次実行
 */
async function startServer() {
  try {
    // サンプルデータを初期化（初回起動時のみ実行）
    await initializeData();
    
    // リマインダー通知のスケジュールを初期化
    // 既存のリマインダーデータから通知タイマーを復元
    await notificationService.initializeSchedules();
    
    // Gemini AI の定期実行スケジュールを初期化
    // 予約されたプロンプトの実行タイマーを復元
    await geminiService.initializeSchedules();
    
    // 指定ポートでHTTPサーバーを開始
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  } catch (error) {
    // サーバー起動に失敗した場合はエラーを出力して終了
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// このファイルが直接実行された場合のみサーバーを起動
// テスト環境では require() されるだけでサーバー起動しない
if (require.main === module) {
  startServer();
}

// テスト用にアプリケーションインスタンスをエクスポート
module.exports = app;
