const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const basicAuth = require('express-basic-auth');
const { specs, swaggerUi, swaggerUiOptions } = require('./config/swagger');
const bookmarkRouter = require('./routes/bookmarks');
const todoRouter = require('./routes/todos');
const path = require('path');
require('dotenv').config();

function createApp() {
  const app = express();
  const BASIC_AUTH_ENABLED = (process.env.BASIC_AUTH_ENABLED ?? 'true').toLowerCase() === 'true';

  // Swagger (認証不要)
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerUiOptions));

  // Basic認証（オプション）
  if (BASIC_AUTH_ENABLED) {
    app.use(basicAuth({
      users: { [process.env.AUTH_USER || 'admin']: process.env.AUTH_PASSWORD || 'password123' },
      challenge: true,
      realm: 'Private Area - Totos App',
      unauthorizedResponse: () => ({
        error: 'Unauthorized',
        message: 'Valid credentials required to access this application'
      })
    }));
  }

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // ヘルスチェック
  const bookmarkStorage = require('./database/bookmarkStorage');
  const todoStorage = require('./database/todoStorage');
  app.get('/health', async (req, res) => {
    try {
      const bookmarkCount = await bookmarkStorage.getBookmarkCount();
      const todoCount = await todoStorage.getTodoCount();
      const completedTodos = await todoStorage.getCompletedCount();
      const pendingTodos = await todoStorage.getPendingCount();
      res.status(200).json({
        status: 'OK',
        message: 'API Server is running',
        database: 'JSON File Storage',
        bookmarkCount, todoCount, completedTodos, pendingTodos,
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

  // 静的ファイル配信
  const publicDir = path.join(__dirname, '..', 'public');
  app.use('/public', express.static(publicDir));

  // ルーター
  app.use('/api/bookmarks', bookmarkRouter);
  app.use('/api/todos', todoRouter);

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