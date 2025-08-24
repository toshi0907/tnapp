/**
 * サンプルデータ初期化モジュール
 * アプリケーション初回起動時に各種データベースファイルに
 * サンプルデータを登録するための初期化処理
 */

// 各データ管理ストレージクラスをインポート
const bookmarkStorage = require('./database/bookmarkStorage');  // ブックマークデータ管理
const todoStorage = require('./database/todoStorage');  // TODOデータ管理
const reminderStorage = require('./database/reminderStorage');  // リマインダーデータ管理
const geminiStorage = require('./database/geminiStorage');  // Gemini AI実行結果データ管理

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

    // TODOデータの初期化処理
    // 既存のTODOデータを確認
    const existingTodos = await todoStorage.getTodos();
    
    if (existingTodos.length === 0) {
      // データが空の場合のみサンプルTODOを追加
      
      // 高優先度の開発タスク（期限: 1週間後）
      await todoStorage.addTodo({
        title: 'APIサーバーの開発を完了する',
        description: 'Node.js Express.jsを使用したRESTful APIサーバーの開発',
        priority: 'high',
        category: 'development',
        tags: ['api', 'nodejs', 'express'],
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 1週間後
      });
      
      // 中優先度のドキュメント作成（期限: 3日後）
      await todoStorage.addTodo({
        title: 'ドキュメント作成',
        description: 'READMEファイルとAPI仕様書の作成',
        priority: 'medium',
        category: 'documentation',
        tags: ['docs', 'readme'],
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3日後
      });
      
      // 中優先度のテスト作成（期限なし）
      await todoStorage.addTodo({
        title: 'ユニットテストの作成',
        description: 'APIエンドポイントのユニットテストを作成する',
        priority: 'medium',
        category: 'testing',
        tags: ['test', 'unit-test'],
        dueDate: null
      });
      
      // 低優先度のレビュータスク（期限なし）
      await todoStorage.addTodo({
        title: 'コードレビュー',
        description: 'チームメンバーによるコードレビューを実施',
        priority: 'low',
        category: 'review',
        tags: ['review', 'quality'],
        dueDate: null
      });
      
      // 完了済みのTODOサンプルも作成
      const completedTodo = await todoStorage.addTodo({
        title: 'プロジェクト初期設定',
        description: 'package.jsonの作成と依存関係のインストール',
        priority: 'high',
        category: 'setup',
        tags: ['setup', 'initial'],
        dueDate: null
      });
      
      // 作成したTODOを完了状態に変更
      await todoStorage.updateTodo(completedTodo.id, { completed: true });
      
      console.log('✅ Sample todos initialized successfully');
    } else {
      console.log(`📝 Database already contains ${existingTodos.length} todos`);
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

    // Gemini AI実行結果データの初期化処理
    // 既存のGemini実行結果データを確認
    const existingGeminiResults = await geminiStorage.getGeminiResults();
    
    if (existingGeminiResults.length === 0) {
      // データが空の場合のみサンプルGemini実行結果を追加
      
      // 成功した実行結果のサンプル（AI技術説明）
      await geminiStorage.addGeminiResult({
        prompt: 'Explain how AI works in a few words',
        response: 'AI mimics human intelligence by using algorithms and data to learn patterns, make predictions, and solve problems autonomously.',
        model: 'gemini-2.0-flash',
        status: 'success',
        executionTime: 1500,  // 実行時間（ミリ秒）
        tokensUsed: 25,       // 使用トークン数
        category: 'technology',
        tags: ['ai', 'explanation', 'sample'],
        scheduledBy: 'sample-data',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2日前に作成
      });

      // 成功した実行結果のサンプル（プログラミングヒント）
      await geminiStorage.addGeminiResult({
        prompt: 'Share a useful programming tip',
        response: 'Always write meaningful variable names and comments. Code is read more often than it\'s written, so clarity saves time and reduces bugs.',
        model: 'gemini-2.0-flash',
        status: 'success',
        executionTime: 1200,
        tokensUsed: 32,
        category: 'programming',
        tags: ['coding', 'tips', 'best-practices'],
        scheduledBy: 'sample-data',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1日前に作成
      });

      // エラーとなった実行結果のサンプル（API設定不備）
      await geminiStorage.addGeminiResult({
        prompt: 'Test prompt for error simulation',
        response: null,  // エラー時はレスポンス無し
        model: 'gemini-2.0-flash',
        status: 'error',
        errorMessage: 'API key not configured (sample error)',
        executionTime: 500,
        tokensUsed: null,  // エラー時はトークン使用量無し
        category: 'test',
        tags: ['error', 'sample'],
        scheduledBy: 'sample-data',
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() // 12時間前に作成
      });

      console.log('✅ Sample Gemini results initialized successfully');
    } else {
      console.log(`🤖 Database already contains ${existingGeminiResults.length} Gemini results`);
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
