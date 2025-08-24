const bookmarkStorage = require('./database/bookmarkStorage');
const todoStorage = require('./database/todoStorage');
const reminderStorage = require('./database/reminderStorage');
const geminiStorage = require('./database/geminiStorage');

async function initializeData() {
  try {
    console.log('🔄 Initializing sample data...');
    
    // ブックマークデータの初期化
    const existingBookmarks = await bookmarkStorage.getBookmarks();
    
    if (existingBookmarks.length === 0) {
      // サンプルブックマークを追加
      await bookmarkStorage.addBookmark({
        title: 'GitHub',
        url: 'https://github.com',
        description: 'The world\'s leading software development platform',
        tags: ['development', 'git', 'coding'],
        category: 'development'
      });
      
      await bookmarkStorage.addBookmark({
        title: 'Node.js',
        url: 'https://nodejs.org',
        description: 'Node.js JavaScript runtime',
        tags: ['javascript', 'nodejs', 'backend'],
        category: 'development'
      });
      
      await bookmarkStorage.addBookmark({
        title: 'MDN Web Docs',
        url: 'https://developer.mozilla.org',
        description: 'Resources for developers, by developers',
        tags: ['documentation', 'web', 'reference'],
        category: 'reference'
      });
      
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

    // TODOデータの初期化
    const existingTodos = await todoStorage.getTodos();
    
    if (existingTodos.length === 0) {
      // サンプルTODOを追加
      await todoStorage.addTodo({
        title: 'APIサーバーの開発を完了する',
        description: 'Node.js Express.jsを使用したRESTful APIサーバーの開発',
        priority: 'high',
        category: 'development',
        tags: ['api', 'nodejs', 'express'],
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 1週間後
      });
      
      await todoStorage.addTodo({
        title: 'ドキュメント作成',
        description: 'READMEファイルとAPI仕様書の作成',
        priority: 'medium',
        category: 'documentation',
        tags: ['docs', 'readme'],
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3日後
      });
      
      await todoStorage.addTodo({
        title: 'ユニットテストの作成',
        description: 'APIエンドポイントのユニットテストを作成する',
        priority: 'medium',
        category: 'testing',
        tags: ['test', 'unit-test'],
        dueDate: null
      });
      
      await todoStorage.addTodo({
        title: 'コードレビュー',
        description: 'チームメンバーによるコードレビューを実施',
        priority: 'low',
        category: 'review',
        tags: ['review', 'quality'],
        dueDate: null
      });
      
      // 完了済みのTODOも追加
      const completedTodo = await todoStorage.addTodo({
        title: 'プロジェクト初期設定',
        description: 'package.jsonの作成と依存関係のインストール',
        priority: 'high',
        category: 'setup',
        tags: ['setup', 'initial'],
        dueDate: null
      });
      
      // 完了状態に変更
      await todoStorage.updateTodo(completedTodo.id, { completed: true });
      
      console.log('✅ Sample todos initialized successfully');
    } else {
      console.log(`📝 Database already contains ${existingTodos.length} todos`);
    }

    // リマインダーデータの初期化
    const existingReminders = await reminderStorage.getReminders();
    
    if (existingReminders.length === 0) {
      // サンプルリマインダーを追加
      const now = new Date();
      const futureDateTime1 = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1日後
      const futureDateTime2 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 1週間後
      const futureDateTime3 = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2時間後

      await reminderStorage.addReminder({
        title: '会議の準備',
        message: '明日のプロジェクト会議の資料を確認してください。議題とプレゼンテーションを準備しましょう。',
        notificationDateTime: futureDateTime1.toISOString(),
        notificationMethod: 'webhook',
        category: 'work',
        tags: ['meeting', 'important', 'preparation']
      });

      await reminderStorage.addReminder({
        title: '健康診断の予約',
        message: '年次健康診断の予約を忘れずに取ってください。',
        notificationDateTime: futureDateTime2.toISOString(),
        notificationMethod: 'email',
        category: 'health',
        tags: ['health', 'annual', 'appointment']
      });

      await reminderStorage.addReminder({
        title: 'API サーバーのデプロイ',
        message: '新機能をプロダクション環境にデプロイする時間です。',
        notificationDateTime: futureDateTime3.toISOString(),
        notificationMethod: 'webhook',
        category: 'development',
        tags: ['deployment', 'production', 'urgent'],
        repeatSettings: {
          interval: 'weekly',
          maxOccurrences: 5,
          currentOccurrence: 1
        }
      });

      console.log('✅ Sample reminders initialized successfully');
    } else {
      console.log(`🔔 Database already contains ${existingReminders.length} reminders`);
    }

    // Geminiデータの初期化
    const existingGeminiResults = await geminiStorage.getGeminiResults();
    
    if (existingGeminiResults.length === 0) {
      // サンプルGemini結果を追加（成功例）
      await geminiStorage.addGeminiResult({
        prompt: 'Explain how AI works in a few words',
        response: 'AI mimics human intelligence by using algorithms and data to learn patterns, make predictions, and solve problems autonomously.',
        model: 'gemini-2.0-flash',
        status: 'success',
        executionTime: 1500,
        tokensUsed: 25,
        category: 'technology',
        tags: ['ai', 'explanation', 'sample'],
        scheduledBy: 'sample-data',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2日前
      });

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
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1日前
      });

      // サンプルGemini結果を追加（エラー例）
      await geminiStorage.addGeminiResult({
        prompt: 'Test prompt for error simulation',
        response: null,
        model: 'gemini-2.0-flash',
        status: 'error',
        errorMessage: 'API key not configured (sample error)',
        executionTime: 500,
        tokensUsed: null,
        category: 'test',
        tags: ['error', 'sample'],
        scheduledBy: 'sample-data',
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() // 12時間前
      });

      console.log('✅ Sample Gemini results initialized successfully');
    } else {
      console.log(`🤖 Database already contains ${existingGeminiResults.length} Gemini results`);
    }
  } catch (error) {
    console.error('❌ Error initializing data:', error);
  }
}

// このファイルが直接実行された場合のみ初期化を実行
if (require.main === module) {
  initializeData();
}

module.exports = { initializeData };
