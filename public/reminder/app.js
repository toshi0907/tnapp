document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('reminder-form');
  const listContainer = document.getElementById('list-container');
  const msg = document.getElementById('msg');
  const formTitle = document.getElementById('form-title');
  const statusFilter = document.getElementById('status-filter');
  const categoryFilter = document.getElementById('category-filter');
  const methodFilter = document.getElementById('method-filter');
  const sortSelect = document.getElementById('sort-select');
  const hideSent = document.getElementById('hide-sent');
  const categoryInputForm = document.getElementById('category-input');
  const reminderIdInput = document.getElementById('reminder-id');
  const submitBtn = document.getElementById('submit-btn');
  const cancelBtn = document.getElementById('cancel-btn');
  const enableRepeat = document.getElementById('enable-repeat');
  const repeatSettings = document.getElementById('repeat-settings');
  
  // 設定情報を動的に取得
  let API;
  let authHeaders;
  try {
    const configRes = await fetch('/config');
    const config = await configRes.json();
    
    // Basic認証の設定
    if (config.authEnabled) {
      // Note: In a real application, these credentials should be obtained through a proper login flow
      // For demo purposes, using the default credentials from .env
      const username = 'admin';
      const password = 'your-secure-password';
      const credentials = btoa(`${username}:${password}`);
      authHeaders = {
        'Authorization': `Basic ${credentials}`
      };
    } else {
      authHeaders = {};
    }
    
    // 本番環境（リバースプロキシ）では現在のプロトコルとホストを使用
    // 開発環境では設定されたポートを使用
    const currentProtocol = window.location.protocol;
    const currentHost = window.location.hostname;
    const isProduction = currentProtocol === 'https:' || window.location.port === '';
    
    if (isProduction) {
      // 本番環境: リバースプロキシ経由
      API = `${currentProtocol}//${window.location.host}/api/reminders`;
    } else {
      // 開発環境: 直接ポート指定
      const currentPort = config.port;
      API = `${currentProtocol}//${currentHost}:${currentPort}/api/reminders`;
    }
  } catch (e) {
    // フォールバック: 現在のホストとポートを使用
    API = `${window.location.protocol}//${window.location.host}/api/reminders`;
    authHeaders = {};
  }

  let reminders = [];
  let categories = [];
  let isEditing = false;

  // リピート設定の表示/非表示切り替え
  enableRepeat.addEventListener('change', () => {
    repeatSettings.style.display = enableRepeat.checked ? 'block' : 'none';
  });

  // ローディング表示
  function showLoading() {
    listContainer.innerHTML = '<p>Loading...</p>';
  }

  // メッセージ表示
  function showMessage(message, isError = false) {
    msg.textContent = message;
    msg.className = isError ? 'msg error' : 'msg success';
    setTimeout(() => {
      msg.textContent = '';
      msg.className = 'msg';
    }, 3000);
  }

  // 日付フォーマット用ヘルパー
  function formatDateTime(dateTimeString) {
    const date = new Date(dateTimeString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // UTC日時を日本時間(JST)のdatetime-local形式に変換
  function convertToJSTDatetimeLocal(dateString) {
    // API からは "2025/8/24 20:30" 形式（既に日本時間）で返ってくる
    // これを datetime-local 形式に変換する
    
    // "2025/8/24 20:30" 形式をパース
    const regex = /^(\d{4})\/(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{2})$/;
    const match = dateString.match(regex);
    
    if (match) {
      // 日本時間として解釈してdatetime-local形式に変換
      const [, year, month, day, hour, minute] = match;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute}`;
    } else {
      // ISO形式の場合は従来通りの変換
      const date = new Date(dateString);
      // 日本時間に変換（UTC+9時間）
      const jstDate = new Date(date.getTime() + (9 * 60 * 60 * 1000));
      // datetime-local形式に変換
      return jstDate.toISOString().slice(0, 16);
    }
  }

  // リマインダー一覧を取得
  async function fetchReminders() {
    try {
      showLoading();
      const response = await fetch(API, {
        headers: authHeaders
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      reminders = await response.json();
      await fetchCategories();
      renderReminders();
      renderCategoryOptions();
    } catch (error) {
      console.error('Error fetching reminders:', error);
      showMessage('Failed to fetch reminders', true);
      listContainer.innerHTML = '<p>Error loading reminders</p>';
    }
  }

  // カテゴリ一覧を取得
  async function fetchCategories() {
    try {
      const response = await fetch(`${API}/meta/categories`, {
        headers: authHeaders
      });
      
      if (response.ok) {
        categories = await response.json();
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }

  // カテゴリオプションを描画
  function renderCategoryOptions() {
    // フィルター用
    categoryFilter.innerHTML = '<option value="">All Categories</option>';
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      categoryFilter.appendChild(option);
    });

    // フォーム用datalist
    const datalist = document.getElementById('category-list');
    datalist.innerHTML = '';
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      datalist.appendChild(option);
    });
  }

  // リマインダー一覧を描画
  function renderReminders() {
    let filteredReminders = [...reminders];

    // フィルタリング
    const statusValue = statusFilter.value;
    const categoryValue = categoryFilter.value;
    const methodValue = methodFilter.value;
    const hideSentValue = hideSent.checked;

    if (statusValue) {
      filteredReminders = filteredReminders.filter(reminder => reminder.notificationStatus === statusValue);
    }

    if (categoryValue) {
      filteredReminders = filteredReminders.filter(reminder => reminder.category === categoryValue);
    }

    if (methodValue) {
      filteredReminders = filteredReminders.filter(reminder => reminder.notificationMethod === methodValue);
    }

    if (hideSentValue) {
      filteredReminders = filteredReminders.filter(reminder => reminder.notificationStatus !== 'sent');
    }

    // ソート
    const sortValue = sortSelect.value;
    if (sortValue !== 'default') {
      filteredReminders.sort((a, b) => {
        if (sortValue === 'notificationDateTime') {
          return new Date(a.notificationDateTime) - new Date(b.notificationDateTime);
        }
        if (sortValue === 'title') {
          return a.title.localeCompare(b.title);
        }
        if (sortValue === 'category') {
          return (a.category || '').localeCompare(b.category || '');
        }
        return 0;
      });
    }

    // 描画
    if (filteredReminders.length === 0) {
      listContainer.innerHTML = '<p>No reminders found</p>';
      return;
    }

    const reminderHTML = filteredReminders.map(reminder => {
      const statusClass = reminder.notificationStatus === 'sent' ? 'completed' : 'pending';
      const statusIcon = reminder.notificationStatus === 'sent' ? '✓' : '⏰';
      const methodIcon = reminder.notificationMethod === 'webhook' ? '🔗' : '📧';
      
      return `
        <div class="reminder-item ${statusClass}" data-id="${reminder.id}">
          <div class="reminder-header">
            <span class="reminder-status">${statusIcon}</span>
            <h3 class="reminder-title">${reminder.title}</h3>
            <span class="reminder-method">${methodIcon}</span>
            <div class="reminder-actions">
              <button class="edit-btn" data-id="${reminder.id}">Edit</button>
              <button class="delete-btn" data-id="${reminder.id}">Delete</button>
            </div>
          </div>
          <div class="reminder-details">
            <p class="reminder-datetime">📅 ${formatDateTime(reminder.notificationDateTime)}</p>
            ${reminder.message ? `<p class="reminder-message">${reminder.message}</p>` : ''}
            ${reminder.category ? `<p class="reminder-category">📂 ${reminder.category}</p>` : ''}
            ${reminder.tags && reminder.tags.length > 0 ? `<p class="reminder-tags">🏷️ ${reminder.tags.join(', ')}</p>` : ''}
            ${reminder.repeatSettings ? `<p class="reminder-repeat">🔄 ${reminder.repeatSettings.interval}</p>` : ''}
            <p class="reminder-status-text">Status: ${reminder.notificationStatus}</p>
          </div>
        </div>
      `;
    }).join('');

    listContainer.innerHTML = reminderHTML;

    // イベントリスナーを追加
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        editReminder(parseInt(btn.dataset.id));
      });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteReminder(parseInt(btn.dataset.id));
      });
    });

    // リマインダーアイテムのクリックで編集
    document.querySelectorAll('.reminder-item').forEach(item => {
      item.addEventListener('click', () => {
        editReminder(parseInt(item.dataset.id));
      });
    });
  }

  // リマインダー作成/更新
  async function saveReminder(reminderData) {
    try {
      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing ? `${API}/${reminderIdInput.value}` : API;
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        },
        body: JSON.stringify(reminderData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      showMessage(isEditing ? 'Reminder updated successfully' : 'Reminder created successfully');
      
      resetForm();
      fetchReminders();
    } catch (error) {
      console.error('Error saving reminder:', error);
      showMessage(error.message || 'Failed to save reminder', true);
    }
  }

  // リマインダー編集
  function editReminder(id) {
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;

    isEditing = true;
    reminderIdInput.value = id;
    formTitle.textContent = 'Edit Reminder';
    submitBtn.textContent = 'Update Reminder';
    cancelBtn.style.display = 'inline-block';

    // フォームに値を設定
    document.getElementById('title').value = reminder.title;
    document.getElementById('message').value = reminder.message || '';
    
    // 日時の変換（APIから受け取った形式を datetime-local に変換）
    const notificationDate = new Date(reminder.notificationDateTime);
    document.getElementById('notification-datetime').value = convertToJSTDatetimeLocal(reminder.notificationDateTime);
    
    document.getElementById('notification-method').value = reminder.notificationMethod;
    document.getElementById('category-input').value = reminder.category || '';
    document.getElementById('tags').value = reminder.tags ? reminder.tags.join(', ') : '';

    // リピート設定
    if (reminder.repeatSettings) {
      enableRepeat.checked = true;
      repeatSettings.style.display = 'block';
      document.getElementById('repeat-interval').value = reminder.repeatSettings.interval || '';
      if (reminder.repeatSettings.endDate) {
        document.getElementById('repeat-end-date').value = convertToJSTDatetimeLocal(reminder.repeatSettings.endDate);
      }
      document.getElementById('max-occurrences').value = reminder.repeatSettings.maxOccurrences || '';
    } else {
      enableRepeat.checked = false;
      repeatSettings.style.display = 'none';
    }

    // フォームまでスクロール
    formTitle.scrollIntoView({ behavior: 'smooth' });
  }

  // リマインダー削除
  async function deleteReminder(id) {
    if (!confirm('Are you sure you want to delete this reminder?')) return;

    try {
      const response = await fetch(`${API}/${id}`, {
        method: 'DELETE',
        headers: authHeaders
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      showMessage('Reminder deleted successfully');
      fetchReminders();
    } catch (error) {
      console.error('Error deleting reminder:', error);
      showMessage('Failed to delete reminder', true);
    }
  }

  // フォームリセット
  function resetForm() {
    form.reset();
    isEditing = false;
    reminderIdInput.value = '';
    formTitle.textContent = 'Register';
    submitBtn.textContent = 'Add Reminder';
    cancelBtn.style.display = 'none';
    enableRepeat.checked = false;
    repeatSettings.style.display = 'none';
  }

  // フォーム送信
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const title = document.getElementById('title').value.trim();
    const message = document.getElementById('message').value.trim();
    const notificationDateTime = document.getElementById('notification-datetime').value;
    const notificationMethod = document.getElementById('notification-method').value;
    const category = document.getElementById('category-input').value.trim();
    const tags = document.getElementById('tags').value.trim();

    if (!title) {
      showMessage('Title is required', true);
      return;
    }

    if (!notificationDateTime) {
      showMessage('Notification date and time is required', true);
      return;
    }

    // 通知日時が過去でないかチェック（編集時は除く）
    const notificationDate = new Date(notificationDateTime);
    if (!isEditing && notificationDate <= new Date()) {
      showMessage('Notification date and time must be in the future', true);
      return;
    }

    const reminderData = {
      title,
      message: message || undefined,
      notificationDateTime: notificationDate.toISOString(),
      notificationMethod,
      category: category || undefined,
      tags: tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : []
    };

    // リピート設定
    if (enableRepeat.checked) {
      const repeatInterval = document.getElementById('repeat-interval').value;
      const repeatEndDate = document.getElementById('repeat-end-date').value;
      const maxOccurrences = document.getElementById('max-occurrences').value;

      if (repeatInterval) {
        reminderData.repeatSettings = {
          interval: repeatInterval,
          endDate: repeatEndDate ? new Date(repeatEndDate).toISOString() : undefined,
          maxOccurrences: maxOccurrences ? parseInt(maxOccurrences) : undefined
        };
      }
    }

    await saveReminder(reminderData);
  });

  // キャンセルボタン
  cancelBtn.addEventListener('click', resetForm);

  // フィルターとソートのイベントリスナー
  [statusFilter, categoryFilter, methodFilter, sortSelect, hideSent].forEach(element => {
    element.addEventListener('change', renderReminders);
  });

  // 初期データ読み込み
  fetchReminders();
});