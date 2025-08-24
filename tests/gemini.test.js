const request = require('supertest');
const express = require('express');

// テスト用のサーバーアプリケーションを作成
const app = express();
app.use(express.json());

// テスト用のストレージモジュールをモック
jest.mock('../src/database/geminiStorage', () => {
  return {
    getGeminiResults: jest.fn(),
    getGeminiResultById: jest.fn(),
    addGeminiResult: jest.fn(),
    updateGeminiResult: jest.fn(),
    deleteGeminiResult: jest.fn(),
    getGeminiResultCount: jest.fn(),
    getSuccessfulResults: jest.fn(),
    getFailedResults: jest.fn(),
    getSuccessCount: jest.fn(),
    getFailedCount: jest.fn(),
    getCategories: jest.fn(),
    getTags: jest.fn(),
    getStats: jest.fn(),
    getRecentResults: jest.fn()
  };
});

// Geminiサービスをモック
jest.mock('../src/services/geminiService', () => {
  return {
    executeCustomPrompt: jest.fn(),
    testGeminiAPI: jest.fn(),
    listActiveJobs: jest.fn(),
    scheduleCustomJob: jest.fn(),
    cancelCustomJob: jest.fn()
  };
});

const geminiStorage = require('../src/database/geminiStorage');
const geminiService = require('../src/services/geminiService');
const geminiRouter = require('../src/routes/gemini');

app.use('/api/gemini', geminiRouter);

