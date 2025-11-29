/**
 * サンプルデータ初期化モジュール
 * アプリケーション初回起動時に各種データベースファイルに
 * サンプルデータを登録するための初期化処理
 */

// 各データ管理ストレージクラスをインポート
const bookmarkStorage = require('./database/bookmarkStorage');  // ブックマークデータ管理
const reminderStorage = require('./database/reminderStorage');  // リマインダーデータ管理

/**
 * 全データベースのサンプルデータを初期化する非同期関数
 * 既存データがある場合は追加せず、空の場合のみサンプルデータを作成
 */
async function initializeData() {
  try {
    console.log('🔄 Initializing sample data...');
    
    // ブックマークデータの初期化処理
    // 既存のブックマークデータを確認
    const existingBookmarks = await bookmarkStorage.getBookmarks();
    
    if (existingBookmarks.length === 0) {
      // データが空の場合のみサンプルブックマークを追加
      
      // 開発関連のブックマーク例
      await bookmarkStorage.addBookmark({
        title: 'GitHub',
        url: 'https://github.com',
        description: 'The world\'s leading software development platform',
        tags: ['development', 'git', 'coding'],
        category: 'development'
      });
      
      // Node.js公式サイト
      await bookmarkStorage.addBookmark({
        title: 'Node.js',
        url: 'https://nodejs.org',
        description: 'Node.js JavaScript runtime',
        tags: ['javascript', 'nodejs', 'backend'],
        category: 'development'
      });
      
      // 技術文書参照サイト
      await bookmarkStorage.addBookmark({
        title: 'MDN Web Docs',
        url: 'https://developer.mozilla.org',
        description: 'Resources for developers, by developers',
        tags: ['documentation', 'web', 'reference'],
        category: 'reference'
      });
      
      // プログラミング質問サイト
      await bookmarkStorage.addBookmark({
        title: 'Stack Overflow',
        url: 'https://stackoverflow.com',
        description: 'Where developers learn, share, & build careers',
        tags: ['q&a', 'programming', 'help'],
        category: 'reference'
      });
      
      console.log('✅ Sample bookmarks initialized successfully');
    } else {
      console.log(`📚 Database already contains ${existingBookmarks.length} bookmarks`);
    }

    // リマインダーデータの初期化処理
    // 既存のリマインダーデータを確認
    const existingReminders = await reminderStorage.getReminders();
    
    if (existingReminders.length === 0) {
      // データが空の場合のみサンプルリマインダーを追加
      
      // 現在時刻を基準に将来の日時を計算
      const now = new Date();
      const futureDateTime1 = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1日後
      const futureDateTime2 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 1週間後
      const futureDateTime3 = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2時間後

      // Webhook通知のリマインダー（仕事関連）
      await reminderStorage.addReminder({
        title: '会議の準備',
        message: '明日のプロジェクト会議の資料を確認してください。議題とプレゼンテーションを準備しましょう。',
        notificationDateTime: futureDateTime1.toISOString(),
        notificationMethod: 'webhook',
        category: 'work',
        tags: ['meeting', 'important', 'preparation']
      });

      // Email通知のリマインダー（健康関連）
      await reminderStorage.addReminder({
        title: '健康診断の予約',
        message: '年次健康診断の予約を忘れずに取ってください。',
        notificationDateTime: futureDateTime2.toISOString(),
        notificationMethod: 'email',
        category: 'health',
        tags: ['health', 'annual', 'appointment']
      });

      // 繰り返し設定付きのリマインダー（開発関連）
      await reminderStorage.addReminder({
        title: 'API サーバーのデプロイ',
        message: '新機能をプロダクション環境にデプロイする時間です。',
        notificationDateTime: futureDateTime3.toISOString(),
        notificationMethod: 'webhook',
        category: 'development',
        tags: ['deployment', 'production', 'urgent'],
        repeatSettings: {
          interval: 'weekly',  // 週次繰り返し
          maxOccurrences: 5,   // 最大5回実行
          currentOccurrence: 1  // 現在1回目
        }
      });

      console.log('✅ Sample reminders initialized successfully');
    } else {
      console.log(`🔔 Database already contains ${existingReminders.length} reminders`);
    }
  } catch (error) {
    // 初期化処理中にエラーが発生した場合はコンソールに出力
    console.error('❌ Error initializing data:', error);
  }
}

// このファイルが直接実行された場合のみ初期化を実行
// require() された場合は実行しない（テスト環境対応）
if (require.main === module) {
  initializeData();
}

// 他のモジュールから呼び出せるようにエクスポート
module.exports = { initializeData };
