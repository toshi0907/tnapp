const NotificationService = require('../src/services/notificationService');

describe('Email Notification with URL', () => {
  let originalTransporter;
  
  beforeEach(() => {
    // Email transporter をモック
    originalTransporter = NotificationService.emailTransporter;
    NotificationService.emailTransporter = {
      sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
    };
    
    // 環境変数を設定
    process.env.EMAIL_TO = 'test@example.com';
    process.env.SMTP_USER = 'sender@example.com';
  });

  afterEach(() => {
    // 元に戻す
    NotificationService.emailTransporter = originalTransporter;
    delete process.env.EMAIL_TO;
    delete process.env.SMTP_USER;
  });

  test('URLがメールテキスト本文の末尾に含まれる', async () => {
    const testReminder = {
      id: 'test-123',
      title: 'テストリマインダー',
      message: 'テストメッセージ',
      url: 'https://example.com/meeting',
      notificationDateTime: new Date('2025-08-15T09:00:00.000Z').toISOString(),
      timezone: 'Asia/Tokyo',
      category: 'work',
      tags: ['meeting']
    };

    const result = await NotificationService.sendEmailNotification(testReminder);

    expect(result).toBe(true);
    expect(NotificationService.emailTransporter.sendMail).toHaveBeenCalled();
    
    const callArgs = NotificationService.emailTransporter.sendMail.mock.calls[0][0];
    expect(callArgs.text).toContain('URL: https://example.com/meeting');
    expect(callArgs.text).toContain('---\nTN API Server');
  });

  test('URLがメールHTML本文の末尾にリンクとして含まれる', async () => {
    const testReminder = {
      id: 'test-456',
      title: 'テストリマインダー',
      message: 'テストメッセージ',
      url: 'https://example.com/meeting',
      notificationDateTime: new Date('2025-08-15T09:00:00.000Z').toISOString(),
      timezone: 'Asia/Tokyo',
      category: 'work',
      tags: ['meeting']
    };

    const result = await NotificationService.sendEmailNotification(testReminder);

    expect(result).toBe(true);
    
    const callArgs = NotificationService.emailTransporter.sendMail.mock.calls[0][0];
    expect(callArgs.html).toContain('<p><strong>URL:</strong> <a href="https://example.com/meeting">https://example.com/meeting</a></p>');
  });

  test('URLが空の場合、メールにURL行は含まれない', async () => {
    const testReminder = {
      id: 'test-789',
      title: 'URLなしリマインダー',
      message: 'テストメッセージ',
      url: '',
      notificationDateTime: new Date('2025-08-15T09:00:00.000Z').toISOString(),
      timezone: 'Asia/Tokyo',
      category: 'work',
      tags: []
    };

    const result = await NotificationService.sendEmailNotification(testReminder);

    expect(result).toBe(true);
    
    const callArgs = NotificationService.emailTransporter.sendMail.mock.calls[0][0];
    expect(callArgs.text).not.toContain('URL:');
    expect(callArgs.html).not.toContain('<strong>URL:</strong>');
  });

  test('URLがnullの場合、メールにURL行は含まれない', async () => {
    const testReminder = {
      id: 'test-null',
      title: 'URLnullリマインダー',
      message: 'テストメッセージ',
      url: null,
      notificationDateTime: new Date('2025-08-15T09:00:00.000Z').toISOString(),
      timezone: 'Asia/Tokyo',
      category: 'work',
      tags: []
    };

    const result = await NotificationService.sendEmailNotification(testReminder);

    expect(result).toBe(true);
    
    const callArgs = NotificationService.emailTransporter.sendMail.mock.calls[0][0];
    expect(callArgs.text).not.toContain('URL:');
    expect(callArgs.html).not.toContain('<strong>URL:</strong>');
  });

  test('URLがundefinedの場合、メールにURL行は含まれない', async () => {
    const testReminder = {
      id: 'test-undefined',
      title: 'URL未定義リマインダー',
      message: 'テストメッセージ',
      notificationDateTime: new Date('2025-08-15T09:00:00.000Z').toISOString(),
      timezone: 'Asia/Tokyo',
      category: 'work',
      tags: []
    };

    const result = await NotificationService.sendEmailNotification(testReminder);

    expect(result).toBe(true);
    
    const callArgs = NotificationService.emailTransporter.sendMail.mock.calls[0][0];
    expect(callArgs.text).not.toContain('URL:');
    expect(callArgs.html).not.toContain('<strong>URL:</strong>');
  });

  test('URLとメッセージが両方存在する場合の本文構造', async () => {
    const testReminder = {
      id: 'test-full',
      title: 'フルリマインダー',
      message: 'これは詳細メッセージです',
      url: 'https://example.com/details',
      notificationDateTime: new Date('2025-08-15T09:00:00.000Z').toISOString(),
      timezone: 'Asia/Tokyo',
      category: 'important',
      tags: ['urgent', 'meeting']
    };

    const result = await NotificationService.sendEmailNotification(testReminder);

    expect(result).toBe(true);
    
    const callArgs = NotificationService.emailTransporter.sendMail.mock.calls[0][0];
    const text = callArgs.text;
    
    // 正しい順序で項目が含まれていることを確認
    const messageIndex = text.indexOf('メッセージ:');
    const dateIndex = text.indexOf('通知日時:');
    const categoryIndex = text.indexOf('カテゴリ:');
    const tagsIndex = text.indexOf('タグ:');
    const urlIndex = text.indexOf('URL:');
    const footerIndex = text.indexOf('---\nTN API Server');
    
    expect(messageIndex).toBeGreaterThan(-1);
    expect(dateIndex).toBeGreaterThan(messageIndex);
    expect(categoryIndex).toBeGreaterThan(dateIndex);
    expect(tagsIndex).toBeGreaterThan(categoryIndex);
    expect(urlIndex).toBeGreaterThan(tagsIndex);
    expect(footerIndex).toBeGreaterThan(urlIndex);
  });
});
