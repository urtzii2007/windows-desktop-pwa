const desktop = document.getElementById("desktop");
const startBtn = document.getElementById("start-btn");
const startMenu = document.getElementById("start-menu");
const clock = document.getElementById("clock");

// 🕒 Reloj
setInterval(() => {
  const now = new Date();
  clock.textContent = now.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
}, 1000);

// 🪟 Menú inicio
startBtn.onclick = () => startMenu.classList.toggle("hidden");

// 📄 Crear archivo
function createFile() {
  const icon = document.createElement("div");
  icon.className = "icon";
  icon.style.top = Math.random() * 400 + "px";
  icon.style.left = Math.random() * 600 + "px";
  icon.innerHTML = `<img src="https://cdn-icons-png.flaticon.com/512/337/337946.png"><span>Archivo</span>`;
  desktop.appendChild(icon);
  saveDesktop();
}

// 🖼️ Cambiar fondo
function changeWallpaper() {
  const url = prompt("Pega la URL del fondo:");
  if (url) {
    desktop.style.backgroundImage = `url('${url}')`;
    localStorage.setItem("wallpaper", url);
  }
}

// 💾 Guardar y cargar escritorio
function saveDesktop() {
  const icons = Array.from(document.querySelectorAll(".icon")).map(icon => ({
    top: icon.style.top,
    left: icon.style.left,
    label: icon.querySelector("span").textContent
  }));
  localStorage.setItem("desktopIcons", JSON.stringify(icons));
}

function loadDesktop() {
  const icons = JSON.parse(localStorage.getItem("desktopIcons") || "[]");
  const wallpaper = localStorage.getItem("wallpaper");
  if (wallpaper) desktop.style.backgroundImage = `url('${wallpaper}')`;

  icons.forEach(i => {
    const icon = document.createElement("div");
    icon.className = "icon";
    icon.style.top = i.top;
    icon.style.left = i.left;
    icon.innerHTML = `<img src="https://cdn-icons-png.flaticon.com/512/337/337946.png"><span>${i.label}</span>`;
    desktop.appendChild(icon);
  });
}

loadDesktop();
