document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('todo-form');
  const list = document.getElementById('list');
  const msg = document.getElementById('msg');
  const taskInput = document.getElementById('task');
  
  // 設定情報を動的に取得
  let API;
  try {
    const configRes = await fetch('/config');
    const config = await configRes.json();
    const currentHost = window.location.hostname;
    const currentPort = config.port;
    API = `http://${currentHost}:${currentPort}/api/todos`;
  } catch (e) {
    // フォールバック: 現在のホストとポートを使用
    API = `${window.location.protocol}//${window.location.host}/api/todos`;
  }

  function setMsg(t, ok = true) {
    msg.textContent = t;
    msg.style.color = ok ? '#0a0' : '#c00';
    if (t) setTimeout(() => { if (msg.textContent === t) msg.textContent = ''; }, 2500);
  }

  async function loadTodos() {
    console.log('Loading todos...');
    list.innerHTML = '<li>Loading...</li>';
    try {
      const res = await fetch(API);
      if (!res.ok) throw new Error('Failed to load todos');
      const todos = await res.json();
      list.innerHTML = '';
      if (Array.isArray(todos)) {
        todos.forEach(todo => {
          const li = document.createElement('li');
          li.textContent = todo.title || todo.task; // titleまたはtaskフィールドを使用
          if (todo.completed) {
            li.style.textDecoration = 'line-through';
          }
          list.appendChild(li);
        });
      }
      if (list.children.length === 0) {
        list.innerHTML = '<li>No todos found.</li>';
      }
    } catch (e) {
      list.innerHTML = '<li>Error loading todos.</li>';
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
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: task }), // titleフィールドを使用
      });
      if (!res.ok) throw new Error('Failed to add todo');
      taskInput.value = '';
      setMsg('Todo added successfully!');
      loadTodos();
    } catch (e) {
      setMsg(e.message, false);
    }
  });

  loadTodos();
});
