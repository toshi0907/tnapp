const fs = require('fs').promises;
const path = require('path');

class TodoStorage {
  constructor(filename = 'todos.json') {
    this.dataDir = path.join(__dirname, '../../data');
    this.filePath = path.join(this.dataDir, filename);
  }

  async ensureDataFile() {
    try {
      await fs.access(this.filePath);
    } catch {
      // データディレクトリが存在しない場合は作成
      await fs.mkdir(this.dataDir, { recursive: true });
      // 初期データファイルを作成
      await fs.writeFile(this.filePath, JSON.stringify([], null, 2));
    }
  }

  async readData() {
    await this.ensureDataFile();
    try {
      const data = await fs.readFile(this.filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading todo data file:', error);
      return [];
    }
  }

  async writeData(data) {
    try {
      await this.ensureDataFile();
      await fs.writeFile(this.filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error writing todo data file:', error);
      throw error;
    }
  }

  async getTodos() {
    return await this.readData();
  }

  async getTodoById(id) {
    const todos = await this.readData();
    return todos.find(todo => todo.id === parseInt(id));
  }

  async addTodo(todoData) {
    const todos = await this.readData();

    const newTodo = {
      id: Date.now(),
      title: todoData.title,
      description: todoData.description || '',
      completed: false,
      priority: todoData.priority || 'medium', // low, medium, high
      category: todoData.category || 'general',
      dueDate: todoData.dueDate || null,
      tags: todoData.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: null
    };
    
    todos.push(newTodo);
    await this.writeData(todos);
    return newTodo;
  }

  async updateTodo(id, todoData) {
    const todos = await this.readData();
    const index = todos.findIndex(todo => todo.id === parseInt(id));
    
    if (index === -1) {
      return null;
    }

    // 完了状態が変更された場合のタイムスタンプ更新
    const currentTodo = todos[index];
    let completedAt = currentTodo.completedAt;
    
    if (todoData.hasOwnProperty('completed')) {
      if (todoData.completed && !currentTodo.completed) {
        // 未完了から完了に変更
        completedAt = new Date().toISOString();
      } else if (!todoData.completed && currentTodo.completed) {
        // 完了から未完了に変更
        completedAt = null;
      }
    }

    todos[index] = {
      ...todos[index],
      ...todoData,
      id: parseInt(id), // IDは変更不可
      updatedAt: new Date().toISOString(),
      completedAt: completedAt
    };
    
    await this.writeData(todos);
    return todos[index];
  }

  async deleteTodo(id) {
    const todos = await this.readData();
    const initialLength = todos.length;
    const filteredTodos = todos.filter(todo => todo.id !== parseInt(id));
    
    if (filteredTodos.length === initialLength) {
      return false; // TODOが見つからなかった
    }
    
    await this.writeData(filteredTodos);
    return true;
  }

  async getTodosByStatus(completed) {
    const todos = await this.readData();
    return todos.filter(todo => todo.completed === completed);
  }

  async getTodosByPriority(priority) {
    const todos = await this.readData();
    return todos.filter(todo => todo.priority === priority);
  }

  async getTodosByCategory(category) {
    const todos = await this.readData();
    return todos.filter(todo => todo.category === category);
  }

  async getTodosByTag(tag) {
    const todos = await this.readData();
    return todos.filter(todo => todo.tags.includes(tag));
  }

  async searchTodos(query) {
    const todos = await this.readData();
    const lowerQuery = query.toLowerCase();
    return todos.filter(todo => 
      todo.title.toLowerCase().includes(lowerQuery) ||
      todo.description.toLowerCase().includes(lowerQuery) ||
      todo.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  async getOverdueTodos() {
    const todos = await this.readData();
    const now = new Date();
    return todos.filter(todo => 
      !todo.completed && 
      todo.dueDate && 
      new Date(todo.dueDate) < now
    );
  }

  async getTodosWithDueDate() {
    const todos = await this.readData();
    return todos.filter(todo => todo.dueDate !== null)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }

  async getTodoCount() {
    const todos = await this.readData();
    return todos.length;
  }

  async getCompletedCount() {
    const todos = await this.readData();
    return todos.filter(todo => todo.completed).length;
  }

  async getPendingCount() {
    const todos = await this.readData();
    return todos.filter(todo => !todo.completed).length;
  }

  async getCategories() {
    const todos = await this.readData();
    const categories = [...new Set(todos.map(todo => todo.category))];
    return categories.sort();
  }

  async getTags() {
    const todos = await this.readData();
    const allTags = todos.flatMap(todo => todo.tags);
    const uniqueTags = [...new Set(allTags)];
    return uniqueTags.sort();
  }

  async getStats() {
    const todos = await this.readData();
    const total = todos.length;
    const completed = todos.filter(todo => todo.completed).length;
    const pending = total - completed;
    const overdue = todos.filter(todo => 
      !todo.completed && 
      todo.dueDate && 
      new Date(todo.dueDate) < new Date()
    ).length;

    const priorityStats = {
      high: todos.filter(todo => todo.priority === 'high').length,
      medium: todos.filter(todo => todo.priority === 'medium').length,
      low: todos.filter(todo => todo.priority === 'low').length
    };

    return {
      total,
      completed,
      pending,
      overdue,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      priorityStats
    };
  }
}

module.exports = new TodoStorage();
