const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { specs, swaggerUi, swaggerUiOptions } = require('./config/swagger');
const bookmarkRouter = require('./routes/bookmarks');
const todoRouter = require('./routes/todos');
const reminderRouter = require('./routes/reminders');
const path = require('path');
require('dotenv').config();

function createApp() {
  const app = express();

  // Swagger
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerUiOptions));

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // ヘルスチェック
  const bookmarkStorage = require('./database/bookmarkStorage');
  const todoStorage = require('./database/todoStorage');
  const reminderStorage = require('./database/reminderStorage');
  app.get('/health', async (req, res) => {
    try {
      const bookmarkCount = await bookmarkStorage.getBookmarkCount();
      const todoCount = await todoStorage.getTodoCount();
      const completedTodos = await todoStorage.getCompletedCount();
      const pendingTodos = await todoStorage.getPendingCount();
      const reminderCount = await reminderStorage.getReminderCount();
      const pendingReminders = await reminderStorage.getPendingCount();
      const sentReminders = await reminderStorage.getSentCount();
      res.status(200).json({
        status: 'OK',
        message: 'API Server is running',
        database: 'JSON File Storage',
        bookmarkCount, todoCount, completedTodos, pendingTodos,
        reminderCount, pendingReminders, sentReminders,
        timestamp: new Date().toISOString()
      });
    } catch {
      res.status(200).json({
        status: 'OK',
        message: 'API Server is running',
        database: 'JSON File Storage',
        warning: 'Could not access database',
        timestamp: new Date().toISOString()
      });
    }
  });

  // 設定情報エンドポイント
  app.get('/config', (req, res) => {
    res.json({
      port: process.env.PORT || 3000
    });
  });

  // 静的ファイル配信
  const publicDir = path.join(__dirname, '..', 'public');
  app.use('/public', express.static(publicDir));
  
  // フロントエンドページのルーティング
  app.get('/bookmark', (req, res) => {
    res.sendFile(path.join(publicDir, 'bookmark', 'index.html'));
  });
  
  app.get('/todo', (req, res) => {
    res.sendFile(path.join(publicDir, 'todo', 'index.html'));
  });
  
  app.get('/reminder', (req, res) => {
    res.sendFile(path.join(publicDir, 'reminder', 'index.html'));
  });

  // ルーター
  app.use('/api/bookmarks', bookmarkRouter);
  app.use('/api/todos', todoRouter);
  app.use('/api/reminders', reminderRouter);

  // 404
  app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });

  // エラーハンドラー
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
  });

  return app;
}

module.exports = { createApp };