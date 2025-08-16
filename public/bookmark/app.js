document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('bookmark-form');
  const list = document.getElementById('list');
  const msg = document.getElementById('msg');
  const API = 'http://localhost:3000/api/bookmarks';

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
