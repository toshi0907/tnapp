const request = require('supertest');
const express = require('express');

// テスト用のサーバーアプリケーションを作成
const app = express();
app.use(express.json());

// テスト用のストレージモジュールをモック
jest.mock('../src/database/todoStorage', () => {
  return {
    getTodos: jest.fn(),
    getTodoById: jest.fn(),
    addTodo: jest.fn(),
    updateTodo: jest.fn(),
    deleteTodo: jest.fn(),
    getTodosByStatus: jest.fn(),
    getTodosByPriority: jest.fn(),
    getTodosByCategory: jest.fn(),
    getTodosByTag: jest.fn(),
    searchTodos: jest.fn(),
    getOverdueTodos: jest.fn(),
    getTodosWithDueDate: jest.fn(),
    getCategories: jest.fn(),
    getTags: jest.fn(),
    getStats: jest.fn()
  };
});

const todoStorage = require('../src/database/todoStorage');
const todoRouter = require('../src/routes/todos');

// ルーターをアプリにマウント
app.use('/api/todos', todoRouter);

describe('Todos API', () => {
  // テストデータ
  const sampleTodos = [
    {
      id: 1,
      title: 'テストTODO1',
      description: 'テスト用のTODOです',
      completed: false,
      priority: 'high',
      category: 'development',
      tags: ['test', 'sample'],
      dueDate: '2025-12-31T23:59:59.000Z',
      createdAt: '2025-08-03T12:00:00.000Z',
      updatedAt: '2025-08-03T12:00:00.000Z',
      completedAt: null
    },
    {
      id: 2,
      title: 'テストTODO2',
      description: '完了済みのテストTODO',
      completed: true,
      priority: 'medium',
      category: 'documentation',
      tags: ['docs'],
      dueDate: null,
      createdAt: '2025-08-03T11:00:00.000Z',
      updatedAt: '2025-08-03T13:00:00.000Z',
      completedAt: '2025-08-03T13:00:00.000Z'
    }
  ];

  beforeEach(() => {
    // 各テスト前にモックをリセット
    jest.clearAllMocks();
  });

  describe('GET /api/todos', () => {
    it('全TODO一覧を取得できる', async () => {
      todoStorage.getTodos.mockResolvedValue(sampleTodos);

      const response = await request(app)
        .get('/api/todos')
        .expect(200);

      expect(response.body).toEqual(sampleTodos);
      expect(todoStorage.getTodos).toHaveBeenCalledWith();
    });

    it('完了状態でフィルタリングできる', async () => {
      const completedTodos = sampleTodos.filter(todo => todo.completed);
      todoStorage.getTodosByStatus.mockResolvedValue(completedTodos);

      const response = await request(app)
        .get('/api/todos?status=completed')
        .expect(200);

      expect(response.body).toEqual(completedTodos);
      expect(todoStorage.getTodosByStatus).toHaveBeenCalledWith(true);
    });

    it('未完了状態でフィルタリングできる', async () => {
      const pendingTodos = sampleTodos.filter(todo => !todo.completed);
      todoStorage.getTodosByStatus.mockResolvedValue(pendingTodos);

      const response = await request(app)
        .get('/api/todos?status=pending')
        .expect(200);

      expect(response.body).toEqual(pendingTodos);
      expect(todoStorage.getTodosByStatus).toHaveBeenCalledWith(false);
    });

    it('優先度でフィルタリングできる', async () => {
      const highPriorityTodos = sampleTodos.filter(todo => todo.priority === 'high');
      todoStorage.getTodosByPriority.mockResolvedValue(highPriorityTodos);

      const response = await request(app)
        .get('/api/todos?priority=high')
        .expect(200);

      expect(response.body).toEqual(highPriorityTodos);
      expect(todoStorage.getTodosByPriority).toHaveBeenCalledWith('high');
    });

    it('カテゴリでフィルタリングできる', async () => {
      const categoryTodos = sampleTodos.filter(todo => todo.category === 'development');
      todoStorage.getTodosByCategory.mockResolvedValue(categoryTodos);

      const response = await request(app)
        .get('/api/todos?category=development')
        .expect(200);

      expect(response.body).toEqual(categoryTodos);
      expect(todoStorage.getTodosByCategory).toHaveBeenCalledWith('development');
    });

    it('検索機能が動作する', async () => {
      const searchResults = [sampleTodos[0]];
      todoStorage.searchTodos.mockResolvedValue(searchResults);

      const response = await request(app)
        .get('/api/todos')
        .query({ search: 'テスト' })
        .expect(200);

      expect(response.body).toEqual(searchResults);
      expect(todoStorage.searchTodos).toHaveBeenCalledWith('テスト');
    });

    it('データベースエラー時に500エラーを返す', async () => {
      todoStorage.getTodos.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/todos')
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to fetch todos' });
    });
  });

  describe('GET /api/todos/:id', () => {
    it('特定のTODOを取得できる', async () => {
      todoStorage.getTodoById.mockResolvedValue(sampleTodos[0]);

      const response = await request(app)
        .get('/api/todos/1')
        .expect(200);

      expect(response.body).toEqual(sampleTodos[0]);
      expect(todoStorage.getTodoById).toHaveBeenCalledWith('1');
    });

    it('存在しないTODOの場合404エラーを返す', async () => {
      todoStorage.getTodoById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/todos/999')
        .expect(404);

      expect(response.body).toEqual({ error: 'Todo not found' });
    });

    it('データベースエラー時に500エラーを返す', async () => {
      todoStorage.getTodoById.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/todos/1')
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to fetch todo' });
    });
  });

  describe('POST /api/todos', () => {
    const newTodo = {
      title: '新しいTODO',
      description: '新規作成されたTODO',
      priority: 'high',
      category: 'development',
      tags: ['new', 'test']
    };

    it('新しいTODOを作成できる', async () => {
      const createdTodo = { id: 3, ...newTodo, completed: false, createdAt: '2025-08-03T14:00:00.000Z' };
      todoStorage.addTodo.mockResolvedValue(createdTodo);

      const response = await request(app)
        .post('/api/todos')
        .send(newTodo)
        .expect(201);

      expect(response.body).toEqual(createdTodo);
      expect(todoStorage.addTodo).toHaveBeenCalledWith(newTodo);
    });

    it('タイトルが空の場合400エラーを返す', async () => {
      const invalidTodo = { ...newTodo, title: '' };

      const response = await request(app)
        .post('/api/todos')
        .send(invalidTodo)
        .expect(400);

      expect(response.body).toEqual({ error: 'Title is required' });
      expect(todoStorage.addTodo).not.toHaveBeenCalled();
    });

    it('無効な優先度の場合400エラーを返す', async () => {
      const invalidTodo = { ...newTodo, priority: 'invalid' };

      const response = await request(app)
        .post('/api/todos')
        .send(invalidTodo)
        .expect(400);

      expect(response.body).toEqual({ error: 'Priority must be one of: low, medium, high' });
      expect(todoStorage.addTodo).not.toHaveBeenCalled();
    });

    it('無効な期限日の場合400エラーを返す', async () => {
      const invalidTodo = { ...newTodo, dueDate: 'invalid-date' };

      const response = await request(app)
        .post('/api/todos')
        .send(invalidTodo)
        .expect(400);

      expect(response.body).toEqual({ error: 'Invalid due date format' });
      expect(todoStorage.addTodo).not.toHaveBeenCalled();
    });

    it('データベースエラー時に500エラーを返す', async () => {
      todoStorage.addTodo.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/todos')
        .send(newTodo)
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to create todo' });
    });
  });

  describe('PUT /api/todos/:id', () => {
    const updateData = {
      title: '更新されたTODO',
      description: '更新されたテストTODO',
      completed: true,
      priority: 'low'
    };

    it('TODOを更新できる', async () => {
      const updatedTodo = { ...sampleTodos[0], ...updateData };
      todoStorage.updateTodo.mockResolvedValue(updatedTodo);

      const response = await request(app)
        .put('/api/todos/1')
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual(updatedTodo);
      expect(todoStorage.updateTodo).toHaveBeenCalledWith('1', expect.objectContaining(updateData));
    });

    it('存在しないTODOの場合404エラーを返す', async () => {
      todoStorage.updateTodo.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/todos/999')
        .send(updateData)
        .expect(404);

      expect(response.body).toEqual({ error: 'Todo not found' });
    });

    it('無効なタイトルの場合400エラーを返す', async () => {
      const invalidData = { ...updateData, title: '' };

      const response = await request(app)
        .put('/api/todos/1')
        .send(invalidData)
        .expect(400);

      expect(response.body).toEqual({ error: 'Title must be a non-empty string' });
      expect(todoStorage.updateTodo).not.toHaveBeenCalled();
    });

    it('データベースエラー時に500エラーを返す', async () => {
      todoStorage.updateTodo.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .put('/api/todos/1')
        .send(updateData)
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to update todo' });
    });
  });

  describe('DELETE /api/todos/:id', () => {
    it('TODOを削除できる', async () => {
      todoStorage.deleteTodo.mockResolvedValue(true);

      await request(app)
        .delete('/api/todos/1')
        .expect(204);

      expect(todoStorage.deleteTodo).toHaveBeenCalledWith('1');
    });

    it('存在しないTODOの場合404エラーを返す', async () => {
      todoStorage.deleteTodo.mockResolvedValue(false);

      const response = await request(app)
        .delete('/api/todos/999')
        .expect(404);

      expect(response.body).toEqual({ error: 'Todo not found' });
    });

    it('データベースエラー時に500エラーを返す', async () => {
      todoStorage.deleteTodo.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .delete('/api/todos/1')
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to delete todo' });
    });
  });

  describe('PATCH /api/todos/:id/toggle', () => {
    it('未完了のTODOを完了状態に切り替えられる', async () => {
      const incompleteTodo = { ...sampleTodos[0], completed: false };
      const completedTodo = { ...incompleteTodo, completed: true };
      
      todoStorage.getTodoById.mockResolvedValue(incompleteTodo);
      todoStorage.updateTodo.mockResolvedValue(completedTodo);

      const response = await request(app)
        .patch('/api/todos/1/toggle')
        .expect(200);

      expect(response.body).toEqual(completedTodo);
      expect(todoStorage.getTodoById).toHaveBeenCalledWith('1');
      expect(todoStorage.updateTodo).toHaveBeenCalledWith('1', { completed: true });
    });

    it('完了済みのTODOを未完了状態に切り替えられる', async () => {
      const completedTodo = { ...sampleTodos[1], completed: true };
      const incompleteTodo = { ...completedTodo, completed: false };
      
      todoStorage.getTodoById.mockResolvedValue(completedTodo);
      todoStorage.updateTodo.mockResolvedValue(incompleteTodo);

      const response = await request(app)
        .patch('/api/todos/2/toggle')
        .expect(200);

      expect(response.body).toEqual(incompleteTodo);
      expect(todoStorage.getTodoById).toHaveBeenCalledWith('2');
      expect(todoStorage.updateTodo).toHaveBeenCalledWith('2', { completed: false });
    });

    it('存在しないTODOの場合404エラーを返す', async () => {
      todoStorage.getTodoById.mockResolvedValue(null);

      const response = await request(app)
        .patch('/api/todos/999/toggle')
        .expect(404);

      expect(response.body).toEqual({ error: 'Todo not found' });
      expect(todoStorage.updateTodo).not.toHaveBeenCalled();
    });

    it('データベースエラー時に500エラーを返す', async () => {
      todoStorage.getTodoById.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .patch('/api/todos/1/toggle')
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to toggle todo' });
    });
  });

  describe('GET /api/todos/meta/categories', () => {
    it('カテゴリ一覧を取得できる', async () => {
      const categories = ['development', 'documentation', 'testing'];
      todoStorage.getCategories.mockResolvedValue(categories);

      const response = await request(app)
        .get('/api/todos/meta/categories')
        .expect(200);

      expect(response.body).toEqual(categories);
      expect(todoStorage.getCategories).toHaveBeenCalledWith();
    });

    it('データベースエラー時に500エラーを返す', async () => {
      todoStorage.getCategories.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/todos/meta/categories')
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to fetch categories' });
    });
  });

  describe('GET /api/todos/meta/tags', () => {
    it('タグ一覧を取得できる', async () => {
      const tags = ['test', 'sample', 'docs', 'new'];
      todoStorage.getTags.mockResolvedValue(tags);

      const response = await request(app)
        .get('/api/todos/meta/tags')
        .expect(200);

      expect(response.body).toEqual(tags);
      expect(todoStorage.getTags).toHaveBeenCalledWith();
    });

    it('データベースエラー時に500エラーを返す', async () => {
      todoStorage.getTags.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/todos/meta/tags')
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to fetch tags' });
    });
  });

  describe('GET /api/todos/meta/stats', () => {
    it('統計情報を取得できる', async () => {
      const stats = {
        total: 10,
        completed: 3,
        pending: 7,
        overdue: 2
      };
      const categories = ['development', 'documentation'];
      const tags = ['test', 'sample'];

      todoStorage.getStats.mockResolvedValue(stats);
      todoStorage.getCategories.mockResolvedValue(categories);
      todoStorage.getTags.mockResolvedValue(tags);

      const response = await request(app)
        .get('/api/todos/meta/stats')
        .expect(200);

      expect(response.body).toEqual({
        ...stats,
        totalCategories: 2,
        totalTags: 2,
        categories,
        tags
      });
    });

    it('データベースエラー時に500エラーを返す', async () => {
      todoStorage.getStats.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/todos/meta/stats')
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to fetch todo statistics' });
    });
  });
});