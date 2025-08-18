document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('bookmark-form');
  const listContainer = document.getElementById('list-container');
  const msg = document.getElementById('msg');
  const categoryFilter = document.getElementById('category-filter');
  const sortSelect = document.getElementById('sort-select');
  const categorySelectForm = document.getElementById('category-select');
  
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
      API = `${currentProtocol}//${window.location.host}/api/bookmarks`;
    } else {
      // 開発環境: 直接ポート指定
      const currentPort = config.port;
      API = `${currentProtocol}//${currentHost}:${currentPort}/api/bookmarks`;
    }
  } catch (e) {
    // フォールバック: 現在のホストとポートを使用
    API = `${window.location.protocol}//${window.location.host}/api/bookmarks`;
  }

  function setMsg(t, ok=true){
    msg.textContent = t;
    msg.style.color = ok ? '#0a0' : '#c00';
    if(t) setTimeout(()=>{ if(msg.textContent===t) msg.textContent=''; }, 2500);
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

  // ブックマークアイテムのHTMLを生成
  function createBookmarkElement(bookmark) {
    const div = document.createElement('div');
    div.className = 'bookmark-item';
    div.setAttribute('data-bookmark-id', bookmark.id);
    
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
    
    div.appendChild(title);
    if (metaParts.length > 0) {
      div.appendChild(meta);
    }
    
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
      const res = await fetch(url);
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
        groupDiv.className = 'category-group';
        
        const header = document.createElement('div');
        header.className = 'category-header';
        header.textContent = `${category.charAt(0).toUpperCase() + category.slice(1)} (${groups[category].length})`;
        groupDiv.appendChild(header);
        
        groups[category].forEach(bookmark => {
          groupDiv.appendChild(createBookmarkElement(bookmark));
        });
        
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
    const category = form['category-select'].value.trim();
    const tagsInput = form.tags.value.trim();
    
    if (!title || !url) {
      setMsg('Title and URL are required', false);
      return;
    }

    // タグを配列に変換
    const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
    
    try {
      const bookmarkData = {
        title,
        url,
        description,
        category: category || 'general',
        tags
      };
      
      const res = await fetch(API, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(bookmarkData) 
      });
      
      if (!res.ok) throw new Error('Create failed');
      
      form.reset();
      setMsg('Added');
      
      // カテゴリが新しい場合はカテゴリリストを再読み込み
      await loadCategories();
      await loadBookmarks();
    } catch (e) {
      setMsg(e.message, false);
    }
  });

  // 初期化
  await loadCategories();
  await loadBookmarks();
});
