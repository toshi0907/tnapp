document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('bookmark-form');
  const listContainer = document.getElementById('list-container');
  const msg = document.getElementById('msg');
  const formTitle = document.getElementById('form-title');
  const categoryFilter = document.getElementById('category-filter');
  const sortSelect = document.getElementById('sort-select');
  const editEnable = document.getElementById('edit-enable');
  const categoryInputForm = document.getElementById('category-input');
  const bookmarkIdInput = document.getElementById('bookmark-id');
  const submitBtn = document.getElementById('submit-btn');
  const cancelBtn = document.getElementById('cancel-btn');
  
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
      API = `${currentProtocol}//${window.location.host}/api/bookmarks`;
    } else {
      // 開発環境: 直接ポート指定
      const currentPort = config.port;
      API = `${currentProtocol}//${currentHost}:${currentPort}/api/bookmarks`;
    }
  } catch (e) {
    // フォールバック: 現在のホストとポートを使用
    API = `${window.location.protocol}//${window.location.host}/api/bookmarks`;
    authHeaders = {};
  }

  function setMsg(t, ok=true){
    msg.textContent = t;
    msg.style.color = ok ? '#0a0' : '#c00';
    if(t) setTimeout(()=>{ if(msg.textContent===t) msg.textContent=''; }, 2500);
  }

  async function deleteBookmark(bookmarkId) {
    if (!confirm('Are you sure you want to delete this bookmark?')) {
      return;
    }
    
    try {
      const res = await fetch(`${API}/${bookmarkId}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      if (!res.ok) throw new Error('Failed to delete bookmark');
      setMsg('Bookmark deleted successfully!');
      loadBookmarks();
    } catch (e) {
      setMsg(e.message, false);
    }
  }

  function editBookmark(bookmark) {
    // Switch to edit mode
    formTitle.textContent = 'Edit Bookmark';
    submitBtn.textContent = 'Update Bookmark';
    cancelBtn.style.display = 'inline-block';
    
    // Populate form with bookmark data
    bookmarkIdInput.value = bookmark.id;
    form.title.value = bookmark.title;
    form.url.value = bookmark.url;
    form.description.value = bookmark.description || '';
    categoryInputForm.value = bookmark.category || '';
    form.tags.value = bookmark.tags ? bookmark.tags.join(', ') : '';
    
    // Scroll to form
    form.scrollIntoView({ behavior: 'smooth' });
  }

  function cancelEdit() {
    // Switch back to create mode
    formTitle.textContent = 'Register';
    submitBtn.textContent = 'Add';
    cancelBtn.style.display = 'none';
    
    // Clear form
    bookmarkIdInput.value = '';
    form.title.value = '';
    form.url.value = '';
    form.description.value = '';
    categoryInputForm.value = '';
    form.tags.value = '';
  }

  // カテゴリを読み込む
  async function loadCategories() {
    try {
      const res = await fetch(`${API}/meta/categories`, {
        headers: authHeaders
      });
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
      
      // 登録フォームのカテゴリ選択肢も更新（datalistの場合）
      const categoryDatalist = document.getElementById('category-list');
      categoryDatalist.innerHTML = '';
      categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        categoryDatalist.appendChild(option);
      });
    } catch (e) {
      console.error('Error loading categories:', e);
    }
  }

  // ブックマークアイテムのHTMLを生成
  function createBookmarkElement(bookmark) {
    const div = document.createElement('div');
    div.className = 'bookmark-item';
    div.setAttribute('data-bookmark-id', bookmark.id);
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'bookmark-content';
    
    const title = document.createElement('div');
    title.className = 'bookmark-title';
    
    const link = document.createElement('a');
    link.href = bookmark.url;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = bookmark.title || bookmark.url;
    title.appendChild(link);
    
    const meta = document.createElement('div');
    meta.className = 'bookmark-meta';
    
    const metaParts = [];
    
    if (bookmark.description) {
      metaParts.push(`Description: ${bookmark.description}`);
    }
    
    if (bookmark.tags && bookmark.tags.length > 0) {
      metaParts.push(`Tags: ${bookmark.tags.join(', ')}`);
    }
    
    meta.textContent = metaParts.join(' | ');
    
    contentDiv.appendChild(title);
    if (metaParts.length > 0) {
      contentDiv.appendChild(meta);
    }
    
    // Actions container
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'todo-actions';
    
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.className = 'edit-btn';
    editBtn.onclick = (e) => {
      e.stopPropagation();
      editBookmark(bookmark);
    };
    
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.className = 'delete-btn';
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      deleteBookmark(bookmark.id);
    };
    
    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(deleteBtn);
    
    // Show/hide actions based on edit-enable checkbox
    actionsDiv.style.display = editEnable.checked ? 'flex' : 'none';
    
    div.appendChild(contentDiv);
    div.appendChild(actionsDiv);
    
    return div;
  }

  // ブックマークを並び替え
  function sortBookmarks(bookmarks, sortBy) {
    const sorted = [...bookmarks];
    
    switch (sortBy) {
      case 'title':
        return sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      case 'category':
        return sorted.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
      default:
        return sorted; // デフォルトは作成日順（データの順序のまま）
    }
  }

  // ブックマークをカテゴリ別にグループ化
  function groupBookmarksByCategory(bookmarks) {
    const groups = {};
    bookmarks.forEach(bookmark => {
      const category = bookmark.category || 'Uncategorized';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(bookmark);
    });
    return groups;
  }

  async function loadBookmarks() {
    console.log('Loading bookmarks...');
    listContainer.innerHTML = '<div>Loading...</div>';
    
    try {
      // APIパラメータを構築
      const params = new URLSearchParams();
      
      // カテゴリフィルター
      if (categoryFilter.value) {
        params.append('category', categoryFilter.value);
      }
      
      const url = params.toString() ? `${API}?${params}` : API;
      const res = await fetch(url, {
        headers: authHeaders
      });
      if (!res.ok) throw new Error('Failed to load bookmarks');
      let bookmarks = await res.json();
      
      if (!Array.isArray(bookmarks)) {
        bookmarks = [];
      }
      
      // ソート適用
      bookmarks = sortBookmarks(bookmarks, sortSelect.value);
      
      listContainer.innerHTML = '';
      
      if (bookmarks.length === 0) {
        listContainer.innerHTML = '<div>No bookmarks found.</div>';
        return;
      }
      
      // 常にカテゴリ別グループ化 (要件: 常にカテゴリ分けを有効)
      const groups = groupBookmarksByCategory(bookmarks);
      
      Object.keys(groups).sort().forEach(category => {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'category-group collapsed'; // Start collapsed
        
        const header = document.createElement('div');
        header.className = 'category-header';
        
        const headerText = document.createElement('span');
        headerText.textContent = `${category.charAt(0).toUpperCase() + category.slice(1)} (${groups[category].length})`;
        
        const toggleIcon = document.createElement('span');
        toggleIcon.className = 'category-toggle';
        toggleIcon.textContent = '▼'; // Down arrow
        
        header.appendChild(headerText);
        header.appendChild(toggleIcon);
        
        // Add click handler for toggle
        header.addEventListener('click', () => {
          groupDiv.classList.toggle('collapsed');
        });
        
        groupDiv.appendChild(header);
        
        // Create container for bookmark items
        const itemsContainer = document.createElement('div');
        itemsContainer.className = 'category-items';
        
        groups[category].forEach(bookmark => {
          itemsContainer.appendChild(createBookmarkElement(bookmark));
        });
        
        groupDiv.appendChild(itemsContainer);
        listContainer.appendChild(groupDiv);
      });
      
    } catch (e) {
      listContainer.innerHTML = '<div>Error loading bookmarks.</div>';
      setMsg(e.message, false);
    }
    console.log('Bookmarks loaded successfully');
  }

  // フィルター/ソート変更時にリロード
  categoryFilter.addEventListener('change', loadBookmarks);
  sortSelect.addEventListener('change', loadBookmarks);

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const title = form.title.value.trim();
    const url = form.url.value.trim();
    const description = form.description.value.trim();
    const category = categoryInputForm.value.trim();
    const tagsInput = form.tags.value.trim();
    
    if (!url) {
      setMsg('URL is required', false);
      return;
    }

    // タグを配列に変換
    const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
    
    const isEditing = bookmarkIdInput.value.trim() !== '';
    
    try {
      // タイトルが空の場合はユーザーに通知
      if (!title) {
        setMsg('Fetching title from URL...', true);
      }
      
      const bookmarkData = {
        url,
        description,
        category: category || 'general',
        tags
      };
      
      // タイトルが提供されている場合のみ含める
      if (title) {
        bookmarkData.title = title;
      }
      
      let res;
      if (isEditing) {
        // Update existing bookmark
        res = await fetch(`${API}/${bookmarkIdInput.value}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            ...authHeaders
          },
          body: JSON.stringify(bookmarkData),
        });
      } else {
        // Create new bookmark
        res = await fetch(API, { 
          method: 'POST', 
          headers: { 
            'Content-Type': 'application/json',
            ...authHeaders
          }, 
          body: JSON.stringify(bookmarkData) 
        });
      }
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Failed to ${isEditing ? 'update' : 'add'} bookmark`);
      }
      
      // Reset form
      cancelEdit();
      
      setMsg(`Bookmark ${isEditing ? 'updated' : 'added'} successfully!`);
      
      // カテゴリが新しい場合はカテゴリリストを再読み込み
      await loadCategories();
      await loadBookmarks();
    } catch (e) {
      setMsg(e.message, false);
    }
  });

  // Cancel button handler
  cancelBtn.addEventListener('click', cancelEdit);

  // フィルター/ソート変更時にリロード
  categoryFilter.addEventListener('change', loadBookmarks);
  sortSelect.addEventListener('change', loadBookmarks);
  editEnable.addEventListener('change', loadBookmarks);

  // 初期化
  await loadCategories();
  await loadBookmarks();
});
