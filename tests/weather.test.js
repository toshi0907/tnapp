/**
 * 天気予報機能のテスト
 */

const request = require('supertest');
const { createApp } = require('../src/createApp');
const locationStorage = require('../src/database/locationStorage');
const weatherStorage = require('../src/database/weatherStorage');

describe('Weather API Tests', () => {
  let app;
  
  beforeEach(async () => {
    app = createApp();
    
    // テスト用のモック設定
    jest.clearAllMocks();
  });

  describe('位置情報管理', () => {
    test('新しい位置情報を登録できる', async () => {
      const locationData = {
        latitude: 35.6762,
        longitude: 139.6503,
        name: '東京駅',
        description: '日本の首都の中心地'
      };

      // モックの設定
      const mockLocation = {
        id: Date.now(),
        ...locationData,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      locationStorage.addLocation = jest.fn().mockResolvedValue(mockLocation);

      const response = await request(app)
        .post('/api/weather/locations')
        .send(locationData)
        .expect(201);

      expect(response.body).toEqual(mockLocation);
      expect(locationStorage.addLocation).toHaveBeenCalledWith(locationData);
    });

    test('緯度・経度が必須である', async () => {
      const invalidData = {
        name: '無効な位置',
        description: '緯度・経度なし'
      };

      const response = await request(app)
        .post('/api/weather/locations')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('required');
    });

    test('位置情報一覧を取得できる', async () => {
      const mockLocations = [
        {
          id: 1,
          latitude: 35.6762,
          longitude: 139.6503,
          name: '東京駅',
          description: '',
          active: true,
          createdAt: '2025-09-02T00:00:00.000Z',
          updatedAt: '2025-09-02T00:00:00.000Z'
        }
      ];

      locationStorage.getLocations = jest.fn().mockResolvedValue(mockLocations);

      const response = await request(app)
        .get('/api/weather/locations')
        .expect(200);

      expect(response.body).toEqual(mockLocations);
      expect(locationStorage.getLocations).toHaveBeenCalled();
    });

    test('特定の位置情報を取得できる', async () => {
      const mockLocation = {
        id: 1,
        latitude: 35.6762,
        longitude: 139.6503,
        name: '東京駅',
        description: '',
        active: true,
        createdAt: '2025-09-02T00:00:00.000Z',
        updatedAt: '2025-09-02T00:00:00.000Z'
      };

      locationStorage.getLocationById = jest.fn().mockResolvedValue(mockLocation);

      const response = await request(app)
        .get('/api/weather/locations/1')
        .expect(200);

      expect(response.body).toEqual(mockLocation);
      expect(locationStorage.getLocationById).toHaveBeenCalledWith('1');
    });

    test('存在しない位置情報は404を返す', async () => {
      locationStorage.getLocationById = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .get('/api/weather/locations/999')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Location not found');
    });
  });

  describe('天気データ管理', () => {
    test('天気データ一覧を取得できる', async () => {
      const mockWeatherData = [
        {
          id: 1,
          locationId: 1,
          apiSource: 'openmeteo',
          data: { temperature: 25 },
          error: null,
          success: true,
          fetchedAt: '2025-09-02T00:00:00.000Z'
        }
      ];

      weatherStorage.getWeatherData = jest.fn().mockResolvedValue(mockWeatherData);

      const response = await request(app)
        .get('/api/weather/data')
        .expect(200);

      expect(response.body).toEqual(mockWeatherData);
      expect(weatherStorage.getWeatherData).toHaveBeenCalledWith({});
    });

    test('位置情報IDでフィルタできる', async () => {
      const mockWeatherData = [
        {
          id: 1,
          locationId: 1,
          apiSource: 'openmeteo',
          data: { temperature: 25 },
          error: null,
          success: true,
          fetchedAt: '2025-09-02T00:00:00.000Z'
        }
      ];

      weatherStorage.getWeatherData = jest.fn().mockResolvedValue(mockWeatherData);

      const response = await request(app)
        .get('/api/weather/data?locationId=1')
        .expect(200);

      expect(response.body).toEqual(mockWeatherData);
      expect(weatherStorage.getWeatherData).toHaveBeenCalledWith({ locationId: '1' });
    });

    test('最新天気データを取得できる', async () => {
      const mockLatestData = [
        {
          id: 1,
          locationId: 1,
          apiSource: 'openmeteo',
          data: { temperature: 25 },
          error: null,
          success: true,
          fetchedAt: '2025-09-02T00:00:00.000Z'
        }
      ];

      locationStorage.getLocationById = jest.fn().mockResolvedValue({ id: 1, name: 'Test' });
      weatherStorage.getLatestWeatherForLocation = jest.fn().mockResolvedValue(mockLatestData);

      const response = await request(app)
        .get('/api/weather/latest/1')
        .expect(200);

      expect(response.body).toEqual(mockLatestData);
      expect(weatherStorage.getLatestWeatherForLocation).toHaveBeenCalledWith('1', undefined);
    });
  });

  describe('天気サービス状態', () => {
    test('サービス状態を取得できる', async () => {
      const mockServiceStatus = {
        isRunning: true,
        activeLocations: 1,
        scheduledJobs: 1,
        apiConfiguration: {
          openmeteo: { configured: true, requiresKey: false },
          weatherapi: { configured: false, requiresKey: true },
          yahoo: { configured: false, requiresKey: true }
        },
        statistics: {
          totalRecords: 10,
          successfulRecords: 5,
          failedRecords: 5
        }
      };

      // weather service のモック
      const weatherService = require('../src/services/weatherService');
      weatherService.getServiceStatus = jest.fn().mockResolvedValue(mockServiceStatus);

      const response = await request(app)
        .get('/api/weather/status')
        .expect(200);

      expect(response.body).toEqual(mockServiceStatus);
    });
  });

  describe('エラーハンドリング', () => {
    test('データベースエラーを適切に処理する', async () => {
      locationStorage.getLocations = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/weather/locations')
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Failed to fetch locations');
    });

    test('不正な緯度・経度を拒否する', async () => {
      const invalidData = {
        latitude: 'invalid',
        longitude: 'invalid',
        name: '無効な座標'
      };

      const response = await request(app)
        .post('/api/weather/locations')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});

// ストレージクラスのモック設定
jest.mock('../src/database/locationStorage');
jest.mock('../src/database/weatherStorage');
jest.mock('../src/services/weatherService');