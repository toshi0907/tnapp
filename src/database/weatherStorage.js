/**
 * 天気データストレージクラス
 * JSONファイルを使用して天気データの永続化を行う
 * 複数のAPIソースからの天気データを管理
 */

// ファイルシステム操作とパス操作のモジュールをインポート
const fs = require('fs').promises;  // ファイルシステム操作（Promise版）
const path = require('path');       // パス操作ユーティリティ

/**
 * 天気データの管理を行うクラス
 * シングルトンパターンで実装され、JSONファイルによる永続化を提供
 */
class WeatherStorage {
  /**
   * コンストラクタ
   * @param {string} filename - データファイル名（デフォルト: 'weather.json'）
   */
  constructor(filename = 'weather.json') {
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
   * データファイルから天気データを読み込む
   * @returns {Array} 天気データの配列
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
      console.error('Error reading weather data file:', error);
      // エラー時は空配列を返す（フォールバック処理）
      return [];
    }
  }

  /**
   * 天気データをファイルに書き込む
   * @param {Array} data - 書き込む天気データの配列
   */
  async writeData(data) {
    try {
      // データファイルの存在確認・初期化
      await this.ensureDataFile();
      // データをJSON形式で整形してファイルに書き込み
      await fs.writeFile(this.filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      // ファイル書き込みに失敗した場合
      console.error('Error writing weather data file:', error);
      throw error;
    }
  }

  /**
   * 全ての天気データを取得
   * @param {Object} filters - フィルタオプション
   * @param {string|number} [filters.locationId] - 位置情報ID
   * @param {string} [filters.apiSource] - APIソース (weatherapi, yahoo)
   * @param {number} [filters.limit] - 取得件数制限
   * @returns {Array} 天気データの配列
   */
  async getWeatherData(filters = {}) {
    let weatherData = await this.readData();
    
    // 位置情報IDでフィルタ
    if (filters.locationId) {
      weatherData = weatherData.filter(data => data.locationId == filters.locationId);
    }
    
    // APIソースでフィルタ
    if (filters.apiSource) {
      weatherData = weatherData.filter(data => data.apiSource === filters.apiSource);
    }
    
    // 取得日時で降順ソート（新しい順）
    weatherData.sort((a, b) => new Date(b.fetchedAt) - new Date(a.fetchedAt));
    
    // 件数制限
    if (filters.limit && filters.limit > 0) {
      weatherData = weatherData.slice(0, filters.limit);
    }
    
    return weatherData;
  }

  /**
   * IDで天気データを取得
   * @param {string|number} id - 天気データID
   * @returns {Object|null} 天気データオブジェクト、見つからない場合はnull
   */
  async getWeatherById(id) {
    const weatherData = await this.readData();
    return weatherData.find(data => data.id == id) || null;
  }

  /**
   * 位置情報の最新天気データを取得
   * @param {string|number} locationId - 位置情報ID
   * @param {string} [apiSource] - APIソース（省略時は全ソース）
   * @returns {Array} 最新の天気データ配列
   */
  async getLatestWeatherForLocation(locationId, apiSource = null) {
    const filters = { locationId };
    if (apiSource) {
      filters.apiSource = apiSource;
    }
    
    const weatherData = await this.getWeatherData(filters);
    
    if (!apiSource) {
      // 全APIソースの最新データを1つずつ取得
      const sources = ['weatherapi', 'yahoo'];
      const latestData = [];
      
      for (const source of sources) {
        const sourceData = weatherData.filter(data => data.apiSource === source);
        if (sourceData.length > 0) {
          latestData.push(sourceData[0]);  // 最新データ（ソート済み）
        }
      }
      
      return latestData;
    } else {
      // 指定APIソースの最新データを取得
      return weatherData.length > 0 ? [weatherData[0]] : [];
    }
  }

  /**
   * 新しい天気データを追加
   * @param {Object} weatherData - 追加する天気データ
   * @param {string|number} weatherData.locationId - 位置情報ID
   * @param {string} weatherData.apiSource - APIソース (weatherapi, yahoo)
   * @param {Object} weatherData.data - APIレスポンスデータ
   * @param {string} [weatherData.error] - エラーメッセージ（取得失敗時）
   * @returns {Object} 作成された天気データオブジェクト
   */
  async addWeatherData(weatherData) {
    const { locationId, apiSource, data, error } = weatherData;
    
    // 入力データの検証
    if (!locationId) {
      throw new Error('Location ID is required');
    }
    
    if (!apiSource || !['weatherapi', 'yahoo'].includes(apiSource)) {
      throw new Error('API source must be one of: weatherapi, yahoo');
    }
    
    if (!data && !error) {
      throw new Error('Either data or error must be provided');
    }

    const allWeatherData = await this.readData();
    
    // 新しい天気データオブジェクトを作成
    const newWeatherData = {
      id: Date.now(),  // タイムスタンプをIDとして使用
      locationId: parseInt(locationId),
      apiSource,
      data: data || null,
      error: error || null,
      fetchedAt: new Date().toISOString(),
      success: !!data  // データがある場合は成功、エラーがある場合は失敗
    };

    // 天気データ配列に追加
    allWeatherData.push(newWeatherData);
    
    // データファイルに保存
    await this.writeData(allWeatherData);
    
    return newWeatherData;
  }

  /**
   * 古い天気データを削除（データ量管理）
   * @param {number} daysToKeep - 保持日数（デフォルト: 30日）
   * @returns {number} 削除されたレコード数
   */
  async cleanupOldData(daysToKeep = 30) {
    const allWeatherData = await this.readData();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const initialCount = allWeatherData.length;
    const remainingData = allWeatherData.filter(
      data => new Date(data.fetchedAt) > cutoffDate
    );
    
    if (remainingData.length < initialCount) {
      await this.writeData(remainingData);
      console.log(`🗑️ Cleaned up ${initialCount - remainingData.length} old weather records`);
    }
    
    return initialCount - remainingData.length;
  }

  /**
   * 天気データの統計情報を取得
   * @returns {Object} 統計情報オブジェクト
   */
  async getStatistics() {
    const allWeatherData = await this.readData();
    
    const stats = {
      totalRecords: allWeatherData.length,
      successfulRecords: allWeatherData.filter(data => data.success).length,
      failedRecords: allWeatherData.filter(data => !data.success).length,
      apiSources: {},
      locations: {},
      lastFetchedAt: null
    };
    
    // APIソース別統計
    ['weatherapi', 'yahoo'].forEach(source => {
      const sourceData = allWeatherData.filter(data => data.apiSource === source);
      stats.apiSources[source] = {
        total: sourceData.length,
        successful: sourceData.filter(data => data.success).length,
        failed: sourceData.filter(data => !data.success).length
      };
    });
    
    // 位置情報別統計
    const locationIds = [...new Set(allWeatherData.map(data => data.locationId))];
    locationIds.forEach(locationId => {
      const locationData = allWeatherData.filter(data => data.locationId === locationId);
      stats.locations[locationId] = {
        total: locationData.length,
        successful: locationData.filter(data => data.success).length,
        failed: locationData.filter(data => !data.success).length
      };
    });
    
    // 最後の取得日時
    if (allWeatherData.length > 0) {
      const sortedData = allWeatherData.sort((a, b) => new Date(b.fetchedAt) - new Date(a.fetchedAt));
      stats.lastFetchedAt = sortedData[0].fetchedAt;
    }
    
    return stats;
  }

  /**
   * 特定の位置・APIソースの天気データを削除
   * @param {string|number} locationId - 位置情報ID
   * @param {string} [apiSource] - APIソース（省略時は全ソース）
   * @returns {number} 削除されたレコード数
   */
  async deleteWeatherData(locationId, apiSource = null) {
    const allWeatherData = await this.readData();
    const initialCount = allWeatherData.length;
    
    const remainingData = allWeatherData.filter(data => {
      if (data.locationId != locationId) return true;
      if (apiSource && data.apiSource !== apiSource) return true;
      return false;
    });
    
    if (remainingData.length < initialCount) {
      await this.writeData(remainingData);
    }
    
    return initialCount - remainingData.length;
  }
}

// アプリケーション全体で同一のインスタンスを共有
module.exports = new WeatherStorage();