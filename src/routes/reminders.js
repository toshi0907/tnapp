const express = require('express');
const reminderStorage = require('../database/reminderStorage');
const notificationService = require('../services/notificationService');
const { parseFlexibleDate, formatReminderDates } = require('../utils/dateUtils');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Reminders
 *   description: "リマインダー管理API"
 */

/**
 * @swagger
 * /api/reminders:
 *   get:
 *     summary: リマインダー一覧取得
 *     description: "リマインダー一覧を取得。フィルタリング機能あり"
 *     tags: [Reminders]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, sent]
 *         description: "通知状態でフィルタ（pending=未通知、sent=通知済）"
 *       - in: query
 *         name: method
 *         schema:
 *           type: string
 *           enum: [webhook, email]
 *         description: "通知手段でフィルタ"
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: "カテゴリでフィルタ"
 *       - in: query
 *         name: upcoming
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: "指定時間内（時間単位）の予定リマインダーのみ取得"
 *     responses:
 *       200:
 *         description: "リマインダー一覧"
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Reminder'
 *       500:
 *         description: "サーバーエラー"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// リマインダー一覧取得
router.get('/', async (req, res) => {
  try {
    const { status, method, category, upcoming } = req.query;
    
    let reminders;
    
    if (upcoming) {
      reminders = await reminderStorage.getUpcomingReminders(parseInt(upcoming));
    } else {
      reminders = await reminderStorage.getReminders();
    }
    
    // フィルタリング
    if (status) {
      reminders = reminders.filter(reminder => reminder.notificationStatus === status);
    }
    
    if (method) {
      reminders = reminders.filter(reminder => reminder.notificationMethod === method);
    }
    
    if (category) {
      reminders = reminders.filter(reminder => reminder.category === category);
    }
    
    // 日付フィールドを指定フォーマットに変換
    const formattedReminders = reminders.map(formatReminderDates);
    
    res.json(formattedReminders);
  } catch (error) {
    console.error('Error fetching reminders:', error);
    res.status(500).json({ error: 'Failed to fetch reminders' });
  }
});

/**
 * @swagger
 * /api/reminders/{id}:
 *   get:
 *     summary: 特定リマインダー取得
 *     description: "IDで指定されたリマインダーの詳細を取得"
 *     tags: [Reminders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: "リマインダーID"
 *     responses:
 *       200:
 *         description: "リマインダー詳細"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reminder'
 *       404:
 *         description: "リマインダーが見つからない"
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
// 特定リマインダー取得
router.get('/:id', async (req, res) => {
  try {
    const reminder = await reminderStorage.getReminderById(req.params.id);
    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }
    
    // 日付フィールドを指定フォーマットに変換
    const formattedReminder = formatReminderDates(reminder);
    
    res.json(formattedReminder);
  } catch (error) {
    console.error('Error fetching reminder:', error);
    res.status(500).json({ error: 'Failed to fetch reminder' });
  }
});

/**
 * @swagger
 * /api/reminders:
 *   post:
 *     summary: 新規リマインダー作成
 *     description: "新しいリマインダーを作成し、通知をスケジュール"
 *     tags: [Reminders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - notificationDateTime
 *             properties:
 *               title:
 *                 type: string
 *                 description: "リマインダータイトル"
 *                 example: "会議の準備"
 *               message:
 *                 type: string
 *                 description: "メッセージ内容"
 *                 example: "明日の会議資料を確認してください"
 *               url:
 *                 type: string
 *                 format: uri
 *                 description: "関連URL（Webhook通知ではクエリパラメータとして送信、Email通知では本文末尾に記載）"
 *                 example: "https://example.com/meeting-details"
 *               notificationDateTime:
 *                 type: string
 *                 format: date-time
 *                 description: "通知日時（ISO 8601形式）"
 *                 example: "2025-08-15T09:00:00.000Z"
 *               notificationMethod:
 *                 type: string
 *                 enum: [webhook, email]
 *                 description: "通知手段（デフォルト: webhook）"
 *                 example: "webhook"
 *               category:
 *                 type: string
 *                 description: "カテゴリ"
 *                 example: "work"
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: "タグ配列"
 *                 example: ["important", "meeting"]
 *               repeatSettings:
 *                 type: object
 *                 properties:
 *                   interval:
 *                     type: string
 *                     enum: [daily, weekly, monthly, yearly]
 *                     description: "繰り返し間隔"
 *                   endDate:
 *                     type: string
 *                     format: date-time
 *                     description: "繰り返し終了日"
 *                   maxOccurrences:
 *                     type: integer
 *                     description: "最大繰り返し回数"
 *     responses:
 *       201:
 *         description: "リマインダー作成成功"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reminder'
 *       400:
 *         description: "バリデーションエラー"
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
// 新規リマインダー作成
router.post('/', async (req, res) => {
  try {
    const { title, message, url, notificationDateTime, notificationMethod, category, tags, repeatSettings } = req.body;

    // バリデーション
    if (!title || title.trim() === '') {
      return res.status(400).json({
        error: 'Title is required'
      });
    }

    if (!notificationDateTime) {
      return res.status(400).json({
        error: 'Notification date time is required'
      });
    }

    // 通知日時の検証
    let notificationDate;
    try {
      notificationDate = parseFlexibleDate(notificationDateTime);
    } catch (error) {
      return res.status(400).json({
        error: 'Invalid notification date time format. Expected format: "YYYY/M/D HH:MM" or ISO 8601'
      });
    }

    // 通知日時が過去の場合は警告
    if (notificationDate <= new Date()) {
      return res.status(400).json({
        error: 'Notification date time must be in the future'
      });
    }

    // 通知手段の検証
    const validMethods = ['webhook', 'email'];
    if (notificationMethod && !validMethods.includes(notificationMethod)) {
      return res.status(400).json({
        error: 'Notification method must be one of: webhook, email'
      });
    }

    // 繰り返し設定の検証
    if (repeatSettings) {
      const validIntervals = ['daily', 'weekly', 'monthly', 'yearly'];
      if (repeatSettings.interval && !validIntervals.includes(repeatSettings.interval)) {
        return res.status(400).json({
          error: 'Repeat interval must be one of: daily, weekly, monthly, yearly'
        });
      }

      if (repeatSettings.endDate) {
        let endDate;
        try {
          endDate = parseFlexibleDate(repeatSettings.endDate);
        } catch (error) {
          return res.status(400).json({
            error: 'Invalid repeat end date format. Expected format: "YYYY/M/D HH:MM" or ISO 8601'
          });
        }
        if (endDate <= notificationDate) {
          return res.status(400).json({
            error: 'Repeat end date must be after notification date'
          });
        }
      }
    }

    const newReminder = await reminderStorage.addReminder({ 
      title: title.trim(), 
      message, 
      url: url || '',
      notificationDateTime: notificationDate.toISOString(), // 内部ではISO形式で保存
      notificationMethod: notificationMethod || 'webhook',
      category,
      tags: Array.isArray(tags) ? tags : [],
      repeatSettings: repeatSettings ? {
        ...repeatSettings,
        currentOccurrence: 1,
        endDate: repeatSettings.endDate ? parseFlexibleDate(repeatSettings.endDate).toISOString() : null
      } : null
    });

    // スケジュールに追加
    await notificationService.scheduleReminder(newReminder);

    // レスポンスでは指定フォーマットで返す
    const formattedReminder = formatReminderDates(newReminder);
    res.status(201).json(formattedReminder);
  } catch (error) {
    console.error('Error creating reminder:', error);
    res.status(500).json({ error: 'Failed to create reminder' });
  }
});

/**
 * @swagger
 * /api/reminders/{id}:
 *   put:
 *     summary: リマインダー更新
 *     description: "既存のリマインダーを更新"
 *     tags: [Reminders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: "リマインダーID"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: "リマインダータイトル"
 *               message:
 *                 type: string
 *                 description: "メッセージ内容"
 *               url:
 *                 type: string
 *                 format: uri
 *                 description: "関連URL"
 *               notificationDateTime:
 *                 type: string
 *                 format: date-time
 *                 description: "通知日時"
 *               notificationMethod:
 *                 type: string
 *                 enum: [webhook, email]
 *                 description: "通知手段"
 *               notificationStatus:
 *                 type: string
 *                 enum: [pending, sent]
 *                 description: "通知状態"
 *               category:
 *                 type: string
 *                 description: "カテゴリ"
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: "タグ配列"
 *               repeatSettings:
 *                 type: object
 *                 properties:
 *                   interval:
 *                     type: string
 *                     enum: [daily, weekly, monthly, yearly]
 *                   endDate:
 *                     type: string
 *                     format: date-time
 *                   maxOccurrences:
 *                     type: integer
 *     responses:
 *       200:
 *         description: "リマインダー更新成功"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reminder'
 *       400:
 *         description: "バリデーションエラー"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: "リマインダーが見つからない"
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
// リマインダー更新
router.put('/:id', async (req, res) => {
  try {
    const { title, message, url, notificationDateTime, notificationMethod, notificationStatus, category, tags, repeatSettings } = req.body;

    // 既存リマインダーの確認
    const existingReminder = await reminderStorage.getReminderById(req.params.id);
    if (!existingReminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    // バリデーション
    if (title !== undefined && (!title || title.trim() === '')) {
      return res.status(400).json({
        error: 'Title cannot be empty'
      });
    }

    if (notificationDateTime) {
      let notificationDate;
      try {
        notificationDate = parseFlexibleDate(notificationDateTime);
      } catch (error) {
        return res.status(400).json({
          error: 'Invalid notification date time format. Expected format: "YYYY/M/D HH:MM" or ISO 8601'
        });
      }
    }

    if (notificationMethod) {
      const validMethods = ['webhook', 'email'];
      if (!validMethods.includes(notificationMethod)) {
        return res.status(400).json({
          error: 'Notification method must be one of: webhook, email'
        });
      }
    }

    if (notificationStatus) {
      const validStatuses = ['pending', 'sent'];
      if (!validStatuses.includes(notificationStatus)) {
        return res.status(400).json({
          error: 'Notification status must be one of: pending, sent'
        });
      }
    }

    const updateData = {
      ...(title !== undefined && { title: title.trim() }),
      ...(message !== undefined && { message }),
      ...(url !== undefined && { url }),
      ...(notificationDateTime !== undefined && { notificationDateTime: parseFlexibleDate(notificationDateTime).toISOString() }),
      ...(notificationMethod !== undefined && { notificationMethod }),
      ...(notificationStatus !== undefined && { notificationStatus }),
      ...(category !== undefined && { category }),
      ...(tags !== undefined && { tags: Array.isArray(tags) ? tags : [] }),
      ...(repeatSettings !== undefined && { repeatSettings })
    };

    const updatedReminder = await reminderStorage.updateReminder(req.params.id, updateData);

    // 通知日時やステータスが変更された場合はスケジュールを再設定
    if (notificationDateTime || notificationStatus) {
      if (updatedReminder.notificationStatus === 'pending') {
        await notificationService.rescheduleReminder(updatedReminder);
      } else {
        notificationService.cancelReminder(updatedReminder.id);
      }
    }

    // レスポンスでは指定フォーマットで返す
    const formattedReminder = formatReminderDates(updatedReminder);
    res.json(formattedReminder);
  } catch (error) {
    console.error('Error updating reminder:', error);
    res.status(500).json({ error: 'Failed to update reminder' });
  }
});

/**
 * @swagger
 * /api/reminders/{id}:
 *   delete:
 *     summary: リマインダー削除
 *     description: "指定されたリマインダーを削除し、スケジュールもキャンセル"
 *     tags: [Reminders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: "リマインダーID"
 *     responses:
 *       200:
 *         description: "削除成功"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Reminder deleted successfully"
 *       404:
 *         description: "リマインダーが見つからない"
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
// リマインダー削除
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await reminderStorage.deleteReminder(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    // スケジュールもキャンセル
    notificationService.cancelReminder(parseInt(req.params.id));

    res.json({ message: 'Reminder deleted successfully' });
  } catch (error) {
    console.error('Error deleting reminder:', error);
    res.status(500).json({ error: 'Failed to delete reminder' });
  }
});

/**
 * @swagger
 * /api/reminders/meta/stats:
 *   get:
 *     summary: リマインダー統計情報
 *     description: "リマインダーの統計情報を取得"
 *     tags: [Reminders]
 *     responses:
 *       200:
 *         description: "統計情報"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   description: "総リマインダー数"
 *                 pending:
 *                   type: integer
 *                   description: "未通知リマインダー数"
 *                 sent:
 *                   type: integer
 *                   description: "通知済みリマインダー数"
 *                 notificationMethods:
 *                   type: object
 *                   properties:
 *                     webhook:
 *                       type: integer
 *                     email:
 *                       type: integer
 *                 scheduledJobs:
 *                   type: integer
 *                   description: "現在スケジュールされているジョブ数"
 *       500:
 *         description: "サーバーエラー"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// リマインダー統計情報
router.get('/meta/stats', async (req, res) => {
  try {
    const stats = await reminderStorage.getStats();
    const scheduledJobs = notificationService.getScheduledJobsCount();
    
    res.json({
      ...stats,
      scheduledJobs
    });
  } catch (error) {
    console.error('Error fetching reminder stats:', error);
    res.status(500).json({ error: 'Failed to fetch reminder stats' });
  }
});

/**
 * @swagger
 * /api/reminders/meta/categories:
 *   get:
 *     summary: カテゴリ一覧取得
 *     description: "すべてのリマインダーのカテゴリ一覧を取得"
 *     tags: [Reminders]
 *     responses:
 *       200:
 *         description: "カテゴリ一覧"
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *               example: ["work", "personal", "health", "meeting"]
 *       500:
 *         description: "サーバーエラー"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// カテゴリ一覧取得
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = await reminderStorage.getCategories();
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

/**
 * @swagger
 * /api/reminders/meta/tags:
 *   get:
 *     summary: タグ一覧取得
 *     description: "すべてのリマインダーのタグ一覧を取得"
 *     tags: [Reminders]
 *     responses:
 *       200:
 *         description: "タグ一覧"
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *               example: ["important", "urgent", "meeting", "health"]
 *       500:
 *         description: "サーバーエラー"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// タグ一覧取得
router.get('/meta/tags', async (req, res) => {
  try {
    const tags = await reminderStorage.getTags();
    res.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

/**
 * @swagger
 * /api/reminders/test/{method}:
 *   post:
 *     summary: 通知テスト
 *     description: "指定された通知手段でテスト通知を送信"
 *     tags: [Reminders]
 *     parameters:
 *       - in: path
 *         name: method
 *         required: true
 *         schema:
 *           type: string
 *           enum: [webhook, email]
 *         description: "テストする通知手段"
 *     responses:
 *       200:
 *         description: "テスト成功"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: "無効な通知手段"
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
// 通知テスト
router.post('/test/:method', async (req, res) => {
  try {
    const { method } = req.params;
    
    const validMethods = ['webhook', 'email'];
    if (!validMethods.includes(method)) {
      return res.status(400).json({
        error: 'Invalid notification method. Must be webhook or email'
      });
    }

    const success = await notificationService.testNotification(method);
    
    res.json({
      success,
      message: success 
        ? `Test ${method} notification sent successfully`
        : `Failed to send test ${method} notification`
    });
  } catch (error) {
    console.error('Error testing notification:', error);
    res.status(500).json({ error: 'Failed to test notification' });
  }
});

module.exports = router;