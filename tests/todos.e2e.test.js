const request = require('supertest');
const path = require('path');
const fs = require('fs').promises;
const { createTestDataDir, cleanupTestFiles } = require('./helpers/testHelpers');

// 実際のサーバーアプリケーションを使用したE2Eテスト
describe('Todos API - E2E Tests', () => {
  let app;
  let testDataDir;
  let originalTodosFile;
  let backupTodosFile;

  beforeAll(async () => {
    // テスト用データディレクトリ作成
    testDataDir = await createTestDataDir();
    
    // 実際のTODOファイルのバックアップ
    const dataDir = path.join(__dirname, '..', 'data');
    originalTodosFile = path.join(dataDir, 'todos.json');
    backupTodosFile = path.join(dataDir, 'todos.backup.json');
    
    try {
      const originalData = await fs.readFile(originalTodosFile, 'utf8');
      await fs.writeFile(backupTodosFile, originalData);
    } catch (error) {
      // ファイルが存在しない場合は無視
      console.warn('Original todos file not found, creating new one');
    }

    // テスト用の初期データを設定
    const testTodos = [
      {
        id: 1,
        title: 'E2E テストTODO1',
        description: 'E2Eテスト用のTODO',
        completed: false,
        priority: 'high',
        category: 'testing',
        tags: ['e2e', 'test'],
        dueDate: '2025-12-31T23:59:59.000Z',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: null
      },
      {
        id: 2,
        title: 'E2E テストTODO2 完了済み',
        description: '完了済みのE2Eテスト用TODO',
        completed: true,
        priority: 'medium',
        category: 'documentation',
        tags: ['docs'],
        dueDate: null,
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1日前
        updatedAt: new Date().toISOString(),
        completedAt: new Date().toISOString()
      }
    ];
    
    await fs.writeFile(originalTodosFile, JSON.stringify(testTodos, null, 2));

    // テスト用環境変数を設定
    process.env.NODE_ENV = 'test';
    process.env.PORT = '3002';
    
    // Basic認証をバイパスするミドルウェアを作成
    const express = require('express');
    const cors = require('cors');
    const helmet = require('helmet');
    const todoRouter = require('../src/routes/todos');
    
    app = express();
    app.use(helmet());
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    // 認証なしでAPIにアクセス可能
    app.use('/api/todos', todoRouter);
  });

  afterAll(async () => {
    // バックアップファイルから復元
    try {
      const backupData = await fs.readFile(backupTodosFile, 'utf8');
      await fs.writeFile(originalTodosFile, backupData);
      await fs.unlink(backupTodosFile);
    } catch (error) {
      // バックアップファイルが存在しない場合は元のファイルを削除
      try {
        await fs.unlink(originalTodosFile);
      } catch (e) {
        // ファイルが存在しない場合は無視
      }
    }

    // テスト用ファイルをクリーンアップ
    await cleanupTestFiles(testDataDir);
  });

  describe('完全なワークフロー', () => {
    it('新しいTODOを作成 → 取得 → 更新 → 削除のフローが正常に動作する', async () => {
      // Step 1: 新しいTODOを作成
      const newTodo = {
        title: 'E2E フローテストTODO',
        description: 'フローテスト用のTODO',
        priority: 'high',
        category: 'testing',
        tags: ['e2e', 'flow', 'test'],
        dueDate: '2025-12-31T23:59:59.000Z'
      };

      const createResponse = await request(app)
        .post('/api/todos')
        .send(newTodo)
        .expect(201);

      expect(createResponse.body).toMatchObject({
        title: newTodo.title,
        description: newTodo.description,
        completed: false,
        priority: newTodo.priority,
        category: newTodo.category,
        tags: newTodo.tags,
        dueDate: newTodo.dueDate
      });
      expect(createResponse.body).toHaveProperty('id');
      expect(createResponse.body).toHaveProperty('createdAt');
      expect(createResponse.body).toHaveProperty('updatedAt');

      const createdTodoId = createResponse.body.id;

      // Step 2: 作成されたTODOを取得
      const getResponse = await request(app)
        .get(`/api/todos/${createdTodoId}`)
        .expect(200);

      expect(getResponse.body).toEqual(createResponse.body);

      // Step 3: TODOを更新
      const updateData = {
        title: '更新されたE2E フローテストTODO',
        description: '更新されたフローテスト用のTODO',
        completed: true,
        priority: 'low'
      };

      const updateResponse = await request(app)
        .put(`/api/todos/${createdTodoId}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body).toMatchObject({
        id: createdTodoId,
        title: updateData.title,
        description: updateData.description,
        completed: updateData.completed,
        priority: updateData.priority,
        category: newTodo.category, // 元のカテゴリが保持される
        tags: newTodo.tags
      });
      expect(updateResponse.body.updatedAt).not.toEqual(createResponse.body.updatedAt);
      expect(updateResponse.body).toHaveProperty('completedAt');

      // Step 4: TODOを削除
      await request(app)
        .delete(`/api/todos/${createdTodoId}`)
        .expect(204);

      // Step 5: 削除されたことを確認
      await request(app)
        .get(`/api/todos/${createdTodoId}`)
        .expect(404);
    });

    it('TODO完了状態切り替え機能が正常に動作する', async () => {
      // 最初に未完了のTODOを作成
      const newTodo = {
        title: 'Toggle テストTODO',
        description: 'Toggle機能のテスト用TODO',
        priority: 'medium',
        category: 'testing'
      };

      const createResponse = await request(app)
        .post('/api/todos')
        .send(newTodo)
        .expect(201);

      const todoId = createResponse.body.id;
      
      // 最初は未完了であることを確認
      expect(createResponse.body.completed).toBe(false);
      expect(createResponse.body.completedAt).toBeNull();

      // Step 1: 未完了 → 完了に切り替え
      const toggleResponse1 = await request(app)
        .patch(`/api/todos/${todoId}/toggle`)
        .expect(200);

      expect(toggleResponse1.body.completed).toBe(true);
      expect(toggleResponse1.body).toHaveProperty('completedAt');
      expect(toggleResponse1.body.completedAt).not.toBeNull();

      // Step 2: 完了 → 未完了に切り替え
      const toggleResponse2 = await request(app)
        .patch(`/api/todos/${todoId}/toggle`)
        .expect(200);

      expect(toggleResponse2.body.completed).toBe(false);
      expect(toggleResponse2.body.completedAt).toBeNull();

      // Step 3: 再度未完了 → 完了に切り替え
      const toggleResponse3 = await request(app)
        .patch(`/api/todos/${todoId}/toggle`)
        .expect(200);

      expect(toggleResponse3.body.completed).toBe(true);
      expect(toggleResponse3.body).toHaveProperty('completedAt');
      expect(toggleResponse3.body.completedAt).not.toBeNull();

      // 作成したTODOをクリーンアップ
      await request(app)
        .delete(`/api/todos/${todoId}`)
        .expect(204);
    });

    it('検索とフィルタリング機能が正常に動作する', async () => {
      // テスト用TODO一覧を取得
      const listResponse = await request(app)
        .get('/api/todos')
        .expect(200);

      expect(Array.isArray(listResponse.body)).toBe(true);
      expect(listResponse.body.length).toBeGreaterThan(0);

      // 完了状態でフィルタリング
      const completedResponse = await request(app)
        .get('/api/todos?status=completed')
        .expect(200);

      expect(Array.isArray(completedResponse.body)).toBe(true);
      completedResponse.body.forEach(todo => {
        expect(todo.completed).toBe(true);
      });

      // 未完了でフィルタリング
      const pendingResponse = await request(app)
        .get('/api/todos?status=pending')
        .expect(200);

      expect(Array.isArray(pendingResponse.body)).toBe(true);
      pendingResponse.body.forEach(todo => {
        expect(todo.completed).toBe(false);
      });

      // 優先度でフィルタリング
      const highPriorityResponse = await request(app)
        .get('/api/todos?priority=high')
        .expect(200);

      expect(Array.isArray(highPriorityResponse.body)).toBe(true);
      highPriorityResponse.body.forEach(todo => {
        expect(todo.priority).toBe('high');
      });

      // カテゴリでフィルタリング
      const categoryResponse = await request(app)
        .get('/api/todos?category=testing')
        .expect(200);

      expect(Array.isArray(categoryResponse.body)).toBe(true);
      categoryResponse.body.forEach(todo => {
        expect(todo.category).toBe('testing');
      });

      // 検索機能
      const searchResponse = await request(app)
        .get('/api/todos?search=E2E')
        .expect(200);

      expect(Array.isArray(searchResponse.body)).toBe(true);
      searchResponse.body.forEach(todo => {
        expect(
          todo.title.includes('E2E') || 
          todo.description.includes('E2E') ||
          todo.tags.some(tag => tag.includes('E2E'))
        ).toBe(true);
      });
    });

    it('メタデータエンドポイントが正常に動作する', async () => {
      // カテゴリ一覧を取得
      const categoriesResponse = await request(app)
        .get('/api/todos/meta/categories')
        .expect(200);

      expect(Array.isArray(categoriesResponse.body)).toBe(true);
      expect(categoriesResponse.body).toContain('testing');
      expect(categoriesResponse.body).toContain('documentation');

      // タグ一覧を取得
      const tagsResponse = await request(app)
        .get('/api/todos/meta/tags')
        .expect(200);

      expect(Array.isArray(tagsResponse.body)).toBe(true);
      expect(tagsResponse.body).toContain('e2e');
      expect(tagsResponse.body).toContain('test');

      // 統計情報を取得
      const statsResponse = await request(app)
        .get('/api/todos/meta/stats')
        .expect(200);

      expect(statsResponse.body).toHaveProperty('total');
      expect(statsResponse.body).toHaveProperty('completed');
      expect(statsResponse.body).toHaveProperty('pending');
      expect(statsResponse.body).toHaveProperty('totalCategories');
      expect(statsResponse.body).toHaveProperty('totalTags');
      expect(statsResponse.body).toHaveProperty('categories');
      expect(statsResponse.body).toHaveProperty('tags');
      expect(Array.isArray(statsResponse.body.categories)).toBe(true);
      expect(Array.isArray(statsResponse.body.tags)).toBe(true);
    });
  });

  describe('エラーハンドリング', () => {
    it('バリデーションエラーが適切に処理される', async () => {
      // 空のタイトル
      const invalidTodo1 = {
        title: '',
        description: 'テスト'
      };

      await request(app)
        .post('/api/todos')
        .send(invalidTodo1)
        .expect(400)
        .expect(res => {
          expect(res.body).toEqual({ error: 'Title is required' });
        });

      // 無効な優先度
      const invalidTodo2 = {
        title: 'テストTODO',
        priority: 'invalid'
      };

      await request(app)
        .post('/api/todos')
        .send(invalidTodo2)
        .expect(400)
        .expect(res => {
          expect(res.body).toEqual({ error: 'Priority must be one of: low, medium, high' });
        });

      // 無効な期限日
      const invalidTodo3 = {
        title: 'テストTODO',
        dueDate: 'invalid-date'
      };

      await request(app)
        .post('/api/todos')
        .send(invalidTodo3)
        .expect(400)
        .expect(res => {
          expect(res.body).toEqual({ error: 'Invalid due date format' });
        });

      // PUT リクエストでの無効なタイトル
      const invalidUpdate = {
        title: ''
      };

      await request(app)
        .put('/api/todos/1')
        .send(invalidUpdate)
        .expect(400)
        .expect(res => {
          expect(res.body).toEqual({ error: 'Title must be a non-empty string' });
        });
    });

    it('存在しないリソースに対する操作が適切に処理される', async () => {
      const nonExistentId = 99999;

      // 存在しないTODOの取得
      await request(app)
        .get(`/api/todos/${nonExistentId}`)
        .expect(404)
        .expect(res => {
          expect(res.body).toEqual({ error: 'Todo not found' });
        });

      // 存在しないTODOの更新
      const updateData = {
        title: '更新テスト',
        completed: true
      };

      await request(app)
        .put(`/api/todos/${nonExistentId}`)
        .send(updateData)
        .expect(404)
        .expect(res => {
          expect(res.body).toEqual({ error: 'Todo not found' });
        });

      // 存在しないTODOの削除
      await request(app)
        .delete(`/api/todos/${nonExistentId}`)
        .expect(404)
        .expect(res => {
          expect(res.body).toEqual({ error: 'Todo not found' });
        });

      // 存在しないTODOのトグル
      await request(app)
        .patch(`/api/todos/${nonExistentId}/toggle`)
        .expect(404)
        .expect(res => {
          expect(res.body).toEqual({ error: 'Todo not found' });
        });
    });
  });

  describe('期限日とオーバーデュー機能', () => {
    let testTodoWithDueDate;

    beforeAll(async () => {
      // 期限日付きのテストTODOを作成
      const todoWithDueDate = {
        title: '期限日テストTODO',
        description: '期限日機能のテスト',
        priority: 'high',
        dueDate: '2025-01-01T00:00:00.000Z' // 将来の日付
      };

      const response = await request(app)
        .post('/api/todos')
        .send(todoWithDueDate)
        .expect(201);

      testTodoWithDueDate = response.body;
    });

    afterAll(async () => {
      // テスト用TODOをクリーンアップ
      if (testTodoWithDueDate) {
        await request(app)
          .delete(`/api/todos/${testTodoWithDueDate.id}`)
          .expect(204);
      }
    });

    it('期限日があるTODOのフィルタリングが動作する', async () => {
      const response = await request(app)
        .get('/api/todos?dueDate=true')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach(todo => {
        expect(todo.dueDate).not.toBeNull();
      });
    });

    it('オーバーデューTODOのフィルタリングが動作する', async () => {
      const response = await request(app)
        .get('/api/todos?overdue=true')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      // オーバーデューの検証は日付に依存するため、構造のチェックのみ
    });
  });
});