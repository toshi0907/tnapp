const NotificationService = require('../src/services/notificationService');
const axios = require('axios');

// axios をモック
jest.mock('axios');
const mockedAxios = axios;

describe('Webhook Notification with Query Parameters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // WEBHOOK_URL環境変数を設定
    process.env.WEBHOOK_URL = 'https://example.com/webhook';
  });

  afterEach(() => {
    delete process.env.WEBHOOK_URL;
  });

  test('webhookリクエストにtitleとmessageがクエリパラメータとして含まれる', async () => {
    // axios.postをモック
    mockedAxios.post.mockResolvedValue({
      status: 200,
      data: { received: true }
    });

    const testReminder = {
      id: 'test-123',
      title: 'テストタイトル',
      message: 'テストメッセージ',
      notificationDateTime: new Date().toISOString(),
      timezone: 'Asia/Tokyo',
      category: 'test',
      tags: ['test']
    };

    const result = await NotificationService.sendWebhookNotification(testReminder);

    expect(result).toBe(true);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://example.com/webhook?title=%E3%83%86%E3%82%B9%E3%83%88%E3%82%BF%E3%82%A4%E3%83%88%E3%83%AB&message=%E3%83%86%E3%82%B9%E3%83%88%E3%83%A1%E3%83%83%E3%82%BB%E3%83%BC%E3%82%B8',
      {
        id: 'test-123',
        title: 'テストタイトル',
        message: 'テストメッセージ',
        notificationDateTime: testReminder.notificationDateTime,
        timezone: 'Asia/Tokyo',
        category: 'test',
        tags: ['test']
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'TN-API-Server-Reminder'
        },
        timeout: 10000
      }
    );
  });

  test('messageが空の場合、titleのみクエリパラメータに含まれる', async () => {
    mockedAxios.post.mockResolvedValue({
      status: 200,
      data: { received: true }
    });

    const testReminder = {
      id: 'test-456',
      title: 'タイトルのみ',
      message: null,
      notificationDateTime: new Date().toISOString(),
      timezone: 'Asia/Tokyo',
      category: 'test',
      tags: []
    };

    const result = await NotificationService.sendWebhookNotification(testReminder);

    expect(result).toBe(true);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://example.com/webhook?title=%E3%82%BF%E3%82%A4%E3%83%88%E3%83%AB%E3%81%AE%E3%81%BF',
      expect.any(Object),
      expect.any(Object)
    );
  });

  test('空文字のmessageの場合、titleのみクエリパラメータに含まれる', async () => {
    mockedAxios.post.mockResolvedValue({
      status: 200,
      data: { received: true }
    });

    const testReminder = {
      id: 'test-789',
      title: 'タイトル',
      message: '',
      notificationDateTime: new Date().toISOString(),
      timezone: 'Asia/Tokyo',
      category: 'test',
      tags: []
    };

    const result = await NotificationService.sendWebhookNotification(testReminder);

    expect(result).toBe(true);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://example.com/webhook?title=%E3%82%BF%E3%82%A4%E3%83%88%E3%83%AB',
      expect.any(Object),
      expect.any(Object)
    );
  });

  test('特殊文字を含むtitleとmessageが正しくエンコードされる', async () => {
    mockedAxios.post.mockResolvedValue({
      status: 200,
      data: { received: true }
    });

    const testReminder = {
      id: 'test-special',
      title: 'テスト & リマインダー',
      message: 'メッセージ含む = 特殊文字',
      notificationDateTime: new Date().toISOString(),
      timezone: 'Asia/Tokyo',
      category: 'test',
      tags: []
    };

    const result = await NotificationService.sendWebhookNotification(testReminder);

    expect(result).toBe(true);
    
    const callArgs = mockedAxios.post.mock.calls[0];
    const calledUrl = callArgs[0];
    
    // URLが正しくエンコードされていることを確認
    expect(calledUrl).toContain('title=');
    expect(calledUrl).toContain('message=');
    expect(calledUrl).toContain('%26'); // & のエンコード
    expect(calledUrl).toContain('%3D'); // = のエンコード
  });

  test('WEBHOOK_URLが設定されていない場合、falseを返す', async () => {
    delete process.env.WEBHOOK_URL;

    const testReminder = {
      id: 'test-no-url',
      title: 'テスト',
      message: 'メッセージ',
      notificationDateTime: new Date().toISOString(),
      timezone: 'Asia/Tokyo',
      category: 'test',
      tags: []
    };

    const result = await NotificationService.sendWebhookNotification(testReminder);

    expect(result).toBe(false);
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });
});