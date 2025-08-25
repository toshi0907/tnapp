/**
 * TODOデータストレージクラス
 * JSONファイルを使用してTODOタスクデータの永続化を行う
 * タスク管理、優先度管理、期限管理、統計機能を提供
 */

// ファイルシステム操作とパス操作のモジュールをインポート
const fs = require('fs').promises;  // ファイルシステム操作（Promise版）
const path = require('path');       // パス操作ユーティリティ

/**
 * TODOタスクデータの管理を行うクラス
 * シングルトンパターンで実装され、JSONファイルによる永続化を提供
 */
class TodoStorage {
  /**
   * コンストラクタ
   * @param {string} filename - データファイル名（デフォルト: 'todos.json'）
   */
  constructor(filename = 'todos.json') {
    // データディレクトリのパスを設定（プロジェクトルート/data）
    this.dataDir = path.join(__dirname, '../../data');
    // データファイルの完全パスを設定
    this.filePath = path.join(this.dataDir, filename);
  }

  /**
   * データファイルの存在確認と初期化
   * ファイルが存在しない場合は空配列のJSONファイルを作成
   */
  async ensureDataFile() {
    try {
      // ファイルの存在確認（アクセス可能かチェック）
      await fs.access(this.filePath);
    } catch {
      // ファイルが存在しない場合の初期化処理
      
      // データディレクトリが存在しない場合は再帰的に作成
      await fs.mkdir(this.dataDir, { recursive: true });
      
      // 空配列の初期データファイルを作成（整形されたJSON形式）
      await fs.writeFile(this.filePath, JSON.stringify([], null, 2));
    }
  }

  /**
   * データファイルからTODOデータを読み込む
   * @returns {Array} TODOデータの配列
   */
  async readData() {
    // データファイルの存在確認・初期化
    await this.ensureDataFile();
    
    try {
      // ファイルからテキストデータを読み込み
      const data = await fs.readFile(this.filePath, 'utf-8');
      // JSONテキストをJavaScriptオブジェクトに変換して返す
      return JSON.parse(data);
    } catch (error) {
      // ファイル読み込みまたはJSON解析に失敗した場合
      console.error('Error reading todo data file:', error);
      // エラー時は空配列を返す（フォールバック処理）
      return [];
    }
  }

