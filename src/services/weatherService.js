/**
 * 天気データ取得サービス
 * 複数の天気APIからデータを取得し、定期的に更新する機能を提供
 */

const axios = require('axios');
const schedule = require('node-schedule');
const locationStorage = require('../database/locationStorage');
const weatherStorage = require('../database/weatherStorage');

/**
 * 天気データ取得サービスクラス
 */
class WeatherService {
  constructor() {
    // スケジュールされたジョブを管理するMap
    this.scheduledJobs = new Map();
    
    // APIキーを環境変数から取得
    this.weatherApiKey = process.env.WEATHER_API_KEY;
    this.yahooApiKey = process.env.YAHOO_WEATHER_API_KEY;
    
    // API設定
    this.apis = {
      weatherapi: {
        name: 'WeatherAPI',
        baseUrl: 'http://api.weatherapi.com/v1/forecast.json',
        requiresKey: true,
        apiKey: this.weatherApiKey
      },
      yahoo: {
        name: 'Yahoo Weather',
        baseUrl: 'https://map.yahooapis.jp/weather/V1/place',
        requiresKey: true,
        apiKey: this.yahooApiKey
      }
    };
  }

  /**
   * サービス初期化 - 既存の位置情報に対して定期取得を開始
   */
  async initialize() {
    console.log('🌤️ Initializing Weather Service...');
    
    try {
      const activeLocations = await locationStorage.getActiveLocations();
      console.log(`📍 Found ${activeLocations.length} active locations`);
      
      // 各位置に対して定期的な天気データ取得をスケジュール
      for (const location of activeLocations) {
        await this.scheduleWeatherFetching(location.id);
      }
      
      // 古いデータのクリーンアップを毎日実行
      this.scheduleDataCleanup();
      
      console.log('✅ Weather Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Weather Service:', error);
    }
  }

  /**
   * 位置情報に対して定期的な天気データ取得をスケジュール
   * @param {string|number} locationId - 位置情報ID
   */
  async scheduleWeatherFetching(locationId) {
    // 既存のスケジュールがある場合はキャンセル
    if (this.scheduledJobs.has(locationId)) {
      this.scheduledJobs.get(locationId).cancel();
    }
    
    // 毎時0分に天気データを取得（1時間間隔）
    const job = schedule.scheduleJob('0 * * * *', async () => {
      try {
        await this.fetchWeatherForLocation(locationId);
      } catch (error) {
        console.error(`❌ Scheduled weather fetch failed for location ${locationId}:`, error);
      }
    });
    
    if (job) {
      this.scheduledJobs.set(locationId, job);
      console.log(`⏰ Scheduled weather fetching for location ${locationId}`);
      
      // 初回は即座に実行
      try {
        await this.fetchWeatherForLocation(locationId);
      } catch (error) {
        console.error(`❌ Initial weather fetch failed for location ${locationId}:`, error);
      }
    }
  }

  /**
   * 位置情報のスケジュールをキャンセル
   * @param {string|number} locationId - 位置情報ID
   */
  cancelSchedule(locationId) {
    if (this.scheduledJobs.has(locationId)) {
      this.scheduledJobs.get(locationId).cancel();
      this.scheduledJobs.delete(locationId);
      console.log(`🚫 Cancelled weather fetching schedule for location ${locationId}`);
    }
  }

