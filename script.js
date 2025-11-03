// Utilidades
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const FAVICON = d => `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(d)}`;

const desktop = $('#desktop');
const tplIcon = $('#tpl-icon');

const ctx = $('#ctx');
const ctxNew = $('#ctx-new');
const ctxNewSub = $('#ctx-new-sub');
const ctxWall = $('#ctx-wall');
const wallInput = $('#wall-input');
const ctxTitle = $('#ctx-title');

const addBtn = $('#add-shortcut');
const dlg = $('#dlg-add');
const preset = $('#preset');
const customWrap = $('#custom-wrap');
const customName = $('#custom-name');
const customUrl = $('#custom-url');
const addOk = $('#add-ok');
const addCancel = $('#add-cancel');

const tbCenter = $('#tb-center');
const clock = $('#clock');
const barTitle = $('#bar-title');

// Estado
let items = JSON.parse(localStorage.getItem('desktopItems') || '[]');
let wallpaper = localStorage.getItem('wallpaperDataUrl') || '';
let titleText = localStorage.getItem('barTitle') || 'Escritorio';

// Fondo y título guardados
if (wallpaper) desktop.style.backgroundImage = `url('${wallpaper}')`;
barTitle.textContent = titleText;

// 🕒 Reloj con fecha
function tick(){
  const now = new Date();
  const time = now.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
  const date = now.toLocaleDateString([], {weekday:'short', day:'2-digit', month:'2-digit', year:'numeric'});
  clock.innerHTML = `<span>${date}</span><span>${time}</span>`;
}
tick(); setInterval(tick, 1000);

// 🧱 Render de escritorio
function renderDesktop(){
  $$('.icon').forEach(n=>n.remove());
  items.forEach(i => {
    const node = tplIcon.content.firstElementChild.cloneNode(true);
    node.dataset.id = i.id;
    node.style.top = i.top;
    node.style.left = i.left;

    const img = node.querySelector('.icon-img');
    node.querySelector('.icon-label').textContent = i.title;

    if (i.type === 'shortcut') {
      img.src = FAVICON(i.url);
      node.ondblclick = () => openUrl(i.url);
    } else if (i.type === 'folder') {
      img.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(folderSVG('#f1c40f'));
      node.ondblclick = () => alert('(Demo) Carpeta vacía');
    } else if (i.type === 'text') {
      img.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(fileSVG('#6ab0ff'));
      node.ondblclick = () => alert('(Demo) Archivo de texto');
    }

    enableDrag(node);
    desktop.appendChild(node);
  });

  // Mostrar accesos anclados (máx 8)
  tbCenter.innerHTML = '';
  items.filter(i=>i.type==='shortcut').slice(0,8).forEach(i=>{
    const b = document.createElement('button');
    b.className = 'bubble';
    const img = document.createElement('img');
    img.src = FAVICON(i.url);
    img.width = 20;
    img.height = 20;
    img.style.borderRadius='6px';
    b.title = i.title;
    b.appendChild(img);
    b.onclick = () => openUrl(i.url);
    tbCenter.appendChild(b);
  });
}
renderDesktop();

// 🖱️ Drag & drop
function enableDrag(el){
  let sx=0, sy=0, ox=0, oy=0;
  const onDown = e => {
    const r = el.getBoundingClientRect();
    sx = e.clientX; sy = e.clientY; ox = r.left; oy = r.top + window.scrollY;
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };
  const onMove = e => {
    el.style.left = Math.max(6, ox + (e.clientX - sx)) + 'px';
    el.style.top  = Math.max(6, oy + (e.clientY - sy)) + 'px';
  };
  const onUp = () => {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    const id = el.dataset.id;
    const it = items.find(x=>x.id===id);
    if (it){ it.left = el.style.left; it.top = el.style.top; save(); }
  };
  el.addEventListener('mousedown', onDown);
}

// 💾 Guardar
function save(){
  localStorage.setItem('desktopItems', JSON.stringify(items));
}

// 🧭 Menú contextual
desktop.addEventListener('contextmenu', e=>{
  e.preventDefault();
  ctxNewSub.classList.add('hidden');
  ctx.style.left = e.pageX + 'px';
  ctx.style.top = e.pageY + 'px';
  ctx.classList.remove('hidden');
});
document.addEventListener('click', ()=> ctx.classList.add('hidden'));

$('#new-folder').onclick = ()=> makeItem('folder', 'Nueva carpeta');
$('#new-text').onclick = ()=> makeItem('text', 'Nuevo texto');

ctxTitle.onclick = ()=>{
  const val = prompt('Título de la barra:', barTitle.textContent.trim());
  if (!val) return;
  barTitle.textContent = val;
  localStorage.setItem('barTitle', val);
};

ctxNew.addEventListener('mouseenter', ()=> ctxNewSub.classList.remove('hidden'));
ctxNew.addEventListener('mouseleave', ()=> ctxNewSub.classList.add('hidden'));

// 🖼️ Configurar fondo (archivo local)
ctxWall.onclick = ()=> wallInput.click();
wallInput.onchange = async e=>{
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    wallpaper = reader.result; // DataURL
    localStorage.setItem('wallpaperDataUrl', wallpaper);
    desktop.style.backgroundImage = `url('${wallpaper}')`;
  };
  reader.readAsDataURL(file);
  wallInput.value = '';
};

// ➕ Añadir acceso directo
addBtn.onclick = ()=>{
  preset.value = '';
  customWrap.classList.add('hidden');
  customName.value = '';
  customUrl.value = '';
  dlg.showModal();
};
preset.onchange = ()=> customWrap.classList.toggle('hidden', preset.value !== 'custom');
addCancel.onclick = ()=> dlg.close();
addOk.onclick = ()=>{
  let data;
  if (preset.value === 'custom'){
    const name = (customName.value || '').trim();
    const url = (customUrl.value || '').trim();
    if (!name || !validUrl(url)) { alert('Completa nombre y URL válidos.'); return; }
    data = { title: name, url };
  } else if (preset.value){
    data = JSON.parse(preset.value);
  } else {
    alert('Elige una app o “Personalizada…”.'); return;
  }
  makeItem('shortcut', data.title, { url: data.url });
  dlg.close();
};

// ✅ Valida URLs y esquemas personalizados (deep links)
function validUrl(u){
  // Acepta http(s), intent://, spotify://, whatsapp://, etc.
  return /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(u);
}

// 🚀 Abre URL o deep link
function openUrl(url){
  if (/^(intent|mailto|tel|sms|spotify|whatsapp|vscode|slack|zoom):/i.test(url)) {
    window.location.href = url;
  } else {
    window.open(url, '_blank');
  }
}

// 🗂 Crear nuevo elemento en escritorio
function makeItem(type, title, extra={}){
  const pos = { top: Math.floor(80 + Math.random()*300) + 'px', left: Math.floor(40 + Math.random()*500) + 'px' };
  items.push({ id: crypto.randomUUID(), type, title, ...extra, ...pos });
  save(); renderDesktop();
}

// SVG íconos simples
function folderSVG(color='#f1c40f'){
  return `<svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 24 24" fill="${color}">
    <path d="M10 4l2 2h7a3 3 0 013 3v7a3 3 0 01-3 3H5a3 3 0 01-3-3V7a3 3 0 013-3h5z" />
  </svg>`;
}
function fileSVG(color='#6ab0ff'){
  return `<svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 24 24" fill="${color}">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12V8l-4-6z"/>
  </svg>`;
}

// 🔒 Service Worker
if ('serviceWorker' in navigator){
  window.addEventListener('load', ()=> navigator.serviceWorker.register('./service-worker.js'));
}

