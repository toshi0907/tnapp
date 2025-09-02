/**
 * 天気取得用の位置情報データストレージクラス
 * JSONファイルを使用して位置情報データの永続化を行う
 */

// ファイルシステム操作とパス操作のモジュールをインポート
const fs = require('fs').promises;  // ファイルシステム操作（Promise版）
const path = require('path');       // パス操作ユーティリティ

/**
 * 位置情報データの管理を行うクラス
 * シングルトンパターンで実装され、JSONファイルによる永続化を提供
 */
class LocationStorage {
  /**
   * コンストラクタ
   * @param {string} filename - データファイル名（デフォルト: 'locations.json'）
   */
  constructor(filename = 'locations.json') {
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
   * データファイルから位置情報データを読み込む
   * @returns {Array} 位置情報データの配列
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
      console.error('Error reading location data file:', error);
      // エラー時は空配列を返す（フォールバック処理）
      return [];
    }
  }

  /**
   * 位置情報データをファイルに書き込む
   * @param {Array} data - 書き込む位置情報データの配列
   */
  async writeData(data) {
    try {
      // データファイルの存在確認・初期化
      await this.ensureDataFile();
      // データをJSON形式で整形してファイルに書き込み
      await fs.writeFile(this.filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      // ファイル書き込みに失敗した場合
      console.error('Error writing location data file:', error);
      throw error;
    }
  }

  /**
   * 全ての位置情報を取得
   * @returns {Array} 位置情報の配列
   */
  async getLocations() {
    return await this.readData();
  }

  /**
   * IDで位置情報を取得
   * @param {string|number} id - 位置情報ID
   * @returns {Object|null} 位置情報オブジェクト、見つからない場合はnull
   */
  async getLocationById(id) {
    const locations = await this.readData();
    return locations.find(location => location.id == id) || null;
  }

  /**
   * 新しい位置情報を追加
   * @param {Object} locationData - 追加する位置情報データ
   * @param {number} locationData.latitude - 緯度
   * @param {number} locationData.longitude - 経度
   * @param {string} [locationData.name] - 位置名
   * @param {string} [locationData.description] - 説明
   * @returns {Object} 作成された位置情報オブジェクト
   */
  async addLocation(locationData) {
    const { latitude, longitude, name, description } = locationData;
    
    // 入力データの検証
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      throw new Error('Latitude and longitude must be numbers');
    }
    
    if (latitude < -90 || latitude > 90) {
      throw new Error('Latitude must be between -90 and 90');
    }
    
    if (longitude < -180 || longitude > 180) {
      throw new Error('Longitude must be between -180 and 180');
    }

    const locations = await this.readData();
    
    // 同じ座標の位置情報が既に存在するかチェック
    const existingLocation = locations.find(
      location => Math.abs(location.latitude - latitude) < 0.001 && 
                  Math.abs(location.longitude - longitude) < 0.001
    );
    
    if (existingLocation) {
      throw new Error('Location with similar coordinates already exists');
    }

    // 新しい位置情報オブジェクトを作成
    const newLocation = {
      id: Date.now(),  // タイムスタンプをIDとして使用
      latitude,
      longitude,
      name: name || `Location ${latitude}, ${longitude}`,
      description: description || '',
      active: true,  // 天気データ取得対象かどうか
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 位置情報配列に追加
    locations.push(newLocation);
    
    // データファイルに保存
    await this.writeData(locations);
    
    return newLocation;
  }

  /**
   * 位置情報を更新
   * @param {string|number} id - 更新する位置情報のID
   * @param {Object} updateData - 更新データ
   * @returns {Object} 更新された位置情報オブジェクト
   */
  async updateLocation(id, updateData) {
    const locations = await this.readData();
    const locationIndex = locations.findIndex(location => location.id == id);
    
    if (locationIndex === -1) {
      throw new Error('Location not found');
    }

    // 座標が更新される場合のバリデーション
    if (updateData.latitude !== undefined) {
      if (typeof updateData.latitude !== 'number' || 
          updateData.latitude < -90 || updateData.latitude > 90) {
        throw new Error('Latitude must be a number between -90 and 90');
      }
    }
    
    if (updateData.longitude !== undefined) {
      if (typeof updateData.longitude !== 'number' || 
          updateData.longitude < -180 || updateData.longitude > 180) {
        throw new Error('Longitude must be a number between -180 and 180');
      }
    }

    // 位置情報を更新（undefinedの値は既存値を保持）
    const updatedLocation = {
      ...locations[locationIndex],
      ...Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined)
      ),
      updatedAt: new Date().toISOString()
    };
    
    locations[locationIndex] = updatedLocation;
    
    // データファイルに保存
    await this.writeData(locations);
    
    return updatedLocation;
  }

  /**
   * 位置情報を削除
   * @param {string|number} id - 削除する位置情報のID
   * @returns {boolean} 削除成功時はtrue
   */
  async deleteLocation(id) {
    const locations = await this.readData();
    const locationIndex = locations.findIndex(location => location.id == id);
    
    if (locationIndex === -1) {
      throw new Error('Location not found');
    }
    
    // 配列から要素を削除
    locations.splice(locationIndex, 1);
    
    // データファイルに保存
    await this.writeData(locations);
    
    return true;
  }

  /**
   * アクティブな位置情報のみを取得
   * @returns {Array} アクティブな位置情報の配列
   */
  async getActiveLocations() {
    const locations = await this.readData();
    return locations.filter(location => location.active);
  }

  /**
   * 位置情報の総数を取得
   * @returns {number} 位置情報の総数
   */
  async getLocationCount() {
    const locations = await this.readData();
    return locations.length;
  }

  /**
   * アクティブな位置情報の数を取得
   * @returns {number} アクティブな位置情報の数
   */
  async getActiveLocationCount() {
    const locations = await this.getActiveLocations();
    return locations.length;
  }
}

// アプリケーション全体で同一のインスタンスを共有
module.exports = new LocationStorage();