describe('Gemini API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/gemini', () => {
    test('すべてのGemini結果の取得に成功', async () => {
      const mockResults = [
        {
          id: 1,
          prompt: 'Test prompt 1',
          response: 'Test response 1',
          model: 'gemini-2.0-flash',
          status: 'success',
          executionTime: 1500,
          tokensUsed: 25,
          category: 'test',
          tags: ['test', 'api'],
          scheduledBy: 'manual',
          createdAt: '2025-08-01T10:00:00.000Z'
        },
        {
          id: 2,
          prompt: 'Test prompt 2',
          response: null,
          model: 'gemini-2.0-flash',
          status: 'error',
          errorMessage: 'API error',
          executionTime: 500,
          tokensUsed: null,
          category: 'test',
          tags: ['test', 'error'],
          scheduledBy: 'scheduled',
          createdAt: '2025-08-01T11:00:00.000Z'
        }
      ];

      geminiStorage.getGeminiResults.mockResolvedValue(mockResults);

      const response = await request(app)
        .get('/api/gemini')
        .expect(200);

      expect(response.body).toEqual(mockResults);
      expect(geminiStorage.getGeminiResults).toHaveBeenCalledTimes(1);
    });

    test('検索フィルタが正しく動作', async () => {
      const mockResults = [
        {
          id: 1,
          prompt: 'AI explanation',
          response: 'AI works by...',
          model: 'gemini-2.0-flash',
          status: 'success',
          category: 'ai',
          tags: ['ai', 'technology'],
          createdAt: '2025-08-01T10:00:00.000Z'
        },
        {
          id: 2,
          prompt: 'Programming tips',
          response: 'Use meaningful names...',
          model: 'gemini-2.0-flash',
          status: 'success',
          category: 'programming',
          tags: ['coding', 'tips'],
          createdAt: '2025-08-01T11:00:00.000Z'
        }
      ];

      geminiStorage.getGeminiResults.mockResolvedValue(mockResults);

      const response = await request(app)
        .get('/api/gemini?search=AI&category=ai')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].prompt).toBe('AI explanation');
    });

    test('データベースエラーを適切に処理', async () => {
      geminiStorage.getGeminiResults.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/gemini')
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to fetch gemini results' });
    });
  });

  describe('GET /api/gemini/:id', () => {
    test('特定のGemini結果の取得に成功', async () => {
      const mockResult = {
        id: 1,
        prompt: 'Test prompt',
        response: 'Test response',
        model: 'gemini-2.0-flash',
        status: 'success',
        executionTime: 1500,
        tokensUsed: 25,
        category: 'test',
        tags: ['test'],
        scheduledBy: 'manual',
        createdAt: '2025-08-01T10:00:00.000Z'
      };

      geminiStorage.getGeminiResultById.mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/gemini/1')
        .expect(200);

      expect(response.body).toEqual(mockResult);
      expect(geminiStorage.getGeminiResultById).toHaveBeenCalledWith('1');
    });

    test('存在しないIDで404エラー', async () => {
      geminiStorage.getGeminiResultById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/gemini/999')
        .expect(404);

      expect(response.body).toEqual({ error: 'Gemini result not found' });
    });
  });

  describe('POST /api/gemini', () => {
    test('Gemini API実行に成功', async () => {
      const mockResult = {
        id: 1,
        prompt: 'Test prompt',
        response: 'Test response',
        model: 'gemini-2.0-flash',
        status: 'success',
        executionTime: 1500,
        tokensUsed: 25,
        category: 'test',
        tags: ['test'],
        scheduledBy: 'manual',
        createdAt: '2025-08-01T10:00:00.000Z'
      };

      geminiService.executeCustomPrompt.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/gemini')
        .send({
          prompt: 'Test prompt',
          category: 'test',
          tags: ['test']
        })
        .expect(201);

      expect(response.body).toEqual(mockResult);
      expect(geminiService.executeCustomPrompt).toHaveBeenCalledWith('Test prompt', 'test', ['test']);
    });

    test('プロンプトが空の場合400エラー', async () => {
      const response = await request(app)
        .post('/api/gemini')
        .send({
          prompt: '',
          category: 'test'
        })
        .expect(400);

      expect(response.body).toEqual({ error: 'Prompt is required and must be a non-empty string' });
    });

    test('プロンプトが未指定の場合400エラー', async () => {
      const response = await request(app)
        .post('/api/gemini')
        .send({
          category: 'test'
        })
        .expect(400);

      expect(response.body).toEqual({ error: 'Prompt is required and must be a non-empty string' });
    });

    test('API設定エラーを適切に処理', async () => {
      geminiService.executeCustomPrompt.mockRejectedValue(new Error('GEMINI_API_KEY not configured'));

      const response = await request(app)
        .post('/api/gemini')
        .send({
          prompt: 'Test prompt'
        })
        .expect(400);

      expect(response.body).toEqual({ error: 'Gemini API key not configured' });
    });
  });

  describe('DELETE /api/gemini/:id', () => {
    test('Gemini結果の削除に成功', async () => {
      geminiStorage.deleteGeminiResult.mockResolvedValue(true);

      const response = await request(app)
        .delete('/api/gemini/1')
        .expect(200);

      expect(response.body).toEqual({ message: 'Gemini result deleted successfully' });
      expect(geminiStorage.deleteGeminiResult).toHaveBeenCalledWith('1');
    });

    test('存在しないIDで404エラー', async () => {
      geminiStorage.deleteGeminiResult.mockResolvedValue(false);

      const response = await request(app)
        .delete('/api/gemini/999')
        .expect(404);

      expect(response.body).toEqual({ error: 'Gemini result not found' });
    });
  });

  describe('GET /api/gemini/meta/categories', () => {
    test('カテゴリ一覧の取得に成功', async () => {
      const mockCategories = ['technology', 'programming', 'test'];
      geminiStorage.getCategories.mockResolvedValue(mockCategories);

      const response = await request(app)
        .get('/api/gemini/meta/categories')
        .expect(200);

      expect(response.body).toEqual(mockCategories);
    });
  });

  describe('GET /api/gemini/meta/tags', () => {
    test('タグ一覧の取得に成功', async () => {
      const mockTags = ['ai', 'coding', 'tips', 'test'];
      geminiStorage.getTags.mockResolvedValue(mockTags);

      const response = await request(app)
        .get('/api/gemini/meta/tags')
        .expect(200);

      expect(response.body).toEqual(mockTags);
    });
  });

  describe('GET /api/gemini/meta/stats', () => {
    test('統計情報の取得に成功', async () => {
      const mockStats = {
        total: 10,
        successful: 8,
        failed: 2,
        successRate: '80.00',
        avgExecutionTime: 1200,
        totalTokens: 250
      };
      geminiStorage.getStats.mockResolvedValue(mockStats);

      const response = await request(app)
        .get('/api/gemini/meta/stats')
        .expect(200);

      expect(response.body).toEqual(mockStats);
    });
  });

  describe('POST /api/gemini/test', () => {
    test('Gemini API接続テストに成功', async () => {
      const mockTestResult = {
        success: true,
        message: 'Gemini API test successful',
        result: {
          id: 1,
          prompt: 'Hello, can you respond with a simple greeting?',
          response: 'Hello! How can I help you today?',
          status: 'success'
        }
      };

      geminiService.testGeminiAPI.mockResolvedValue(mockTestResult);

      const response = await request(app)
        .post('/api/gemini/test')
        .expect(200);

      expect(response.body).toEqual(mockTestResult);
      expect(geminiService.testGeminiAPI).toHaveBeenCalledWith(undefined);
    });

    test('カスタムプロンプトでのテスト', async () => {
      const mockTestResult = {
        success: true,
        message: 'Gemini API test successful',
        result: { id: 1, status: 'success' }
      };

      geminiService.testGeminiAPI.mockResolvedValue(mockTestResult);

      const response = await request(app)
        .post('/api/gemini/test')
        .send({ prompt: 'Custom test prompt' })
        .expect(200);

      expect(geminiService.testGeminiAPI).toHaveBeenCalledWith('Custom test prompt');
    });

    test('API接続テストの失敗', async () => {
      const mockTestResult = {
        success: false,
        message: 'Gemini API test failed',
        error: 'API key not configured'
      };

      geminiService.testGeminiAPI.mockResolvedValue(mockTestResult);

      const response = await request(app)
        .post('/api/gemini/test')
        .expect(200);

      expect(response.body).toEqual(mockTestResult);
    });
  });

  describe('GET /api/gemini/jobs', () => {
    test('アクティブなジョブ一覧の取得に成功', async () => {
      const mockJobs = ['daily-gemini', 'custom-job-1'];
      geminiService.listActiveJobs.mockReturnValue(mockJobs);

      const response = await request(app)
        .get('/api/gemini/jobs')
        .expect(200);

      expect(response.body).toEqual({
        jobs: mockJobs,
        count: 2
      });
    });
  });
});