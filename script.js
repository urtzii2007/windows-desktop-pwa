/* ========= Config & Estado ========= */
const FAVICON = d => `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(d)}`;
const desktop = document.getElementById('desktop');
const tplIcon = document.getElementById('tpl-icon');
const start = document.getElementById('start');
const pinnedGrid = document.getElementById('pinned');
const tbApps = document.getElementById('taskbar-apps');
const btnStart = document.getElementById('btn-start');
const btnAdd = document.getElementById('btn-add');
const btnWall = document.getElementById('btn-wall');
const clock = document.getElementById('clock');
const search = document.getElementById('search');
const ctx = document.getElementById('context-menu');
const ctxNew = document.getElementById('ctx-new-file');
const ctxWall = document.getElementById('ctx-change-wall');

let apps = JSON.parse(localStorage.getItem('apps') || '[]');
let icons = JSON.parse(localStorage.getItem('desktopIcons') || '[]');

if (apps.length === 0) {
  apps = [
    { id: crypto.randomUUID(), title: 'Gmail', url: 'https://mail.google.com/' },
    { id: crypto.randomUUID(), title: 'YouTube', url: 'https://youtube.com/' },
    { id: crypto.randomUUID(), title: 'Google', url: 'https://www.google.com/' },
    { id: crypto.randomUUID(), title: 'Drive', url: 'https://drive.google.com/' },
    { id: crypto.randomUUID(), title: 'Twitter/X', url: 'https://x.com/' },
    { id: crypto.randomUUID(), title: 'Spotify', url: 'https://open.spotify.com/' },
  ];
}

/* ========= Reloj ========= */
function tick(){
  const now = new Date();
  clock.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
tick(); setInterval(tick, 1000);

/* ========= Render ========= */
function renderTaskbar(){
  tbApps.innerHTML = '';
  apps.slice(0,8).forEach(a => {
    const b = document.createElement('button');
    b.className = 'tb-app'; b.title = a.title;
    const img = document.createElement('img');
    img.src = FAVICON(a.url); img.alt = a.title;
    b.appendChild(img);
    b.onclick = () => openApp(a);
    tbApps.appendChild(b);
  });
}

function renderStart(filter = ''){
  pinnedGrid.innerHTML = '';
  const list = apps
    .filter(a => a.title.toLowerCase().includes(filter) || a.url.toLowerCase().includes(filter));
  list.forEach(a => {
    const card = document.createElement('div');
    card.className = 'card'; card.title = a.url;
    card.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px">
        <img class="app-icon" src="${FAVICON(a.url)}" alt="${a.title}">
        <div>
          <div class="app-title">${a.title}</div>
          <div style="font-size:12px;color:#aeb3bd">${new URL(a.url).hostname}</div>
        </div>
      </div>`;
    card.onclick = () => openApp(a);
    card.oncontextmenu = e => {
      e.preventDefault();
      if (confirm(`Quitar "${a.title}" de Inicio?`)) {
        apps = apps.filter(x => x.id !== a.id);
        saveAll(); render();
      }
    };
    pinnedGrid.appendChild(card);
  });
}

function renderDesktop(){
  desktop.querySelectorAll('.icon').forEach(n=>n.remove());
  icons.forEach(i => {
    const node = tplIcon.content.firstElementChild.cloneNode(true);
    node.style.top = i.top; node.style.left = i.left;
    node.querySelector('.icon-img').src = FAVICON(i.url);
    node.querySelector('.icon-label').textContent = i.title;
    node.onclick = () => openUrl(i.url);
    enableDrag(node);
    desktop.appendChild(node);
  });
  // fondo
  const wall = localStorage.getItem('wallpaper');
  if (wall) desktop.style.backgroundImage = `url('${wall}')`;
}

function render(){
  renderTaskbar();
  renderStart(search.value.trim().toLowerCase());
  renderDesktop();
}

/* ========= Acciones ========= */
function openUrl(url){ window.open(url, '_blank'); }
function openApp(a){ openUrl(a.url); }

btnStart.onclick = () => start.classList.toggle('hidden');

btnAdd.onclick = async () => {
  const title = prompt('Nombre de la app (p.ej. Notion)');
  if (!title) return;
  const url = prompt('URL completa (https://...)');
  try { new URL(url); } catch { alert('URL no válida'); return; }
  apps.unshift({ id: crypto.randomUUID(), title, url });
  saveAll(); render();
};

btnWall.onclick = changeWallpaper;
search.oninput = () => renderStart(search.value.trim().toLowerCase());

function changeWallpaper(){
  const url = prompt('Pega una URL de imagen para fondo:');
  if (url) { localStorage.setItem('wallpaper', url); renderDesktop(); }
}

/* ======= Desktop: click derecho ======= */
desktop.addEventListener('contextmenu', e => {
  e.preventDefault();
  ctx.style.left = e.pageX + 'px';
  ctx.style.top = e.pageY + 'px';
  ctx.classList.remove('hidden');
});
document.addEventListener('click', () => ctx.classList.add('hidden'));
ctxNew.onclick = () => {
  const title = prompt('Nombre del acceso directo:');
  if (!title) return;
  const url = prompt('URL completa (https://...)');
  try { new URL(url); } catch { alert('URL no válida'); return; }
  const pos = { top: Math.floor(80 + Math.random()*300) + 'px', left: Math.floor(40 + Math.random()*500) + 'px' };
  icons.push({ title, url, ...pos });
  saveAll(); renderDesktop();
};
ctxWall.onclick = changeWallpaper;

/* ========= Drag & Drop (escritorio) ========= */
function enableDrag(el){
  let startX=0,startY=0,offX=0,offY=0;
  const onDown = e => {
    const p = el.getBoundingClientRect();
    startX = e.clientX; startY = e.clientY;
    offX = p.left; offY = p.top + window.scrollY;
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };
  const onMove = e => {
    const nx = offX + (e.clientX - startX);
    const ny = offY + (e.clientY - startY);
    el.style.left = Math.max(6, nx) + 'px';
    el.style.top  = Math.max(6, ny) + 'px';
  };
  const onUp = () => {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    // persistir
    const label = el.querySelector('.icon-label').textContent;
    const idx = icons.findIndex(i => i.title === label);
    if (idx>-1){ icons[idx].left = el.style.left; icons[idx].top = el.style.top; saveAll(); }
  };
  el.addEventListener('mousedown', onDown);
}

/* ========= Persistencia ========= */
function saveAll(){
  localStorage.setItem('apps', JSON.stringify(apps));
  localStorage.setItem('desktopIcons', JSON.stringify(icons));
}

/* ========= SW registro ========= */
if ('serviceWorker' in navigator){
  window.addEventListener('load', ()=>navigator.serviceWorker.register('./service-worker.js'));
}

/* ========= Init ========= */
render();
