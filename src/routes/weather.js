/**
 * 天気予報API ルーター
 * 位置情報管理と天気データ取得機能を提供
 */

const express = require('express');
const locationStorage = require('../database/locationStorage');
const weatherStorage = require('../database/weatherStorage');
const weatherService = require('../services/weatherService');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Weather
 *   description: "天気予報管理API"
 */

/**
 * @swagger
 * /api/weather/locations:
 *   get:
 *     summary: 位置情報一覧取得
 *     description: "登録されている位置情報の一覧を取得"
 *     tags: [Weather]
 *     responses:
 *       200:
 *         description: "位置情報一覧"
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/WeatherLocation'
 *       500:
 *         description: "サーバーエラー"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// 位置情報一覧取得
router.get('/locations', async (req, res) => {
  try {
    const locations = await locationStorage.getLocations();
    res.json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

/**
 * @swagger
 * /api/weather/locations/{id}:
 *   get:
 *     summary: 特定位置情報取得
 *     description: "IDで指定された位置情報を取得"
 *     tags: [Weather]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: "位置情報ID"
 *     responses:
 *       200:
 *         description: "位置情報"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WeatherLocation'
 *       404:
 *         description: "位置情報が見つからない"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: "サーバーエラー"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// 特定位置情報取得
router.get('/locations/:id', async (req, res) => {
  try {
    const location = await locationStorage.getLocationById(req.params.id);
    
    if (!location) {
      return res.status(404).json({
        error: 'Location not found'
      });
    }
    
    res.json(location);
  } catch (error) {
    console.error('Error fetching location:', error);
    res.status(500).json({ error: 'Failed to fetch location' });
  }
});

/**
 * @swagger
 * /api/weather/locations:
 *   post:
 *     summary: 新規位置情報登録
 *     description: "新しい位置情報を登録し、天気データの定期取得を開始"
 *     tags: [Weather]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - latitude
 *               - longitude
 *             properties:
 *               latitude:
 *                 type: number
 *                 minimum: -90
 *                 maximum: 90
 *                 description: "緯度"
 *                 example: 35.6762
 *               longitude:
 *                 type: number
 *                 minimum: -180
 *                 maximum: 180
 *                 description: "経度"
 *                 example: 139.6503
 *               name:
 *                 type: string
 *                 description: "位置名"
 *                 example: "東京駅"
 *               description:
 *                 type: string
 *                 description: "説明"
 *                 example: "日本の首都の中心地"
 *     responses:
 *       201:
 *         description: "位置情報が正常に作成された"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WeatherLocation'
 *       400:
 *         description: "バリデーションエラー"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: "類似座標の位置情報が既に存在"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: "サーバーエラー"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// 新規位置情報登録
router.post('/locations', async (req, res) => {
  try {
    const { latitude, longitude, name, description } = req.body;
    
    // 必須フィールドの検証
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({
        error: 'Latitude and longitude are required and must be numbers'
      });
    }
    
    // 新しい位置情報を作成
    const newLocation = await locationStorage.addLocation({
      latitude,
      longitude,
      name,
      description
    });
    
    // 天気データの定期取得をスケジュール
    await weatherService.scheduleWeatherFetching(newLocation.id);
    
    res.status(201).json(newLocation);
  } catch (error) {
    console.error('Error creating location:', error);
    if (error.message.includes('already exists')) {
      res.status(409).json({ error: error.message });
    } else if (error.message.includes('must be')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to create location' });
    }
  }
});

/**
 * @swagger
 * /api/weather/locations/{id}:
 *   put:
 *     summary: 位置情報更新
 *     description: "既存の位置情報を更新"
 *     tags: [Weather]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: "位置情報ID"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               latitude:
 *                 type: number
 *                 minimum: -90
 *                 maximum: 90
 *                 description: "緯度"
 *               longitude:
 *                 type: number
 *                 minimum: -180
 *                 maximum: 180
 *                 description: "経度"
 *               name:
 *                 type: string
 *                 description: "位置名"
 *               description:
 *                 type: string
 *                 description: "説明"
 *               active:
 *                 type: boolean
 *                 description: "天気データ取得を有効にするか"
 *     responses:
 *       200:
 *         description: "位置情報が正常に更新された"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WeatherLocation'
 *       400:
 *         description: "バリデーションエラー"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: "位置情報が見つからない"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: "サーバーエラー"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// 位置情報更新
router.put('/locations/:id', async (req, res) => {
  try {
    const locationId = req.params.id;
    const updateData = req.body;
    
    // 既存位置情報の確認
    const existingLocation = await locationStorage.getLocationById(locationId);
    if (!existingLocation) {
      return res.status(404).json({
        error: 'Location not found'
      });
    }
    
    // 位置情報を更新
    const updatedLocation = await locationStorage.updateLocation(locationId, updateData);
    
    // active状態が変更された場合、スケジュールを調整
    if (updateData.active !== undefined) {
      if (updateData.active) {
        await weatherService.scheduleWeatherFetching(locationId);
      } else {
        weatherService.cancelSchedule(locationId);
      }
    }
    
    res.json(updatedLocation);
  } catch (error) {
    console.error('Error updating location:', error);
    if (error.message === 'Location not found') {
      res.status(404).json({ error: error.message });
    } else if (error.message.includes('must be')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to update location' });
    }
  }
});

/**
 * @swagger
 * /api/weather/locations/{id}:
 *   delete:
 *     summary: 位置情報削除
 *     description: "位置情報と関連する天気データを削除"
 *     tags: [Weather]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: "位置情報ID"
 *     responses:
 *       204:
 *         description: "位置情報が正常に削除された"
 *       404:
 *         description: "位置情報が見つからない"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: "サーバーエラー"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// 位置情報削除
router.delete('/locations/:id', async (req, res) => {
  try {
    const locationId = req.params.id;
    
    // 位置情報を削除
    await locationStorage.deleteLocation(locationId);
    
    // スケジュールをキャンセル
    weatherService.cancelSchedule(locationId);
    
    // 関連する天気データも削除
    await weatherStorage.deleteWeatherData(locationId);
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting location:', error);
    if (error.message === 'Location not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to delete location' });
    }
  }
});

/**
 * @swagger
 * /api/weather/data:
 *   get:
 *     summary: 天気データ一覧取得
 *     description: "保存されている天気データを取得。フィルタリング機能あり"
 *     tags: [Weather]
 *     parameters:
 *       - in: query
 *         name: locationId
 *         schema:
 *           type: integer
 *         description: "位置情報IDでフィルタ"
 *       - in: query
 *         name: apiSource
 *         schema:
 *           type: string
 *           enum: [weatherapi, yahoo]
 *         description: "APIソースでフィルタ"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: "取得件数制限"
 *     responses:
 *       200:
 *         description: "天気データ一覧"
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/WeatherData'
 *       500:
 *         description: "サーバーエラー"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// 天気データ一覧取得
router.get('/data', async (req, res) => {
  try {
    const { locationId, apiSource, limit } = req.query;
    
    const filters = {};
    if (locationId) filters.locationId = locationId;
    if (apiSource) filters.apiSource = apiSource;
    if (limit) filters.limit = parseInt(limit);
    
    const weatherData = await weatherStorage.getWeatherData(filters);
    res.json(weatherData);
  } catch (error) {
    console.error('Error fetching weather data:', error);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

/**
 * @swagger
 * /api/weather/data/{id}:
 *   get:
 *     summary: 特定天気データ取得
 *     description: "IDで指定された天気データを取得"
 *     tags: [Weather]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: "天気データID"
 *     responses:
 *       200:
 *         description: "天気データ"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WeatherData'
 *       404:
 *         description: "天気データが見つからない"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: "サーバーエラー"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// 特定天気データ取得
router.get('/data/:id', async (req, res) => {
  try {
    const weatherData = await weatherStorage.getWeatherById(req.params.id);
    
    if (!weatherData) {
      return res.status(404).json({
        error: 'Weather data not found'
      });
    }
    
    res.json(weatherData);
  } catch (error) {
    console.error('Error fetching weather data:', error);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

/**
 * @swagger
 * /api/weather/latest/{locationId}:
 *   get:
 *     summary: 最新天気データ取得
 *     description: "指定位置の最新天気データを全APIソースから取得"
 *     tags: [Weather]
 *     parameters:
 *       - in: path
 *         name: locationId
 *         required: true
 *         schema:
 *           type: integer
 *         description: "位置情報ID"
 *       - in: query
 *         name: apiSource
 *         schema:
 *           type: string
 *           enum: [weatherapi, yahoo]
 *         description: "特定APIソースのみ取得"
 *     responses:
 *       200:
 *         description: "最新天気データ"
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/WeatherData'
 *       404:
 *         description: "位置情報が見つからない"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: "サーバーエラー"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// 最新天気データ取得
router.get('/latest/:locationId', async (req, res) => {
  try {
    const locationId = req.params.locationId;
    const { apiSource } = req.query;
    
    // 位置情報の存在確認
    const location = await locationStorage.getLocationById(locationId);
    if (!location) {
      return res.status(404).json({
        error: 'Location not found'
      });
    }
    
    const latestData = await weatherStorage.getLatestWeatherForLocation(locationId, apiSource);
    res.json(latestData);
  } catch (error) {
    console.error('Error fetching latest weather data:', error);
    res.status(500).json({ error: 'Failed to fetch latest weather data' });
  }
});

/**
 * @swagger
 * /api/weather/fetch/{locationId}:
 *   post:
 *     summary: 手動天気データ取得
 *     description: "指定位置の天気データを手動で取得"
 *     tags: [Weather]
 *     parameters:
 *       - in: path
 *         name: locationId
 *         required: true
 *         schema:
 *           type: integer
 *         description: "位置情報ID"
 *       - in: query
 *         name: apiSource
 *         schema:
 *           type: string
 *           enum: [weatherapi, yahoo]
 *         description: "特定APIソースのみ取得（省略時は全API）"
 *     responses:
 *       200:
 *         description: "天気データ取得成功"
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   description: "単一APIの結果"
 *                 - type: array
 *                   items:
 *                     $ref: '#/components/schemas/WeatherData'
 *                   description: "全APIの最新結果"
 *       404:
 *         description: "位置情報が見つからない"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: "サーバーエラー"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// 手動天気データ取得
router.post('/fetch/:locationId', async (req, res) => {
  try {
    const locationId = req.params.locationId;
    const { apiSource } = req.query;
    
    const result = await weatherService.fetchWeatherManually(locationId, apiSource);
    res.json(result);
  } catch (error) {
    console.error('Error fetching weather manually:', error);
    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to fetch weather data' });
    }
  }
});

/**
 * @swagger
 * /api/weather/status:
 *   get:
 *     summary: 天気サービス状態取得
 *     description: "天気サービスの動作状態と統計情報を取得"
 *     tags: [Weather]
 *     responses:
 *       200:
 *         description: "サービス状態情報"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isRunning:
 *                   type: boolean
 *                   description: "サービス動作状態"
 *                 activeLocations:
 *                   type: integer
 *                   description: "アクティブな位置情報数"
 *                 scheduledJobs:
 *                   type: integer
 *                   description: "スケジュール中のジョブ数"
 *                 apiConfiguration:
 *                   type: object
 *                   description: "API設定状態"
 *                 statistics:
 *                   type: object
 *                   description: "天気データ統計"
 *       500:
 *         description: "サーバーエラー"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// 天気サービス状態取得
router.get('/status', async (req, res) => {
  try {
    const status = await weatherService.getServiceStatus();
    res.json(status);
  } catch (error) {
    console.error('Error fetching weather service status:', error);
    res.status(500).json({ error: 'Failed to fetch service status' });
  }
});

/**
 * @swagger
 * /api/weather/graphs/temperature/{locationId}:
 *   get:
 *     summary: 24時間気温グラフデータ取得
 *     description: "WeatherAPIから直近24時間の気温データを取得"
 *     tags: [Weather]
 *     parameters:
 *       - in: path
 *         name: locationId
 *         required: true
 *         schema:
 *           type: integer
 *         description: "位置情報ID"
 *     responses:
 *       200:
 *         description: "24時間気温グラフデータ"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 locationId:
 *                   type: integer
 *                   description: "位置情報ID"
 *                 location:
 *                   type: object
 *                   description: "位置情報"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       time:
 *                         type: string
 *                         description: "時刻"
 *                       temperature:
 *                         type: number
 *                         description: "気温（摂氏）"
 *                       condition:
 *                         type: string
 *                         description: "天気状況"
 *                 generatedAt:
 *                   type: string
 *                   format: 'date-time'
 *                   description: "データ生成日時"
 *       404:
 *         description: "位置情報が見つからない"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: "サーバーエラー"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// 24時間気温グラフデータ取得
router.get('/graphs/temperature/:locationId', async (req, res) => {
  try {
    const locationId = req.params.locationId;
    
    // 位置情報の存在確認
    const location = await locationStorage.getLocationById(locationId);
    if (!location) {
      return res.status(404).json({
        error: 'Location not found'
      });
    }
    
    // 最新のWeatherAPIデータを取得
    const latestData = await weatherStorage.getLatestWeatherForLocation(locationId, 'weatherapi');
    
    if (latestData.length === 0 || !latestData[0].data || !latestData[0].data.hourlyTemperature) {
      // データが無い場合は手動で取得を試行
      try {
        const freshData = await weatherService.fetchWeatherManually(locationId, 'weatherapi');
        if (freshData.hourlyTemperature) {
          return res.json({
            locationId: parseInt(locationId),
            location: {
              name: location.name,
              latitude: location.latitude,
              longitude: location.longitude
            },
            data: freshData.hourlyTemperature,
            generatedAt: new Date().toISOString()
          });
        }
      } catch (fetchError) {
        console.warn('手動での天気データ取得に失敗、モックデータを生成します:', fetchError.message);
      }
      
      // 外部API接続に失敗した場合は、デモ用のモックデータを生成
      const mockTemperatureData = [];
      const now = new Date();
      for (let i = 0; i < 24; i++) {
        const time = new Date(now.getTime() + (i - 12) * 60 * 60 * 1000);
        const baseTemp = 20 + Math.sin(i * Math.PI / 12) * 8; // 正弦波で温度変化を模擬
        mockTemperatureData.push({
          time: time.toISOString(),
          temperature: Math.round((baseTemp + Math.random() * 2 - 1) * 10) / 10, // 小数点1位まで
          condition: i % 4 === 0 ? '晴れ' : i % 4 === 1 ? '曇り' : i % 4 === 2 ? '雨' : '雪'
        });
      }
      
      return res.json({
        locationId: parseInt(locationId),
        location: {
          name: location.name,
          latitude: location.latitude,
          longitude: location.longitude
        },
        data: mockTemperatureData,
        generatedAt: new Date().toISOString(),
        note: 'デモ用のモックデータです'
      });
    }
    
    res.json({
      locationId: parseInt(locationId),
      location: {
        name: location.name,
        latitude: location.latitude,
        longitude: location.longitude
      },
      data: latestData[0].data.hourlyTemperature,
      generatedAt: latestData[0].fetchedAt
    });
  } catch (error) {
    console.error('Error fetching temperature graph data:', error);
    res.status(500).json({ error: 'Failed to fetch temperature graph data' });
  }
});

/**
 * @swagger
 * /api/weather/graphs/rainfall/{locationId}:
 *   get:
 *     summary: 24時間降雨量グラフデータ取得
 *     description: "Yahoo Weatherから直近24時間の降雨量データを取得"
 *     tags: [Weather]
 *     parameters:
 *       - in: path
 *         name: locationId
 *         required: true
 *         schema:
 *           type: integer
 *         description: "位置情報ID"
 *     responses:
 *       200:
 *         description: "24時間降雨量グラフデータ"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 locationId:
 *                   type: integer
 *                   description: "位置情報ID"
 *                 location:
 *                   type: object
 *                   description: "位置情報"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       time:
 *                         type: string
 *                         description: "時刻"
 *                       rainfall:
 *                         type: number
 *                         description: "降雨量（mm）"
 *                       condition:
 *                         type: string
 *                         description: "天気状況"
 *                 generatedAt:
 *                   type: string
 *                   format: 'date-time'
 *                   description: "データ生成日時"
 *       404:
 *         description: "位置情報が見つからない"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: "サーバーエラー"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// 24時間降雨量グラフデータ取得
router.get('/graphs/rainfall/:locationId', async (req, res) => {
  try {
    const locationId = req.params.locationId;
    
    // 位置情報の存在確認
    const location = await locationStorage.getLocationById(locationId);
    if (!location) {
      return res.status(404).json({
        error: 'Location not found'
      });
    }
    
    // 最新のYahoo Weatherデータを取得
    const latestData = await weatherStorage.getLatestWeatherForLocation(locationId, 'yahoo');
    
    if (latestData.length === 0 || !latestData[0].data || !latestData[0].data.hourlyRainfall) {
      // データが無い場合は手動で取得を試行
      try {
        const freshData = await weatherService.fetchWeatherManually(locationId, 'yahoo');
        if (freshData.hourlyRainfall) {
          return res.json({
            locationId: parseInt(locationId),
            location: {
              name: location.name,
              latitude: location.latitude,
              longitude: location.longitude
            },
            data: freshData.hourlyRainfall,
            generatedAt: new Date().toISOString()
          });
        }
      } catch (fetchError) {
        console.warn('手動での天気データ取得に失敗、モックデータを生成します:', fetchError.message);
      }
      
      // 外部API接続に失敗した場合は、デモ用のモックデータを生成
      const mockRainfallData = [];
      const now = new Date();
      for (let i = 0; i < 24; i++) {
        const time = new Date(now.getTime() + (i - 12) * 60 * 60 * 1000);
        // 降雨量は確率的に0または値があるデータを生成
        const hasRain = Math.random() < 0.3; // 30%の確率で雨
        const rainfall = hasRain ? Math.round(Math.random() * 10 * 10) / 10 : 0;
        mockRainfallData.push({
          time: time.toISOString(),
          rainfall: rainfall,
          condition: rainfall > 5 ? '大雨' : rainfall > 1 ? '雨' : rainfall > 0 ? '小雨' : '晴れ'
        });
      }
      
      return res.json({
        locationId: parseInt(locationId),
        location: {
          name: location.name,
          latitude: location.latitude,
          longitude: location.longitude
        },
        data: mockRainfallData,
        generatedAt: new Date().toISOString(),
        note: 'デモ用のモックデータです'
      });
    }
    
    res.json({
      locationId: parseInt(locationId),
      location: {
        name: location.name,
        latitude: location.latitude,
        longitude: location.longitude
      },
      data: latestData[0].data.hourlyRainfall,
      generatedAt: latestData[0].fetchedAt
    });
  } catch (error) {
    console.error('Error fetching rainfall graph data:', error);
    res.status(500).json({ error: 'Failed to fetch rainfall graph data' });
  }
});

/**
 * @swagger
 * /api/weather/cleanup:
 *   post:
 *     summary: 古いデータクリーンアップ
 *     description: "指定日数より古い天気データを削除"
 *     tags: [Weather]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               daysToKeep:
 *                 type: integer
 *                 minimum: 1
 *                 description: "保持日数（デフォルト: 1日）"
 *                 example: 1
 *     responses:
 *       200:
 *         description: "クリーンアップ完了"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 deletedRecords:
 *                   type: integer
 *                   description: "削除されたレコード数"
 *       500:
 *         description: "サーバーエラー"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// 古いデータクリーンアップ
router.post('/cleanup', async (req, res) => {
  try {
    const { daysToKeep = 1 } = req.body;  // デフォルトを1日（24時間）に変更
    const deletedRecords = await weatherStorage.cleanupOldData(daysToKeep);
    
    res.json({ deletedRecords });
  } catch (error) {
    console.error('Error cleaning up weather data:', error);
    res.status(500).json({ error: 'Failed to cleanup weather data' });
  }
});

module.exports = router;