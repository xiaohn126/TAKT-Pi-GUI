const { contextBridge, ipcRenderer } = require('electron');
window.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('takt-desktop');
  const bar = document.createElement('header');
  bar.id = 'takt-titlebar'; bar.textContent = 'TAKT Pi GUI';
  bar.setAttribute('aria-label', 'TAKT Pi GUI window title');
  document.body.prepend(bar);
  const syncTheme = () => ipcRenderer.send('desktop-theme', document.documentElement.classList.contains('dark') || ['dark', 'forest'].includes(document.documentElement.dataset.theme));
  new MutationObserver(syncTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
  syncTheme();
});
contextBridge.exposeInMainWorld('takt', {
  connect: options => ipcRenderer.invoke('connect', options),
  directory: () => ipcRenderer.invoke('directory'),
  settings: () => ipcRenderer.invoke('settings')
});
