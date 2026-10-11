const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('takt', {
  connect: options => ipcRenderer.invoke('connect', options),
  directory: () => ipcRenderer.invoke('directory'),
  settings: () => ipcRenderer.invoke('settings')
});
