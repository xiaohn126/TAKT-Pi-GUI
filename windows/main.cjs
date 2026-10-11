const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const { spawn } = require('node:child_process');
const { randomBytes } = require('node:crypto');
const { serverURL, serverCommand } = require('./config.cjs');
let win, child, origin, stopping = false;
const setup = () => win.loadFile(path.join(__dirname, 'index.html'));
function trusted(event) { return event.sender === win.webContents && event.senderFrame.url === require('node:url').pathToFileURL(path.join(__dirname, 'index.html')).href; }
function stop() {
  if (!child) return;
  const proc = child; child = null;
  if (process.platform === 'win32') spawn('taskkill', ['/pid', String(proc.pid), '/T', '/F'], { windowsHide: true });
  else proc.kill();
}
async function freePort() {
  return new Promise((resolve, reject) => { const s = net.createServer(); s.once('error', reject); s.listen(0, '127.0.0.1', () => { const port = s.address().port; s.close(() => resolve(port)); }); });
}
async function connect(options) {
  stop(); origin = null;
  let target;
  if (options.mode === 'local') {
    const command = serverCommand(options.directory);
    const port = await freePort();
    const password = randomBytes(24).toString('base64url');
    const logPath = path.join(app.getPath('userData'), 'sidecar.log');
    const log = fs.createWriteStream(logPath, { flags: 'a' });
    const env = { ...process.env, PORT: String(port), HOSTNAME: '127.0.0.1', PI_WEB_PASSWORD: password, NODE_ENV: 'production', NEXT_TELEMETRY_DISABLED: '1' };
    if (command.dist) env.PI_WEB_DIST_DIR = command.dist;
    const args = command.dist ? [...command.args, '-p', String(port)] : command.args;
    const proc = spawn(options.node || 'node', args, { cwd: command.cwd, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    child = proc;
    proc.stdout.pipe(log, { end: false }); proc.stderr.pipe(log, { end: false });
    let failure;
    proc.once('error', error => { failure = error; log.end(); });
    proc.once('exit', () => { failure = new Error('本机服务已退出，请检查 sidecar.log'); log.end(); if (child === proc) { child = null; if (origin && !stopping) { dialog.showErrorBox('服务已退出', failure.message); setup(); } } });
    target = `http://127.0.0.1:${port}`;
    let ready = false;
    for (let attempt = 0; attempt < 120; attempt++) {
      if (failure) throw failure;
      try { const r = await fetch(`${target}/api/home`, { headers: { Authorization: 'Basic ' + Buffer.from(`pi:${password}`).toString('base64') }, signal: AbortSignal.timeout(1000) }); if (r.ok) { ready = true; break; } } catch {}
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    if (!ready) throw new Error(`服务启动超时。日志：${logPath}`);
    // Use the server's HttpOnly login cookie; never expose the generated password to the page.
    const response = await win.webContents.session.fetch(`${target}/api/web-auth`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
    if (!response.ok) throw new Error('服务不支持网页登录，请使用新版 pi-web 或远程模式。');
  } else if (options.mode === 'remote') target = serverURL(options.url);
  else throw new Error('无效的连接方式');
  origin = target;
  fs.writeFileSync(path.join(app.getPath('userData'), 'connection.json'), JSON.stringify(options, null, 2));
  await win.loadURL(target);
}
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => { if (win) { win.restore(); win.focus(); } });
  app.whenReady().then(() => {
    win = new BrowserWindow({ width: 1440, height: 940, minWidth: 800, minHeight: 600, title: 'TAKT Pi GUI', webPreferences: { preload: path.join(__dirname, 'preload.cjs'), nodeIntegration: false, contextIsolation: true, sandbox: true, partition: 'takt-session' } });
    win.webContents.on('will-navigate', (event, url) => { if (!origin || new URL(url).origin !== origin) event.preventDefault(); });
    win.webContents.on('will-redirect', (event, url) => { if (!origin || new URL(url).origin !== origin) event.preventDefault(); });
    win.webContents.setWindowOpenHandler(({ url }) => { if (url.startsWith('https://') || url.startsWith('http://')) shell.openExternal(url); return { action: 'deny' }; });
    win.webContents.session.setPermissionRequestHandler((_wc, _permission, callback) => callback(false));
    ipcMain.handle('connect', async (event, options) => { if (!trusted(event)) return; try { await connect(options); return {}; } catch (error) { stop(); origin = null; return { error: error.message }; } });
    ipcMain.handle('directory', async event => { if (!trusted(event)) return; const r = await dialog.showOpenDialog(win, { properties: ['openDirectory'] }); return r.filePaths[0]; });
    ipcMain.handle('settings', event => { if (!trusted(event)) return {}; try { return JSON.parse(fs.readFileSync(path.join(app.getPath('userData'), 'connection.json'), 'utf8')); } catch { return {}; } });
    Menu.setApplicationMenu(Menu.buildFromTemplate([{ label: 'TAKT', submenu: [{ label: '连接设置', accelerator: 'Ctrl+Shift+C', click: () => { stop(); origin = null; setup(); } }, { label: '打开日志目录', click: () => shell.openPath(app.getPath('userData')) }, { role: 'quit' }] }, { role: 'editMenu' }, { role: 'viewMenu' }]));
    setup();
  });
  app.on('before-quit', () => { stopping = true; stop(); });
  app.on('window-all-closed', () => app.quit());
}
