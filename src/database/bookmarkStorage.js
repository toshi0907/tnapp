/**
 * ブックマークデータストレージクラス
 * JSONファイルを使用してブックマークデータの永続化を行う
 * CRUD操作、検索、フィルタリング機能を提供
 */

// ファイルシステム操作とパス操作のモジュールをインポート
const fs = require('fs').promises;  // ファイルシステム操作（Promise版）
const path = require('path');       // パス操作ユーティリティ

/**
 * ブックマークデータの管理を行うクラス
 * シングルトンパターンで実装され、JSONファイルによる永続化を提供
 */
class BookmarkStorage {
  /**
   * コンストラクタ
   * @param {string} filename - データファイル名（デフォルト: 'bookmarks.json'）
   */
  constructor(filename = 'bookmarks.json') {
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
   * データファイルからブックマークデータを読み込む
   * @returns {Array} ブックマークデータの配列
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
      console.error('Error reading bookmark data file:', error);
      // エラー時は空配列を返す（フォールバック処理）
      return [];
    }
  }

  /**
   * ブックマークデータをファイルに書き込む
   * @param {Array} data - 書き込むブックマークデータの配列
   */
  async writeData(data) {
    try {
      // データファイルの存在確認・初期化
      await this.ensureDataFile();
      // データをJSON形式で整形してファイルに書き込み
      await fs.writeFile(this.filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      // ファイル書き込みに失敗した場合
      console.error('Error writing bookmark data file:', error);
      // エラーを上位に再投げ（呼び出し元でエラーハンドリング）
      throw error;
    }
  }

  /**
   * 全ブックマークデータを取得
   * @returns {Array} 全ブックマークの配列
   */
  async getBookmarks() {
    // データファイルから全データを読み込んで返す
    return await this.readData();
  }

  /**
   * 指定IDのブックマークを取得
   * @param {string|number} id - ブックマークID
   * @returns {Object|undefined} 見つかったブックマークオブジェクト、または undefined
   */
  async getBookmarkById(id) {
    // 全ブックマークデータを取得
    const bookmarks = await this.readData();
    // 指定IDに一致するブックマークを検索して返す
    return bookmarks.find(bookmark => bookmark.id === parseInt(id));
  }

  /**
   * 新しいブックマークを追加
   * @param {Object} bookmarkData - 追加するブックマークデータ
   * @returns {Object} 作成されたブックマークオブジェクト
   * @throws {Error} URL重複時にエラーを投げる
   */
  async addBookmark(bookmarkData) {
    // 既存のブックマークデータを取得
    const bookmarks = await this.readData();
    
    // URLの重複チェック（同じURLのブックマークが既に存在するかチェック）
    const existingBookmark = bookmarks.find(bookmark => bookmark.url === bookmarkData.url);
    if (existingBookmark) {
      throw new Error('URL already exists');
    }

    // 新しいブックマークオブジェクトを作成
    const newBookmark = {
      id: Date.now(),  // 現在時刻をユニークIDとして使用
      title: bookmarkData.title,
      url: bookmarkData.url,
      description: bookmarkData.description || '',  // 説明が空の場合は空文字
      tags: bookmarkData.tags || [],  // タグが未指定の場合は空配列
      category: bookmarkData.category || 'general',  // カテゴリが未指定の場合は'general'
      createdAt: new Date().toISOString(),  // 作成日時（ISO形式）
      updatedAt: new Date().toISOString()   // 更新日時（ISO形式）
    };
    
    // 既存配列に新しいブックマークを追加
    bookmarks.push(newBookmark);
    // 更新されたデータをファイルに保存
    await this.writeData(bookmarks);
    // 作成されたブックマークを返す
    return newBookmark;
  }

  /**
   * 指定IDのブックマークを更新
   * @param {string|number} id - 更新対象のブックマークID
   * @param {Object} bookmarkData - 更新するデータ
   * @returns {Object|null} 更新されたブックマークオブジェクト、見つからない場合はnull
   * @throws {Error} URL重複時にエラーを投げる
   */
  async updateBookmark(id, bookmarkData) {
    // 既存のブックマークデータを取得
    const bookmarks = await this.readData();
    // 更新対象のブックマークのインデックスを検索
    const index = bookmarks.findIndex(bookmark => bookmark.id === parseInt(id));
    
    if (index === -1) {
      // 対象ブックマークが見つからない場合はnullを返す
      return null;
    }

    // URLの重複チェック（自分以外で同じURLが存在するかチェック）
    if (bookmarkData.url) {
      const existingBookmark = bookmarks.find(bookmark => 
        bookmark.url === bookmarkData.url && bookmark.id !== parseInt(id)
      );
      if (existingBookmark) {
        throw new Error('URL already exists');
      }
    }

    // undefinedのプロパティを除外して更新データを準備
    // これにより部分更新が可能になる（undefinedフィールドは既存値を保持）
    const filteredBookmarkData = Object.fromEntries(
      Object.entries(bookmarkData).filter(([_, value]) => value !== undefined)
    );

    // 既存データと更新データをマージして更新
    bookmarks[index] = {
      ...bookmarks[index],  // 既存データをベースに
      ...filteredBookmarkData,  // 更新データを上書き
      id: parseInt(id),  // IDは変更不可（強制的に元のIDを維持）
      updatedAt: new Date().toISOString()  // 更新日時を現在時刻に設定
    };
    
    // 更新されたデータをファイルに保存
    await this.writeData(bookmarks);
    // 更新されたブックマークを返す
    return bookmarks[index];
  }

  /**
   * 指定IDのブックマークを削除
   * @param {string|number} id - 削除対象のブックマークID
   * @returns {boolean} 削除成功時はtrue、見つからない場合はfalse
   */
  async deleteBookmark(id) {
    // 既存のブックマークデータを取得
    const bookmarks = await this.readData();
    // 削除前の配列長を記録
    const initialLength = bookmarks.length;
    // 指定ID以外のブックマークでフィルタリング（削除処理）
    const filteredBookmarks = bookmarks.filter(bookmark => bookmark.id !== parseInt(id));
    
    if (filteredBookmarks.length === initialLength) {
      // 配列長が変わらない場合は対象ブックマークが見つからなかった
      return false;
    }
    
    // 削除後のデータをファイルに保存
    await this.writeData(filteredBookmarks);
    // 削除成功
    return true;
  }

  /**
   * 指定カテゴリのブックマークを取得
   * @param {string} category - カテゴリ名
   * @returns {Array} 該当カテゴリのブックマーク配列
   */
  async getBookmarksByCategory(category) {
    // 全ブックマークデータを取得
    const bookmarks = await this.readData();
    // 指定カテゴリに一致するブックマークでフィルタリング
    return bookmarks.filter(bookmark => bookmark.category === category);
  }

  /**
   * 指定タグを含むブックマークを取得
   * @param {string} tag - タグ名
   * @returns {Array} 該当タグを含むブックマーク配列
   */
  async getBookmarksByTag(tag) {
    // 全ブックマークデータを取得
    const bookmarks = await this.readData();
    // 指定タグを含むブックマークでフィルタリング
    return bookmarks.filter(bookmark => bookmark.tags.includes(tag));
  }

  /**
   * ブックマークを検索・フィルタリング
   * @param {string|Object} filters - 検索文字列または複合フィルタオブジェクト
   * @returns {Array} 検索条件に一致するブックマーク配列
   */
  async searchBookmarks(filters) {
    // 全ブックマークデータを取得
    const bookmarks = await this.readData();
    
    if (typeof filters === 'string') {
      // 文字列の場合は従来の単純検索処理
      const lowerQuery = filters.toLowerCase();
      return bookmarks.filter(bookmark => 
        // タイトル、説明、URL、タグのいずれかに検索文字列が含まれるかチェック
        bookmark.title.toLowerCase().includes(lowerQuery) ||
        bookmark.description.toLowerCase().includes(lowerQuery) ||
        bookmark.url.toLowerCase().includes(lowerQuery) ||
        bookmark.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    }
    
    // オブジェクトの場合は複合フィルタ処理
    return bookmarks.filter(bookmark => {
      let matches = true;  // 全ての条件がマッチするかのフラグ
      
      // テキスト検索条件のチェック
      if (filters.search) {
        const lowerQuery = filters.search.toLowerCase();
        matches = matches && (
          // タイトル、説明、URL、タグのいずれかに検索文字列が含まれるかチェック
          (bookmark.title || '').toLowerCase().includes(lowerQuery) ||
          (bookmark.description || '').toLowerCase().includes(lowerQuery) ||
          (bookmark.url || '').toLowerCase().includes(lowerQuery) ||
          (bookmark.tags || []).some(tag => (tag || '').toLowerCase().includes(lowerQuery))
        );
      }
      
      // カテゴリフィルタのチェック
      if (filters.category) {
        matches = matches && bookmark.category === filters.category;
      }
      
      // タグフィルタのチェック
      if (filters.tag) {
        matches = matches && bookmark.tags.includes(filters.tag);
      }
      
      // 全ての条件にマッチした場合のみtrue
      return matches;
    });
  }

  /**
   * ブックマークの総数を取得
   * @returns {number} ブックマークの総数
   */
  async getBookmarkCount() {
    // 全ブックマークデータを取得して配列長を返す
    const bookmarks = await this.readData();
    return bookmarks.length;
  }

  /**
   * 使用されているカテゴリ一覧を取得
   * @returns {Array} ソート済みのカテゴリ名配列
   */
  async getCategories() {
    // 全ブックマークデータを取得
    const bookmarks = await this.readData();
    // 全ブックマークからカテゴリを抽出し、重複を除去
    const categories = [...new Set(bookmarks.map(bookmark => bookmark.category))];
    // アルファベット順にソートして返す
    return categories.sort();
  }

  /**
   * 使用されているタグ一覧を取得
   * @returns {Array} ソート済みのタグ名配列
   */
  async getTags() {
    // 全ブックマークデータを取得
    const bookmarks = await this.readData();
    // 全ブックマークの全タグを平坦化して配列に
    const allTags = bookmarks.flatMap(bookmark => bookmark.tags);
    // 重複を除去してユニークなタグ配列を作成
    const uniqueTags = [...new Set(allTags)];
    // アルファベット順にソートして返す
    return uniqueTags.sort();
  }
}

// シングルトンパターンでインスタンスを作成してエクスポート
// アプリケーション全体で同一のインスタンスを共有
module.exports = new BookmarkStorage();
