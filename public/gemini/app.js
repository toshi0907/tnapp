document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('gemini-form');
  const resultsContainer = document.getElementById('results-container');
  const msg = document.getElementById('msg');
  const categoryFilter = document.getElementById('category-filter');
  const statusFilter = document.getElementById('status-filter');
  const searchInput = document.getElementById('search-input');
  const refreshBtn = document.getElementById('refresh-btn');
  const statsContainer = document.getElementById('stats-container');
  const addScheduleBtn = document.getElementById('add-schedule-btn');
  const scheduleModal = document.getElementById('schedule-modal');
  const scheduleForm = document.getElementById('schedule-form');
  const cancelScheduleBtn = document.getElementById('cancel-schedule-btn');
  const scheduledPromptsContainer = document.getElementById('scheduled-prompts-container');
  
  // 設定情報を動的に取得
  let API = '/api/gemini'; // Simple relative URL
  let authHeaders = {};
  
  try {
    const configRes = await fetch('/config');
    const config = await configRes.json();
    
    // Basic認証の設定
    if (config.authEnabled) {
      const username = 'admin';
      const password = 'your-secure-password';
      const credentials = btoa(`${username}:${password}`);
      authHeaders = {
        'Authorization': `Basic ${credentials}`
      };
    }
  } catch (e) {
    console.error('Failed to load config:', e);
  }

  function setMsg(t, ok=true){
    msg.textContent = t;
    msg.style.color = ok ? '#0a0' : '#c00';
    if(t) setTimeout(()=>{ if(msg.textContent===t) msg.textContent=''; }, 3000);
  }

  async function deleteResult(resultId) {
    if (!confirm('この結果を削除しますか？')) {
      return;
    }
    
    try {
      const res = await fetch(`${API}/${resultId}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      if (!res.ok) throw new Error('Failed to delete result');
      setMsg('結果を削除しました！');
      loadResults();
    } catch (e) {
      setMsg(e.message, false);
    }
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP') + ' ' + date.toLocaleTimeString('ja-JP');
  }

  function truncateText(text, maxLength = 200) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  function createExpandableText(text, id, maxLength = 200) {
    if (text.length <= maxLength) {
      return text;
    }
    
    const truncated = text.substring(0, maxLength);
    const remaining = text.substring(maxLength);
    
    return `
      <span id="text-${id}">
        ${truncated}
        <span id="remaining-${id}" style="display: none;">${remaining}</span>
        <button class="toggle-text-btn" data-text-id="${id}" style="background: none; border: none; color: #007bff; cursor: pointer; font-size: 0.8rem; margin-left: 0.5rem;" id="toggle-btn-${id}">
          もっと見る
        </button>
      </span>
    `;
  }

  async function loadResults() {
    try {
      const searchParam = searchInput.value ? `&search=${encodeURIComponent(searchInput.value)}` : '';
      const categoryParam = categoryFilter.value ? `&category=${encodeURIComponent(categoryFilter.value)}` : '';
      const statusParam = statusFilter.value ? `&status=${encodeURIComponent(statusFilter.value)}` : '';
      
      const res = await fetch(`${API}?limit=20${searchParam}${categoryParam}${statusParam}`, {
        headers: authHeaders
      });
      if (!res.ok) throw new Error('Failed to load results');
      
      let results = await res.json();
      
      if (!Array.isArray(results)) {
        results = [];
      }
      
      if (results.length === 0) {
        resultsContainer.innerHTML = '<p style="color: #666;">結果がありません。</p>';
        return;
      }
      
      resultsContainer.innerHTML = results.map((result, index) => `
        <div class="result-item" style="border: 1px solid #e0e0e0; border-radius: 0.5rem; padding: 1rem; margin-bottom: 1rem; background: ${result.status === 'error' ? '#fff5f5' : '#fff'};">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
            <div style="flex: 1;">
              <div style="font-weight: bold; color: #333; margin-bottom: 0.25rem;">
                ${result.status === 'success' ? '✅' : '❌'} ${formatDate(result.createdAt)}
              </div>
              <div style="font-size: 0.85rem; color: #666;">
                ${result.category ? `📂 ${result.category}` : ''}
                ${result.tags && result.tags.length > 0 ? ` | 🏷️ ${result.tags.join(', ')}` : ''}
                ${result.scheduledJob ? ' | ⏰ 自動実行' : ' | 👤 手動実行'}
              </div>
            </div>
            <button class="delete-btn" data-result-id="${result.id}" style="background: #dc3545; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 0.25rem; cursor: pointer; font-size: 0.8rem;">削除</button>
          </div>
          
          <div style="margin-bottom: 0.75rem;">
            <div style="font-weight: bold; color: #444; margin-bottom: 0.25rem;">プロンプト:</div>
            <div style="background: #f8f9fa; padding: 0.75rem; border-radius: 0.25rem; font-size: 0.9rem; color: #333; line-height: 1.4; white-space: pre-wrap;">
              ${createExpandableText(result.prompt, `prompt-${index}`)}
            </div>
          </div>
          
          <div>
            <div style="font-weight: bold; color: #444; margin-bottom: 0.25rem;">
              ${result.status === 'success' ? 'レスポンス:' : 'エラー:'}
            </div>
            <div style="background: ${result.status === 'error' ? '#fef5e7' : '#f0f8ff'}; padding: 0.75rem; border-radius: 0.25rem; font-size: 0.9rem; color: #333; line-height: 1.4; white-space: pre-wrap;">
              ${result.status === 'success' 
                ? createExpandableText(result.response || 'レスポンスなし', `response-${index}`) 
                : (result.errorMessage || 'エラーが発生しました')}
            </div>
          </div>
          
          ${result.status === 'success' && result.tokensUsed ? `
            <div style="margin-top: 0.75rem; padding: 0.5rem; background: #f8f9fa; border-radius: 0.25rem; font-size: 0.85rem; color: #666;">
              📊 <strong>実行詳細:</strong> 使用トークン: ${result.tokensUsed} | モデル: ${result.model || 'N/A'}
              ${result.executionTime ? ` | 実行時間: ${result.executionTime}ms` : ''}
            </div>
          ` : ''}
        </div>
      `).join('');
      
    } catch (e) {
      setMsg(e.message, false);
      resultsContainer.innerHTML = '<p style="color: #c00;">結果の読み込みに失敗しました。</p>';
    }
  }

  async function loadCategories() {
    try {
      const res = await fetch(`${API}/meta/categories`, {
        headers: authHeaders
      });
      if (!res.ok) return;
      
      const data = await res.json();
      const categories = data.categories || [];
      
      categoryFilter.innerHTML = '<option value="">All Categories</option>' +
        categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
        
    } catch (e) {
      // カテゴリ読み込み失敗は無視
    }
  }

  async function loadStats() {
    try {
      const res = await fetch(`${API}/meta/stats`, {
        headers: authHeaders
      });
      if (!res.ok) return;
      
      const stats = await res.json();
      
      statsContainer.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-top: 1rem;">
          <div style="text-align: center; padding: 0.5rem; background: #f8f9fa; border-radius: 0.25rem;">
            <div style="font-size: 1.5rem; font-weight: bold; color: #007bff;">${stats.totalResults || 0}</div>
            <div style="font-size: 0.8rem; color: #666;">総実行回数</div>
          </div>
          <div style="text-align: center; padding: 0.5rem; background: #f8f9fa; border-radius: 0.25rem;">
            <div style="font-size: 1.5rem; font-weight: bold; color: #28a745;">${stats.successfulResults || 0}</div>
            <div style="font-size: 0.8rem; color: #666;">成功</div>
          </div>
          <div style="text-align: center; padding: 0.5rem; background: #f8f9fa; border-radius: 0.25rem;">
            <div style="font-size: 1.5rem; font-weight: bold; color: #dc3545;">${stats.failedResults || 0}</div>
            <div style="font-size: 0.8rem; color: #666;">失敗</div>
          </div>
          <div style="text-align: center; padding: 0.5rem; background: #f8f9fa; border-radius: 0.25rem;">
            <div style="font-size: 1.5rem; font-weight: bold; color: #6f42c1;">${stats.totalTokensUsed || 0}</div>
            <div style="font-size: 0.8rem; color: #666;">総トークン数</div>
          </div>
        </div>
      `;
    } catch (e) {
      statsContainer.innerHTML = '<p style="color: #666;">統計情報の読み込みに失敗しました。</p>';
    }
  }

  // スケジュール済みプロンプト管理
  async function loadScheduledPrompts() {
    try {
      const res = await fetch(`${API}/scheduled`, {
        headers: authHeaders
      });
      if (!res.ok) throw new Error('Failed to load scheduled prompts');
      
      const prompts = await res.json();
      
      if (prompts.length === 0) {
        scheduledPromptsContainer.innerHTML = '<p style="color: #666;">スケジュール済みプロンプトがありません。</p>';
        return;
      }
      
      scheduledPromptsContainer.innerHTML = prompts.map(prompt => {
        const nextRunTime = getNextRunTime(prompt.cronExpression);
        return `
          <div class="schedule-item" style="border: 1px solid #e0e0e0; border-radius: 0.5rem; padding: 1rem; margin-bottom: 1rem; background: ${prompt.enabled ? '#fff' : '#f8f9fa'};">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
              <div style="flex: 1;">
                <div style="font-weight: bold; color: #333; margin-bottom: 0.25rem;">
                  ${prompt.enabled ? '✅' : '⏸️'} ${prompt.name}
                </div>
                <div style="font-size: 0.85rem; color: #666;">
                  ⏰ ${formatCronExpression(prompt.cronExpression)}
                  ${nextRunTime ? ` | 次回実行: ${nextRunTime}` : ''}
                  ${prompt.category ? ` | 📂 ${prompt.category}` : ''}
                </div>
              </div>
              <div>
                <button class="edit-schedule-btn" data-schedule-id="${prompt.id}" style="background: #007bff; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 0.25rem; cursor: pointer; font-size: 0.8rem; margin-right: 0.25rem;">編集</button>
                <button class="delete-schedule-btn" data-schedule-id="${prompt.id}" style="background: #dc3545; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 0.25rem; cursor: pointer; font-size: 0.8rem;">削除</button>
              </div>
            </div>
            
            <div style="background: #f8f9fa; padding: 0.75rem; border-radius: 0.25rem; font-size: 0.9rem; color: #333; line-height: 1.4;">
              ${prompt.prompt}
            </div>
            
            ${prompt.tags && prompt.tags.length > 0 ? `
              <div style="margin-top: 0.5rem; font-size: 0.8rem; color: #666;">
                🏷️ ${prompt.tags.join(', ')}
              </div>
            ` : ''}
          </div>
        `;
      }).join('');
      
    } catch (e) {
      setMsg(e.message, false);
      scheduledPromptsContainer.innerHTML = '<p style="color: #c00;">スケジュール済みプロンプトの読み込みに失敗しました。</p>';
    }
  }

  function formatCronExpression(cronExpr) {
    const parts = cronExpr.split(' ');
    if (parts.length !== 5) return cronExpr;
    
    const [minute, hour, day, month, dayOfWeek] = parts;
    
    if (day === '*' && month === '*' && dayOfWeek === '*') {
      return `毎日 ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
    }
    
    return cronExpr; // フォールバック
  }

  function getNextRunTime(cronExpr) {
    try {
      const parts = cronExpr.split(' ');
      if (parts.length !== 5) return null;
      
      const [minute, hour] = parts;
      const now = new Date();
      const next = new Date();
      next.setHours(parseInt(hour), parseInt(minute), 0, 0);
      
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }
      
      return next.toLocaleDateString('ja-JP') + ' ' + next.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return null;
    }
  }

  async function saveScheduledPrompt(promptData, isEdit = false, editId = null) {
    try {
      const method = isEdit ? 'PUT' : 'POST';
      const url = isEdit ? `${API}/scheduled/${editId}` : `${API}/scheduled`;
      
      const res = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        },
        body: JSON.stringify(promptData)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save scheduled prompt');
      }
      
      setMsg(isEdit ? 'スケジュールを更新しました！' : 'スケジュールを追加しました！');
      scheduleModal.style.display = 'none';
      scheduleForm.reset();
      loadScheduledPrompts();
    } catch (e) {
      setMsg(e.message, false);
    }
  }

  async function deleteScheduledPrompt(scheduleId) {
    if (!confirm('このスケジュールを削除しますか？')) {
      return;
    }
    
    try {
      const res = await fetch(`${API}/scheduled/${scheduleId}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      if (!res.ok) throw new Error('Failed to delete scheduled prompt');
      setMsg('スケジュールを削除しました！');
      loadScheduledPrompts();
    } catch (e) {
      setMsg(e.message, false);
    }
  }

  let currentEditId = null;

  // フォーム送信
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const data = {
      prompt: formData.get('prompt'),
      category: formData.get('category') || undefined,
      tags: formData.get('tags') ? formData.get('tags').split(',').map(tag => tag.trim()).filter(Boolean) : undefined
    };

    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        },
        body: JSON.stringify(data)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to execute prompt');
      }
      
      const result = await res.json();
      setMsg('プロンプトを実行しました！');
      form.reset();
      loadResults();
      loadStats();
    } catch (e) {
      setMsg(e.message, false);
    }
  });

  // イベントリスナー
  refreshBtn.addEventListener('click', loadResults);
  searchInput.addEventListener('input', () => {
    clearTimeout(searchInput.timeout);
    searchInput.timeout = setTimeout(loadResults, 500);
  });
  categoryFilter.addEventListener('change', loadResults);
  statusFilter.addEventListener('change', loadResults);

  // スケジュール関連のイベントリスナー
  addScheduleBtn.addEventListener('click', () => {
    currentEditId = null;
    document.getElementById('schedule-modal-title').textContent = '📅 スケジュール追加';
    scheduleForm.reset();
    document.getElementById('schedule-enabled').checked = true;
    scheduleModal.style.display = 'block';
  });

  cancelScheduleBtn.addEventListener('click', () => {
    scheduleModal.style.display = 'none';
  });

  scheduleForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(scheduleForm);
    const timeValue = document.getElementById('schedule-time').value;
    
    if (!timeValue) {
      setMsg('実行時間を選択してください', false);
      return;
    }
    
    const [hour, minute] = timeValue.split(':');
    const cronExpression = `${minute} ${hour} * * *`; // 毎日指定時間
    
    const promptData = {
      name: formData.get('name'),
      prompt: formData.get('prompt'),
      cronExpression: cronExpression,
      category: formData.get('category') || 'scheduled',
      tags: formData.get('tags') ? formData.get('tags').split(',').map(tag => tag.trim()).filter(Boolean) : [],
      enabled: document.getElementById('schedule-enabled').checked
    };

    await saveScheduledPrompt(promptData, currentEditId !== null, currentEditId);
  });

  // 動的に追加される削除ボタンのイベント委譲
  resultsContainer.addEventListener('click', async (e) => {
    if (e.target.classList.contains('delete-btn')) {
      const resultId = e.target.getAttribute('data-result-id');
      await deleteResult(resultId);
    }
    
    if (e.target.classList.contains('toggle-text-btn')) {
      const textId = e.target.getAttribute('data-text-id');
      toggleText(textId);
    }
  });

  // スケジュール済みプロンプトのイベント委譲
  scheduledPromptsContainer.addEventListener('click', async (e) => {
    if (e.target.classList.contains('delete-schedule-btn')) {
      const scheduleId = e.target.getAttribute('data-schedule-id');
      await deleteScheduledPrompt(scheduleId);
    }
    
    if (e.target.classList.contains('edit-schedule-btn')) {
      const scheduleId = e.target.getAttribute('data-schedule-id');
      await editScheduledPrompt(scheduleId);
    }
  });

  async function editScheduledPrompt(scheduleId) {
    try {
      const res = await fetch(`${API}/scheduled/${scheduleId}`, {
        headers: authHeaders
      });
      if (!res.ok) throw new Error('Failed to load scheduled prompt');
      
      const prompt = await res.json();
      
      // フォームに値を設定
      document.getElementById('schedule-name').value = prompt.name;
      document.getElementById('schedule-prompt').value = prompt.prompt;
      document.getElementById('schedule-category').value = prompt.category || '';
      document.getElementById('schedule-tags').value = prompt.tags ? prompt.tags.join(', ') : '';
      document.getElementById('schedule-enabled').checked = prompt.enabled;
      
      // cron式から時間を抽出
      const cronParts = prompt.cronExpression.split(' ');
      if (cronParts.length >= 2) {
        const hour = cronParts[1].padStart(2, '0');
        const minute = cronParts[0].padStart(2, '0');
        document.getElementById('schedule-time').value = `${hour}:${minute}`;
      }
      
      currentEditId = scheduleId;
      document.getElementById('schedule-modal-title').textContent = '📅 スケジュール編集';
      scheduleModal.style.display = 'block';
    } catch (e) {
      setMsg(e.message, false);
    }
  }

  // グローバル関数として定義（HTMLから呼び出せるように）
  window.deleteResult = deleteResult;
  
  window.toggleText = function(id) {
    const remainingSpan = document.getElementById(`remaining-${id}`);
    const toggleBtn = document.getElementById(`toggle-btn-${id}`);
    
    if (remainingSpan && toggleBtn) {
      if (remainingSpan.style.display === 'none') {
        remainingSpan.style.display = 'inline';
        toggleBtn.textContent = '閉じる';
      } else {
        remainingSpan.style.display = 'none';
        toggleBtn.textContent = 'もっと見る';
      }
    }
  };

  // 初期読み込み
  loadResults();
  loadCategories();
  loadStats();
  loadScheduledPrompts();
});