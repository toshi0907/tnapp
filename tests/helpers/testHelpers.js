/**
 * テスト用のヘルパー関数とユーティリティ
 */

const path = require('path');
const fs = require('fs').promises;

/**
 * テスト用のデータディレクトリを作成
 */
async function createTestDataDir() {
  const testDataDir = path.join(__dirname, 'test-data');
  try {
    await fs.mkdir(testDataDir, { recursive: true });
  } catch (error) {
    // ディレクトリが既に存在する場合は無視
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
  return testDataDir;
}

/**
 * テスト用のブックマークデータを作成
 */
function createTestBookmark(overrides = {}) {
  return {
    id: Date.now(),
    title: 'テストブックマーク',
    url: 'https://example.com',
    description: 'テスト用のブックマーク',
    tags: ['test'],
    category: 'development',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  };
}

/**
 * 複数のテスト用ブックマークを作成
 */
function createTestBookmarks(count = 3) {
  return Array.from({ length: count }, (_, index) => 
    createTestBookmark({
      id: Date.now() + index,
      title: `テストブックマーク${index + 1}`,
      url: `https://example${index + 1}.com`,
      category: index % 2 === 0 ? 'development' : 'reference',
      tags: [`tag${index + 1}`, 'test']
    })
  );
}

/**
 * テストファイルをクリーンアップ
 */
async function cleanupTestFiles() {
  const testDataDir = path.join(__dirname, 'test-data');
  try {
    const files = await fs.readdir(testDataDir);
    await Promise.all(
      files.map(file => fs.unlink(path.join(testDataDir, file)))
    );
    await fs.rmdir(testDataDir);
  } catch (error) {
    // ディレクトリやファイルが存在しない場合は無視
    if (error.code !== 'ENOENT') {
      console.warn('テストファイルのクリーンアップ中にエラー:', error.message);
    }
  }
}

/**
 * API レスポンスの共通検証
 */
function validateBookmarkResponse(bookmark) {
  expect(bookmark).toHaveProperty('id');
  expect(bookmark).toHaveProperty('title');
  expect(bookmark).toHaveProperty('url');
  expect(bookmark).toHaveProperty('createdAt');
  expect(bookmark).toHaveProperty('updatedAt');
  
  // URL の形式チェック
  expect(() => new URL(bookmark.url)).not.toThrow();
  
  // 日付の形式チェック
  expect(new Date(bookmark.createdAt)).toBeInstanceOf(Date);
  expect(new Date(bookmark.updatedAt)).toBeInstanceOf(Date);
}

/**
 * エラーレスポンスの共通検証
 */
function validateErrorResponse(response, expectedStatus, expectedError) {
  expect(response.status).toBe(expectedStatus);
  expect(response.body).toHaveProperty('error');
  if (expectedError) {
    expect(response.body.error).toContain(expectedError);
  }
}

module.exports = {
  createTestDataDir,
  createTestBookmark,
  createTestBookmarks,
  cleanupTestFiles,
  validateBookmarkResponse,
  validateErrorResponse
};