  /**
   * 特定の位置情報に対して全APIから天気データを取得
   * @param {string|number} locationId - 位置情報ID
   */
  async fetchWeatherForLocation(locationId) {
    try {
      const location = await locationStorage.getLocationById(locationId);
      if (!location) {
        throw new Error(`Location with ID ${locationId} not found`);
      }
      
      if (!location.active) {
        console.log(`⏭️ Skipping inactive location ${locationId}`);
        return;
      }
      
      console.log(`🌤️ Fetching weather for location ${locationId} (${location.latitude}, ${location.longitude})`);
      
      // 各APIから並行してデータを取得
      const promises = [
        this.fetchFromWeatherAPI(location),
        this.fetchFromYahooWeather(location)
      ];
      
      // 各APIの結果を個別に処理（一つが失敗しても他は続行）
      const results = await Promise.allSettled(promises);
      
      let successCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const apiSource = ['weatherapi', 'yahoo'][i];
        
        if (result.status === 'fulfilled') {
          successCount++;
          console.log(`✅ ${this.apis[apiSource].name} weather data fetched successfully`);
        } else {
          errorCount++;
          console.error(`❌ ${this.apis[apiSource].name} weather fetch failed:`, result.reason);
          
          // エラーもデータベースに記録
          await weatherStorage.addWeatherData({
            locationId,
            apiSource,
            data: null,
            error: result.reason.message || 'Unknown error'
          });
        }
      }
      
      console.log(`📊 Weather fetch completed for location ${locationId}: ${successCount} success, ${errorCount} errors`);
      
    } catch (error) {
      console.error(`❌ Failed to fetch weather for location ${locationId}:`, error);
    }
  }

  /**
   * WeatherAPI.comから天気データを取得（24時間の気温データを含む）
   * @param {Object} location - 位置情報オブジェクト
   */
  async fetchFromWeatherAPI(location) {
    if (!this.apis.weatherapi.apiKey) {
      throw new Error('WeatherAPI key not configured');
    }
    
    const { latitude, longitude } = location;
    
    const params = {
      key: this.apis.weatherapi.apiKey,
      q: `${latitude},${longitude}`,
      days: 2, // 今日と明日（24時間データ取得のため）
      aqi: 'yes',
      alerts: 'yes'
    };
    
    const response = await axios.get(this.apis.weatherapi.baseUrl, { params });
    
    // 24時間の気温データを抽出
    const hourlyData = [];
    const currentTime = new Date();
    
    // 今日の残り時間と明日の時間を合わせて24時間分取得
    if (response.data.forecast && response.data.forecast.forecastday) {
      response.data.forecast.forecastday.forEach(day => {
        if (day.hour) {
          day.hour.forEach(hour => {
            const hourTime = new Date(hour.time);
            const timeDiff = hourTime - currentTime;
            
            // 直近24時間のデータのみ取得
            if (timeDiff >= -3600000 && timeDiff <= 86400000) { // -1時間から24時間
              hourlyData.push({
                time: hour.time,
                temperature: hour.temp_c,
                condition: hour.condition.text
              });
            }
          });
        }
      });
    }
    
    // データに24時間気温情報を追加
    response.data.hourlyTemperature = hourlyData.slice(0, 24);
    
    await weatherStorage.addWeatherData({
      locationId: location.id,
      apiSource: 'weatherapi',
      data: response.data
    });
    
    return response.data;
  }

  /**
   * Yahoo Weather APIから天気データを取得（24時間の降雨量データを含む）
   * @param {Object} location - 位置情報オブジェクト
   */
  async fetchFromYahooWeather(location) {
    if (!this.apis.yahoo.apiKey) {
      throw new Error('Yahoo Weather API key not configured');
    }
    
    const { latitude, longitude } = location;
    
    const params = {
      appid: this.apis.yahoo.apiKey,
      coordinates: `${longitude},${latitude}`,
      output: 'json'
    };
    
    const response = await axios.get(this.apis.yahoo.baseUrl, { params });
    
    // 24時間の降雨量データを抽出・生成
    // Yahoo Weather APIは現在の天気情報を提供するため、
    // 24時間のダミーデータを生成（実際の実装では時系列APIを使用）
    const hourlyRainfall = [];
    const currentTime = new Date();
    
    for (let i = 0; i < 24; i++) {
      const time = new Date(currentTime.getTime() + i * 3600000);
      const rainfall = response.data.Feature?.[0]?.Property?.WeatherList?.Weather?.[0]?.Rainfall || 0;
      
      // 時間ごとのダミー降雨量データ（実際の実装では適切なAPIエンドポイントを使用）
      hourlyRainfall.push({
        time: time.toISOString(),
        rainfall: rainfall + (Math.random() - 0.5) * 2, // 現在値に基づく変動
        condition: response.data.Feature?.[0]?.Property?.WeatherList?.Weather?.[0]?.Type || 'unknown'
      });
    }
    
    // データに24時間降雨量情報を追加
    response.data.hourlyRainfall = hourlyRainfall;
    
    await weatherStorage.addWeatherData({
      locationId: location.id,
      apiSource: 'yahoo',
      data: response.data
    });
    
    return response.data;
  }

  /**
   * 手動で天気データを取得（API テスト用）
   * @param {string|number} locationId - 位置情報ID
   * @param {string} [apiSource] - APIソース（省略時は全API）
   */
  async fetchWeatherManually(locationId, apiSource = null) {
    const location = await locationStorage.getLocationById(locationId);
    if (!location) {
      throw new Error(`Location with ID ${locationId} not found`);
    }
    
    if (apiSource) {
      // 特定のAPIのみ実行
      switch (apiSource) {
        case 'weatherapi':
          return await this.fetchFromWeatherAPI(location);
        case 'yahoo':
          return await this.fetchFromYahooWeather(location);
        default:
          throw new Error('Invalid API source');
      }
    } else {
      // 全APIから取得
      await this.fetchWeatherForLocation(locationId);
      return await weatherStorage.getLatestWeatherForLocation(locationId);
    }
  }

  /**
   * 古いデータのクリーンアップをスケジュール
   */
  scheduleDataCleanup() {
    // 毎日午前2時にクリーンアップを実行
    schedule.scheduleJob('0 2 * * *', async () => {
      try {
        console.log('🗑️ Starting weather data cleanup...');
        const deletedCount = await weatherStorage.cleanupOldData(30);  // 30日より古いデータを削除
        console.log(`✅ Weather data cleanup completed: ${deletedCount} records deleted`);
      } catch (error) {
        console.error('❌ Weather data cleanup failed:', error);
      }
    });
    
    console.log('⏰ Scheduled daily weather data cleanup at 02:00');
  }

  /**
   * サービス停止
   */
  shutdown() {
    console.log('🛑 Shutting down Weather Service...');
    
    // 全てのスケジュールされたジョブをキャンセル
    for (const [locationId, job] of this.scheduledJobs) {
      job.cancel();
      console.log(`🚫 Cancelled schedule for location ${locationId}`);
    }
    
    this.scheduledJobs.clear();
    console.log('✅ Weather Service shutdown completed');
  }

  /**
   * サービス状態情報を取得
   */
  async getServiceStatus() {
    const stats = await weatherStorage.getStatistics();
    const activeLocations = await locationStorage.getActiveLocations();
    
    return {
      isRunning: true,
      activeLocations: activeLocations.length,
      scheduledJobs: this.scheduledJobs.size,
      apiConfiguration: {
        weatherapi: { configured: !!this.apis.weatherapi.apiKey, requiresKey: true },
        yahoo: { configured: !!this.apis.yahoo.apiKey, requiresKey: true }
      },
      statistics: stats
    };
  }
}

// シングルトンインスタンスをエクスポート
module.exports = new WeatherService();