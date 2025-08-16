const bookmarkStorage = require('./database/bookmarkStorage');
const todoStorage = require('./database/todoStorage');

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
  } catch (error) {
    console.error('❌ Error initializing data:', error);
  }
}

// このファイルが直接実行された場合のみ初期化を実行
if (require.main === module) {
  initializeData();
}

module.exports = { initializeData };
