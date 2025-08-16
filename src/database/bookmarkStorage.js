const fs = require('fs').promises;
const path = require('path');

class BookmarkStorage {
  constructor(filename = 'bookmarks.json') {
    this.dataDir = path.join(__dirname, '../../data');
    this.filePath = path.join(this.dataDir, filename);
  }

  async ensureDataFile() {
    try {
      await fs.access(this.filePath);
    } catch {
      // データディレクトリが存在しない場合は作成
      await fs.mkdir(this.dataDir, { recursive: true });
      // 初期データファイルを作成
      await fs.writeFile(this.filePath, JSON.stringify([], null, 2));
    }
  }

  async readData() {
    await this.ensureDataFile();
    try {
      const data = await fs.readFile(this.filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading bookmark data file:', error);
      return [];
    }
  }

  async writeData(data) {
    try {
      await this.ensureDataFile();
      await fs.writeFile(this.filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error writing bookmark data file:', error);
      throw error;
    }
  }

  async getBookmarks() {
    return await this.readData();
  }

  async getBookmarkById(id) {
    const bookmarks = await this.readData();
    return bookmarks.find(bookmark => bookmark.id === parseInt(id));
  }

  async addBookmark(bookmarkData) {
    const bookmarks = await this.readData();
    
    // URLの重複チェック
    const existingBookmark = bookmarks.find(bookmark => bookmark.url === bookmarkData.url);
    if (existingBookmark) {
      throw new Error('URL already exists');
    }

    const newBookmark = {
      id: Date.now(),
      title: bookmarkData.title,
      url: bookmarkData.url,
      description: bookmarkData.description || '',
      tags: bookmarkData.tags || [],
      category: bookmarkData.category || 'general',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    bookmarks.push(newBookmark);
    await this.writeData(bookmarks);
    return newBookmark;
  }

  async updateBookmark(id, bookmarkData) {
    const bookmarks = await this.readData();
    const index = bookmarks.findIndex(bookmark => bookmark.id === parseInt(id));
    
    if (index === -1) {
      return null;
    }

    // URLの重複チェック（自分以外）
    if (bookmarkData.url) {
      const existingBookmark = bookmarks.find(bookmark => 
        bookmark.url === bookmarkData.url && bookmark.id !== parseInt(id)
      );
      if (existingBookmark) {
        throw new Error('URL already exists');
      }
    }

    // undefinedのプロパティを除外してマージ
    const filteredBookmarkData = Object.fromEntries(
      Object.entries(bookmarkData).filter(([_, value]) => value !== undefined)
    );

    bookmarks[index] = {
      ...bookmarks[index],
      ...filteredBookmarkData,
      id: parseInt(id), // IDは変更不可
      updatedAt: new Date().toISOString()
    };
    
    await this.writeData(bookmarks);
    return bookmarks[index];
  }

  async deleteBookmark(id) {
    const bookmarks = await this.readData();
    const initialLength = bookmarks.length;
    const filteredBookmarks = bookmarks.filter(bookmark => bookmark.id !== parseInt(id));
    
    if (filteredBookmarks.length === initialLength) {
      return false; // ブックマークが見つからなかった
    }
    
    await this.writeData(filteredBookmarks);
    return true;
  }

  async getBookmarksByCategory(category) {
    const bookmarks = await this.readData();
    return bookmarks.filter(bookmark => bookmark.category === category);
  }

  async getBookmarksByTag(tag) {
    const bookmarks = await this.readData();
    return bookmarks.filter(bookmark => bookmark.tags.includes(tag));
  }

  async searchBookmarks(filters) {
    const bookmarks = await this.readData();
    
    if (typeof filters === 'string') {
      // 文字列の場合は従来の検索処理
      const lowerQuery = filters.toLowerCase();
      return bookmarks.filter(bookmark => 
        bookmark.title.toLowerCase().includes(lowerQuery) ||
        bookmark.description.toLowerCase().includes(lowerQuery) ||
        bookmark.url.toLowerCase().includes(lowerQuery) ||
        bookmark.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    }
    
    // オブジェクトの場合は複合フィルタ処理
    return bookmarks.filter(bookmark => {
      let matches = true;
      
      if (filters.search) {
        const lowerQuery = filters.search.toLowerCase();
        matches = matches && (
          (bookmark.title || '').toLowerCase().includes(lowerQuery) ||
          (bookmark.description || '').toLowerCase().includes(lowerQuery) ||
          (bookmark.url || '').toLowerCase().includes(lowerQuery) ||
          (bookmark.tags || []).some(tag => (tag || '').toLowerCase().includes(lowerQuery))
        );
      }
      
      if (filters.category) {
        matches = matches && bookmark.category === filters.category;
      }
      
      if (filters.tag) {
        matches = matches && bookmark.tags.includes(filters.tag);
      }
      
      return matches;
    });
  }

  async getBookmarkCount() {
    const bookmarks = await this.readData();
    return bookmarks.length;
  }

  async getCategories() {
    const bookmarks = await this.readData();
    const categories = [...new Set(bookmarks.map(bookmark => bookmark.category))];
    return categories.sort();
  }

  async getTags() {
    const bookmarks = await this.readData();
    const allTags = bookmarks.flatMap(bookmark => bookmark.tags);
    const uniqueTags = [...new Set(allTags)];
    return uniqueTags.sort();
  }
}

module.exports = new BookmarkStorage();
