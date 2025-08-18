document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('todo-form');
  const listContainer = document.getElementById('list-container');
  const msg = document.getElementById('msg');
  const taskInput = document.getElementById('task');
  const descriptionInput = document.getElementById('description');
  const prioritySelect = document.getElementById('priority');
  const categorySelectForm = document.getElementById('category-select');
  const dueDateInput = document.getElementById('due-date');
  const tagsInput = document.getElementById('tags');
  const categoryFilter = document.getElementById('category-filter');
  const sortSelect = document.getElementById('sort-select');
  const groupByCategory = document.getElementById('group-by-category');
  const hideCompleted = document.getElementById('hide-completed');
  
  // 設定情報を動的に取得
  let API;
  try {
    const configRes = await fetch('/config');
    const config = await configRes.json();
    
    // 本番環境（リバースプロキシ）では現在のプロトコルとホストを使用
    // 開発環境では設定されたポートを使用
    const currentProtocol = window.location.protocol;
    const currentHost = window.location.hostname;
    const isProduction = currentProtocol === 'https:' || window.location.port === '';
    
    if (isProduction) {
      // 本番環境: リバースプロキシ経由
      API = `${currentProtocol}//${window.location.host}/api/todos`;
    } else {
      // 開発環境: 直接ポート指定
      const currentPort = config.port;
      API = `${currentProtocol}//${currentHost}:${currentPort}/api/todos`;
    }
  } catch (e) {
    // フォールバック: 現在のホストとポートを使用
    API = `${window.location.protocol}//${window.location.host}/api/todos`;
  }

  function setMsg(t, ok = true) {
    msg.textContent = t;
    msg.style.color = ok ? '#0a0' : '#c00';
    if (t) setTimeout(() => { if (msg.textContent === t) msg.textContent = ''; }, 2500);
  }

  async function toggleTodo(todoId) {
    try {
      const res = await fetch(`${API}/${todoId}/toggle`, {
        method: 'PATCH'
      });
      if (!res.ok) throw new Error('Failed to toggle todo');
      setMsg('Todo status updated!');
      loadTodos(); // リロードして状態を更新
    } catch (e) {
      setMsg(e.message, false);
    }
  }

  // カテゴリを読み込む
  async function loadCategories() {
    try {
      const res = await fetch(`${API}/meta/categories`);
      if (!res.ok) throw new Error('Failed to load categories');
      const categories = await res.json();
      
      // カテゴリフィルターを更新
      categoryFilter.innerHTML = '<option value="">All Categories</option>';
      categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        categoryFilter.appendChild(option);
      });
      
      // 登録フォームのカテゴリ選択肢も更新
      categorySelectForm.innerHTML = '<option value="">No Category</option>';
      categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        categorySelectForm.appendChild(option);
      });
    } catch (e) {
      console.error('Error loading categories:', e);
    }
  }

  // 日付をフォーマット
  function formatDate(dateString) {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const isOverdue = date < now;
    
    const formatted = date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return { formatted, isOverdue };
  }

  // TODOアイテムのHTMLを生成
  function createTodoElement(todo) {
    const div = document.createElement('div');
    div.className = `todo-item ${todo.completed ? 'completed' : ''} ${todo.priority}-priority`;
    div.setAttribute('data-todo-id', todo.id);
    
    const title = document.createElement('div');
    title.className = 'todo-title';
    title.textContent = todo.title;
    
    const meta = document.createElement('div');
    meta.className = 'todo-meta';
    
    const metaParts = [];
    
    if (todo.priority) {
      metaParts.push(`Priority: ${todo.priority.toUpperCase()}`);
    }
    
    if (todo.dueDate) {
      const dateInfo = formatDate(todo.dueDate);
      if (dateInfo) {
        const dueDateSpan = document.createElement('span');
        dueDateSpan.className = `todo-due-date ${dateInfo.isOverdue ? 'overdue' : ''}`;
        dueDateSpan.textContent = `Due: ${dateInfo.formatted}`;
        if (dateInfo.isOverdue && !todo.completed) {
          dueDateSpan.textContent += ' (OVERDUE)';
        }
        metaParts.push(dueDateSpan.outerHTML);
      }
    }
    
    if (todo.tags && todo.tags.length > 0) {
      metaParts.push(`Tags: ${todo.tags.join(', ')}`);
    }
    
    meta.innerHTML = metaParts.join(' | ');
    
    div.appendChild(title);
    if (metaParts.length > 0) {
      div.appendChild(meta);
    }
    
    // クリックで完了状態を切り替え
    div.addEventListener('click', async () => {
      await toggleTodo(todo.id);
    });
    
    return div;
  }

  // TODOを並び替え
  function sortTodos(todos, sortBy) {
    const sorted = [...todos];
    
    switch (sortBy) {
      case 'dueDate':
        return sorted.sort((a, b) => {
          // 期限日がないものは最後
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate) - new Date(b.dueDate);
        });
      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return sorted.sort((a, b) => (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0));
      case 'category':
        return sorted.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
      default:
        return sorted;
    }
  }

  // TODOをカテゴリ別にグループ化
  function groupTodosByCategory(todos) {
    const groups = {};
    todos.forEach(todo => {
      const category = todo.category || 'Uncategorized';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(todo);
    });
    return groups;
  }

  async function loadTodos() {
    console.log('Loading todos...');
    listContainer.innerHTML = '<div>Loading...</div>';
    
    try {
      // APIパラメータを構築
      const params = new URLSearchParams();
      
      // カテゴリフィルター
      if (categoryFilter.value) {
        params.append('category', categoryFilter.value);
      }
      
      // ソートが期限日の場合は、期限日があるもののみを取得するAPIを使用
      if (sortSelect.value === 'dueDate') {
        params.append('dueDate', 'true');
      }
      
      const url = params.toString() ? `${API}?${params}` : API;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load todos');
      let todos = await res.json();
      
      if (!Array.isArray(todos)) {
        todos = [];
      }
      
      // ソート適用
      if (sortSelect.value !== 'dueDate') {
        todos = sortTodos(todos, sortSelect.value);
      }
      
      // 完了したタスクをフィルタリング
      if (hideCompleted.checked) {
        todos = todos.filter(todo => !todo.completed);
      }
      
      listContainer.innerHTML = '';
      
      if (todos.length === 0) {
        listContainer.innerHTML = '<div>No todos found.</div>';
        return;
      }
      
      // カテゴリ別グループ化が有効な場合
      if (groupByCategory.checked) {
        const groups = groupTodosByCategory(todos);
        
        Object.keys(groups).sort().forEach(category => {
          const groupDiv = document.createElement('div');
          groupDiv.className = 'category-group';
          
          const header = document.createElement('div');
          header.className = 'category-header';
          header.textContent = `${category.charAt(0).toUpperCase() + category.slice(1)} (${groups[category].length})`;
          groupDiv.appendChild(header);
          
          groups[category].forEach(todo => {
            groupDiv.appendChild(createTodoElement(todo));
          });
          
          listContainer.appendChild(groupDiv);
        });
      } else {
        // 通常の一覧表示
        todos.forEach(todo => {
          listContainer.appendChild(createTodoElement(todo));
        });
      }
      
    } catch (e) {
      listContainer.innerHTML = '<div>Error loading todos.</div>';
      setMsg(e.message, false);
    }
    console.log('Todos loaded successfully');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const task = taskInput.value.trim();
    if (!task) {
      setMsg('Task cannot be empty', false);
      return;
    }
    
    // フォームからデータを収集
    const todoData = {
      title: task
    };
    
    // オプショナルフィールドを追加（空でない場合のみ）
    const description = descriptionInput.value.trim();
    if (description) {
      todoData.description = description;
    }
    
    const priority = prioritySelect.value;
    if (priority) {
      todoData.priority = priority;
    }
    
    const category = categorySelectForm.value;
    if (category) {
      todoData.category = category;
    }
    
    const dueDate = dueDateInput.value;
    if (dueDate) {
      todoData.dueDate = new Date(dueDate).toISOString();
    }
    
    const tags = tagsInput.value.trim();
    if (tags) {
      todoData.tags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }
    
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(todoData),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to add todo');
      }
      
      // フォームをリセット
      taskInput.value = '';
      descriptionInput.value = '';
      prioritySelect.value = '';
      categorySelectForm.value = '';
      dueDateInput.value = '';
      tagsInput.value = '';
      
      setMsg('Todo added successfully!');
      loadTodos();
    } catch (e) {
      setMsg(e.message, false);
    }
  });

  // イベントリスナーを追加
  categoryFilter.addEventListener('change', loadTodos);
  sortSelect.addEventListener('change', loadTodos);
  groupByCategory.addEventListener('change', loadTodos);
  hideCompleted.addEventListener('change', loadTodos);

  // 初期化
  await loadCategories();
  loadTodos();
});
