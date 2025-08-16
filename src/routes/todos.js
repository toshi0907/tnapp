const express = require('express');
const todoStorage = require('../database/todoStorage');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Todos
 *   description: "TODO管理API"
 */

/**
 * @swagger
 * /api/todos:
 *   get:
 *     summary: TODO一覧取得
 *     description: "TODO一覧を取得。フィルタリング機能あり"
 *     tags: [Todos]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [completed, pending]
 *         description: "完了状態でフィルタ（completed=完了済み、pending=未完了）"
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *         description: "優先度でフィルタ"
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: "カテゴリでフィルタ"
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *         description: "タグでフィルタ"
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: "検索キーワード（タイトル、説明、タグを対象）"
 *       - in: query
 *         name: overdue
 *         schema:
 *           type: boolean
 *         description: "期限切れのTODOのみ取得"
 *       - in: query
 *         name: dueDate
 *         schema:
 *           type: boolean
 *         description: "期限日があるTODOのみ取得（期限日順でソート）"
 *     responses:
 *       200:
 *         description: "TODO一覧"
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Todo'
 *       500:
 *         description: "サーバーエラー"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     summary: 新規TODO作成
 *     description: "新しいTODOを作成"
 *     tags: [Todos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 description: "TODOタイトル（必須）"
 *                 example: "新しいタスク"
 *               description:
 *                 type: string
 *                 description: "TODOの詳細説明"
 *                 example: "タスクの詳細説明"
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 description: "優先度（デフォルト: medium）"
 *                 example: "high"
 *               category:
 *                 type: string
 *                 description: "カテゴリ"
 *                 example: "development"
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: "タグ配列"
 *                 example: ["urgent", "feature"]
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 description: 期限日（ISO 8601形式）
 *                 example: "2025-08-10T00:00:00.000Z"
 *     responses:
 *       201:
 *         description: "TODO作成成功"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Todo'
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
// TODO一覧取得
router.get('/', async (req, res) => {
  try {
    const { status, priority, category, tag, search, overdue, dueDate } = req.query;
    
    let todos;
    
    if (search) {
      todos = await todoStorage.searchTodos(search);
    } else if (status !== undefined) {
      const completed = status === 'completed';
      todos = await todoStorage.getTodosByStatus(completed);
    } else if (priority) {
      todos = await todoStorage.getTodosByPriority(priority);
    } else if (category) {
      todos = await todoStorage.getTodosByCategory(category);
    } else if (tag) {
      todos = await todoStorage.getTodosByTag(tag);
    } else if (overdue === 'true') {
      todos = await todoStorage.getOverdueTodos();
    } else if (dueDate === 'true') {
      todos = await todoStorage.getTodosWithDueDate();
    } else {
      todos = await todoStorage.getTodos();
    }
    
    res.json(todos);
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

/**
 * @swagger
 * /api/todos/{id}:
 *   get:
 *     summary: 特定TODO取得
 *     description: "指定されたIDのTODO情報を取得"
 *     tags: [Todos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           format: int64
 *         description: "TODO ID"
 *         example: 1722672000000
 *     responses:
 *       200:
 *         description: "TODO情報"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Todo'
 *       404:
 *         description: "TODOが見つからない"
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
 *   put:
 *     summary: TODO更新
 *     description: "指定されたIDのTODO情報を更新"
 *     tags: [Todos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           format: int64
 *         description: "TODO ID"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: "TODOタイトル"
 *               description:
 *                 type: string
 *                 description: "TODOの詳細説明"
 *               completed:
 *                 type: boolean
 *                 description: "完了状態"
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 description: "優先度"
 *               category:
 *                 type: string
 *                 description: "カテゴリ"
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: タグ配列
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 description: "期限日"
 *     responses:
 *       200:
 *         description: "TODO更新成功"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Todo'
 *       400:
 *         description: "バリデーションエラー"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: "TODOが見つからない"
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
 *   delete:
 *     summary: TODO削除
 *     description: "指定されたIDのTODOを削除"
 *     tags: [Todos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           format: int64
 *         description: "TODO ID"
 *     responses:
 *       204:
 *         description: "TODO削除成功"
 *       404:
 *         description: "TODOが見つからない"
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
// 特定TODO取得
router.get('/:id', async (req, res) => {
  try {
    const todo = await todoStorage.getTodoById(req.params.id);
    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    res.json(todo);
  } catch (error) {
    console.error('Error fetching todo:', error);
    res.status(500).json({ error: 'Failed to fetch todo' });
  }
});

// 新規TODO作成
router.post('/', async (req, res) => {
  try {
    const { title, description, priority, category, dueDate, tags } = req.body;
    
    if (!title || title.trim() === '') {
      return res.status(400).json({
        error: 'Title is required'
      });
    }

    // 優先度の検証
    const validPriorities = ['low', 'medium', 'high'];
    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({
        error: 'Priority must be one of: low, medium, high'
      });
    }

    // 期限日の検証
    if (dueDate) {
      const dueDateObj = new Date(dueDate);
      if (isNaN(dueDateObj.getTime())) {
        return res.status(400).json({
          error: 'Invalid due date format'
        });
      }
    }

    const newTodo = await todoStorage.addTodo({ 
      title: title.trim(), 
      description, 
      priority, 
      category,
      dueDate,
      tags: Array.isArray(tags) ? tags : []
    });
    res.status(201).json(newTodo);
  } catch (error) {
    console.error('Error creating todo:', error);
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

// TODO更新
router.put('/:id', async (req, res) => {
  try {
    const { title, description, completed, priority, category, dueDate, tags } = req.body;
    
    if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
      return res.status(400).json({
        error: 'Title must be a non-empty string'
      });
    }

    // 完了状態の検証
    if (completed !== undefined && typeof completed !== 'boolean') {
      return res.status(400).json({
        error: 'Completed must be a boolean'
      });
    }

    // 優先度の検証
    const validPriorities = ['low', 'medium', 'high'];
    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({
        error: 'Priority must be one of: low, medium, high'
      });
    }

    // 期限日の検証
    if (dueDate !== undefined && dueDate !== null) {
      const dueDateObj = new Date(dueDate);
      if (isNaN(dueDateObj.getTime())) {
        return res.status(400).json({
          error: 'Invalid due date format'
        });
      }
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description;
    if (completed !== undefined) updateData.completed = completed;
    if (priority !== undefined) updateData.priority = priority;
    if (category !== undefined) updateData.category = category;
    if (dueDate !== undefined) updateData.dueDate = dueDate;
    if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : [];

    const updatedTodo = await todoStorage.updateTodo(req.params.id, updateData);
    
    if (!updatedTodo) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    res.json(updatedTodo);
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

// TODO削除
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await todoStorage.deleteTodo(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

/**
 * @swagger
 * /api/todos/{id}/toggle:
 *   patch:
 *     summary: TODO完了状態切り替え
 *     description: "指定されたIDのTODOの完了状態を切り替え"
 *     tags: [Todos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           format: int64
 *         description: "TODO ID"
 *         example: 1722672000000
 *     responses:
 *       200:
 *         description: "完了状態切り替え成功"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Todo'
 *       404:
 *         description: "TODOが見つからない"
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
// TODO完了状態切り替え
router.patch('/:id/toggle', async (req, res) => {
  try {
    const todo = await todoStorage.getTodoById(req.params.id);
    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    const updatedTodo = await todoStorage.updateTodo(req.params.id, {
      completed: !todo.completed
    });
    
    res.json(updatedTodo);
  } catch (error) {
    console.error('Error toggling todo:', error);
    res.status(500).json({ error: 'Failed to toggle todo' });
  }
});

/**
 * @swagger
 * /api/todos/meta/categories:
 *   get:
 *     summary: TODOカテゴリ一覧取得
 *     description: "使用されているTODOカテゴリの一覧を取得"
 *     tags: [Todos]
 *     responses:
 *       200:
 *         description: "カテゴリ一覧"
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *               example: ["development", "documentation", "testing"]
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
    const categories = await todoStorage.getCategories();
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

/**
 * @swagger
 * /api/todos/meta/tags:
 *   get:
 *     summary: TODOタグ一覧取得
 *     description: "使用されているTODOタグの一覧を取得"
 *     tags: [Todos]
 *     responses:
 *       200:
 *         description: "タグ一覧"
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *               example: ["api", "nodejs", "express", "docs", "test"]
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
    const tags = await todoStorage.getTags();
    res.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// TODO統計情報
router.get('/meta/stats', async (req, res) => {
  try {
    const stats = await todoStorage.getStats();
    const categories = await todoStorage.getCategories();
    const tags = await todoStorage.getTags();
    
    res.json({
      ...stats,
      totalCategories: categories.length,
      totalTags: tags.length,
      categories,
      tags
    });
  } catch (error) {
    console.error('Error fetching todo stats:', error);
    res.status(500).json({ error: 'Failed to fetch todo statistics' });
  }
});

module.exports = router;
