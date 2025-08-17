document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('bookmark-form');
  const list = document.getElementById('list');
  const msg = document.getElementById('msg');
  
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

  async function load(){
    list.innerHTML = '<li>Loading...</li>';
    try {
      const res = await fetch(API);
      if(!res.ok) throw new Error('Load failed');
      const data = await res.json();
      if(!Array.isArray(data)) throw new Error('Invalid data');
      list.innerHTML = '';
      data.forEach(b => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="${b.url}" target="_blank" rel="noopener">${b.title || b.url}</a>`;
        list.appendChild(li);
      });
      if(!data.length) list.innerHTML = '<li>No bookmarks</li>';
    } catch(e){
      list.innerHTML = '<li>Error</li>';
      setMsg(e.message,false);
    }
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const title = form.title.value.trim();
    const url = form.url.value.trim();
    if(!title || !url){ setMsg('Both fields required', false); return; }
    try {
      const res = await fetch(API, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ title, url }) });
      if(!res.ok) throw new Error('Create failed');
      form.reset();
        setMsg('Added');
      load();
    } catch(e){ setMsg(e.message,false); }
  });

  load();
});