  /**
   * TODOデータをファイルに書き込む
   * @param {Array} data - 書き込むTODOデータの配列
   */
  async writeData(data) {
    try {
      // データファイルの存在確認・初期化
      await this.ensureDataFile();
      // データをJSON形式で整形してファイルに書き込み
      await fs.writeFile(this.filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      // ファイル書き込みに失敗した場合
      console.error('Error writing todo data file:', error);
      // エラーを上位に再投げ（呼び出し元でエラーハンドリング）
      throw error;
    }
  }

  /**
   * 全TODOデータを取得
   * @returns {Array} 全TODOの配列
   */
  async getTodos() {
    // データファイルから全データを読み込んで返す
    return await this.readData();
  }

  /**
   * 指定IDのTODOを取得
   * @param {string|number} id - TODO ID
   * @returns {Object|undefined} 見つかったTODOオブジェクト、または undefined
   */
  async getTodoById(id) {
    // 全TODOデータを取得
    const todos = await this.readData();
    // 指定IDに一致するTODOを検索して返す
    return todos.find(todo => todo.id === parseInt(id));
  }

  /**
   * 新しいTODOを追加
   * @param {Object} todoData - 追加するTODOデータ
   * @returns {Object} 作成されたTODOオブジェクト
   */
  async addTodo(todoData) {
    // 既存のTODOデータを取得
    const todos = await this.readData();

    // 新しいTODOオブジェクトを作成
    const newTodo = {
      id: Date.now(),  // 現在時刻をユニークIDとして使用
      title: todoData.title,
      description: todoData.description || '',  // 説明が空の場合は空文字
      completed: false,  // 初期状態は未完了
      priority: todoData.priority || 'medium',  // 優先度（low, medium, high）、デフォルトはmedium
      category: todoData.category || 'general',  // カテゴリ、デフォルトはgeneral
      dueDate: todoData.dueDate || null,  // 期限日、指定されない場合はnull
      tags: todoData.tags || [],  // タグ配列、未指定の場合は空配列
      createdAt: new Date().toISOString(),  // 作成日時（ISO形式）
      updatedAt: new Date().toISOString(),  // 更新日時（ISO形式）
      completedAt: null  // 完了日時、初期状態ではnull
    };
    
    // 既存配列に新しいTODOを追加
    todos.push(newTodo);
    // 更新されたデータをファイルに保存
    await this.writeData(todos);
    // 作成されたTODOを返す
    return newTodo;
  }

  /**
   * 指定IDのTODOを更新
   * @param {string|number} id - 更新対象のTODO ID
   * @param {Object} todoData - 更新するデータ
   * @returns {Object|null} 更新されたTODOオブジェクト、見つからない場合はnull
   */
  async updateTodo(id, todoData) {
    // 既存のTODOデータを取得
    const todos = await this.readData();
    // 更新対象のTODOのインデックスを検索
    const index = todos.findIndex(todo => todo.id === parseInt(id));
    
    if (index === -1) {
      // 対象TODOが見つからない場合はnullを返す
      return null;
    }

    // 完了状態が変更された場合の完了日時タイムスタンプ管理
    const currentTodo = todos[index];
    let completedAt = currentTodo.completedAt;
    
    // 完了状態の変更をチェック
    if (todoData.hasOwnProperty('completed')) {
      if (todoData.completed && !currentTodo.completed) {
        // 未完了から完了に変更された場合、現在時刻を完了日時に設定
        completedAt = new Date().toISOString();
      } else if (!todoData.completed && currentTodo.completed) {
        // 完了から未完了に変更された場合、完了日時をクリア
        completedAt = null;
      }
    }

    // 既存データと更新データをマージして更新
    todos[index] = {
      ...todos[index],  // 既存データをベースに
      ...todoData,      // 更新データを上書き
      id: parseInt(id), // IDは変更不可（強制的に元のIDを維持）
      updatedAt: new Date().toISOString(),  // 更新日時を現在時刻に設定
      completedAt: completedAt  // 計算された完了日時を設定
    };
    
    // 更新されたデータをファイルに保存
    await this.writeData(todos);
    // 更新されたTODOを返す
    return todos[index];
  }

  /**
   * 指定IDのTODOを削除
   * @param {string|number} id - 削除対象のTODO ID
   * @returns {boolean} 削除成功時はtrue、見つからない場合はfalse
   */
  async deleteTodo(id) {
    // 既存のTODOデータを取得
    const todos = await this.readData();
    // 削除前の配列長を記録
    const initialLength = todos.length;
    // 指定ID以外のTODOでフィルタリング（削除処理）
    const filteredTodos = todos.filter(todo => todo.id !== parseInt(id));
    
    if (filteredTodos.length === initialLength) {
      // 配列長が変わらない場合は対象TODOが見つからなかった
      return false;
    }
    
    // 削除後のデータをファイルに保存
    await this.writeData(filteredTodos);
    // 削除成功
    return true;
  }

  /**
   * 完了状態でTODOをフィルタリング
   * @param {boolean} completed - true: 完了済み、false: 未完了
   * @returns {Array} 指定完了状態のTODO配列
   */
  async getTodosByStatus(completed) {
    // 全TODOデータを取得
    const todos = await this.readData();
    // 指定された完了状態のTODOでフィルタリング
    return todos.filter(todo => todo.completed === completed);
  }

  /**
   * 指定優先度のTODOを取得
   * @param {string} priority - 優先度（'low', 'medium', 'high'）
   * @returns {Array} 該当優先度のTODO配列
   */
  async getTodosByPriority(priority) {
    // 全TODOデータを取得
    const todos = await this.readData();
    // 指定優先度に一致するTODOでフィルタリング
    return todos.filter(todo => todo.priority === priority);
  }

  /**
   * 指定カテゴリのTODOを取得
   * @param {string} category - カテゴリ名
   * @returns {Array} 該当カテゴリのTODO配列
   */
  async getTodosByCategory(category) {
    // 全TODOデータを取得
    const todos = await this.readData();
    // 指定カテゴリに一致するTODOでフィルタリング
    return todos.filter(todo => todo.category === category);
  }

  /**
   * 指定タグを含むTODOを取得
   * @param {string} tag - タグ名
   * @returns {Array} 該当タグを含むTODO配列
   */
  async getTodosByTag(tag) {
    // 全TODOデータを取得
    const todos = await this.readData();
    // 指定タグを含むTODOでフィルタリング
    return todos.filter(todo => todo.tags.includes(tag));
  }

  /**
   * TODOをテキスト検索
   * @param {string} query - 検索文字列
   * @returns {Array} 検索条件に一致するTODO配列
   */
  async searchTodos(query) {
    // 全TODOデータを取得
    const todos = await this.readData();
    // 検索文字列を小文字に変換
    const lowerQuery = query.toLowerCase();
    
    // タイトル、説明、タグのいずれかに検索文字列が含まれるTODOを抽出
    return todos.filter(todo => 
      todo.title.toLowerCase().includes(lowerQuery) ||
      todo.description.toLowerCase().includes(lowerQuery) ||
      todo.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * 期限切れ（延滞）TODOを取得
   * @returns {Array} 期限切れの未完了TODO配列
   */
  async getOverdueTodos() {
    // 全TODOデータを取得
    const todos = await this.readData();
    // 現在時刻を取得
    const now = new Date();
    
    // 未完了かつ期限日が設定されており、期限日が現在時刻より過去のTODOを抽出
    return todos.filter(todo => 
      !todo.completed &&           // 未完了
      todo.dueDate &&              // 期限日が設定されている
      new Date(todo.dueDate) < now // 期限日が現在時刻より過去
    );
  }

  /**
   * 期限日が設定されているTODOを期限日順で取得
   * @returns {Array} 期限日でソートされたTODO配列
   */
  async getTodosWithDueDate() {
    // 全TODOデータを取得
    const todos = await this.readData();
    
    // 期限日が設定されているTODOのみを抽出し、期限日の昇順でソート
    return todos.filter(todo => todo.dueDate !== null)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }

  /**
   * TODOの総数を取得
   * @returns {number} TODOの総数
   */
  async getTodoCount() {
    // 全TODOデータを取得して配列長を返す
    const todos = await this.readData();
    return todos.length;
  }

  /**
   * 完了済みTODOの数を取得
   * @returns {number} 完了済みTODOの数
   */
  async getCompletedCount() {
    // 全TODOデータを取得
    const todos = await this.readData();
    // 完了済みのTODOをフィルタリングして配列長を返す
    return todos.filter(todo => todo.completed).length;
  }

  /**
   * 未完了TODOの数を取得
   * @returns {number} 未完了TODOの数
   */
  async getPendingCount() {
    // 全TODOデータを取得
    const todos = await this.readData();
    // 未完了のTODOをフィルタリングして配列長を返す
    return todos.filter(todo => !todo.completed).length;
  }

  /**
   * 使用されているカテゴリ一覧を取得
   * @returns {Array} ソート済みのカテゴリ名配列
   */
  async getCategories() {
    // 全TODOデータを取得
    const todos = await this.readData();
    // 全TODOからカテゴリを抽出し、重複を除去
    const categories = [...new Set(todos.map(todo => todo.category))];
    // アルファベット順にソートして返す
    return categories.sort();
  }

  /**
   * 使用されているタグ一覧を取得
   * @returns {Array} ソート済みのタグ名配列
   */
  async getTags() {
    // 全TODOデータを取得
    const todos = await this.readData();
    // 全TODOの全タグを平坦化して配列に
    const allTags = todos.flatMap(todo => todo.tags);
    // 重複を除去してユニークなタグ配列を作成
    const uniqueTags = [...new Set(allTags)];
    // アルファベット順にソートして返す
    return uniqueTags.sort();
  }

  /**
   * TODO統計情報を取得
   * @returns {Object} 詳細な統計情報オブジェクト
   */
  async getStats() {
    // 全TODOデータを取得
    const todos = await this.readData();
    
    // 基本統計の計算
    const total = todos.length;                                        // 総TODO数
    const completed = todos.filter(todo => todo.completed).length;    // 完了TODO数
    const pending = total - completed;                                 // 未完了TODO数
    
    // 期限切れTODO数の計算（未完了かつ期限日が過去）
    const overdue = todos.filter(todo => 
      !todo.completed &&              // 未完了
      todo.dueDate &&                 // 期限日設定あり
      new Date(todo.dueDate) < new Date()  // 期限日が過去
    ).length;

    // 優先度別統計の計算
    const priorityStats = {
      high: todos.filter(todo => todo.priority === 'high').length,     // 高優先度TODO数
      medium: todos.filter(todo => todo.priority === 'medium').length, // 中優先度TODO数
      low: todos.filter(todo => todo.priority === 'low').length        // 低優先度TODO数
    };

    // 統計情報オブジェクトを返す
    return {
      total,                // 総TODO数
      completed,            // 完了TODO数
      pending,              // 未完了TODO数
      overdue,              // 期限切れTODO数
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,  // 完了率（％）
      priorityStats         // 優先度別統計
    };
  }
}

// シングルトンパターンでインスタンスを作成してエクスポート
// アプリケーション全体で同一のインスタンスを共有
module.exports = new TodoStorage();
