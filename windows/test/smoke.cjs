const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
require('../main.cjs');
app.whenReady().then(async () => {
  try {
    const win = BrowserWindow.getAllWindows()[0];
    await new Promise(resolve => win.webContents.once('did-finish-load', resolve));
    const state = await win.webContents.executeJavaScript('({title:document.title, bridge:typeof window.takt.connect, node:typeof require, button:document.getElementById("connect").textContent})');
    if (state.bridge !== 'function' || state.node !== 'undefined' || state.button !== '连接') throw new Error(JSON.stringify(state));
    const image = await win.webContents.capturePage();
    const output = path.resolve(__dirname, '../../dist/windows');
    fs.mkdirSync(output, { recursive: true });
    fs.writeFileSync(path.join(output, 'startup.png'), image.toPNG());
    const http = require('node:http');
    const server = http.createServer((req, res) => {
      res.setHeader('Content-Type', 'text/html');
      res.end('<!doctype html><title>TAKT test server</title><h1>Connected</h1>');
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const url = `http://127.0.0.1:${server.address().port}`;
    const loaded = new Promise(resolve => win.webContents.once('did-finish-load', resolve));
    await win.webContents.executeJavaScript(`void window.takt.connect({mode:'remote',url:${JSON.stringify(url)}})`);
    await loaded;
    if (win.webContents.getURL() !== url + '/') throw new Error('Remote navigation failed');
    const exposed = await win.webContents.executeJavaScript('window.takt.settings()');
    if (JSON.stringify(exposed) !== '{}') throw new Error('Remote page gained setup IPC access');
    await new Promise(resolve => server.close(resolve));
    console.log('Windows startup verified:', JSON.stringify(state));
    fs.writeFileSync(path.join(output, 'smoke-result.json'), JSON.stringify({ startup: state, remoteNavigation: true, remoteIPCBlocked: true }));
    app.exit(0);
  } catch (error) { console.error(error); app.exit(1); }
});
