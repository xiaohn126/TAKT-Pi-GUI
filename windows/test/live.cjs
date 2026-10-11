// Opt-in integration test: uses the user's configured provider and incurs API usage.
const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
app.setPath('userData', path.join(process.env.APPDATA, 'TAKT Pi GUI'));
require(process.env.TAKT_TEST_MAIN || '../main.cjs');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
app.whenReady().then(async () => {
  const output = path.resolve(__dirname, '../../dist/windows/live-result.json');
  try {
    const win = BrowserWindow.getAllWindows()[0];
    while (!win.webContents.getURL().endsWith('index.html')) await delay(100);
    await delay(500);
    const settings = await win.webContents.executeJavaScript('window.takt.settings()');
    if (settings.mode !== 'local') throw new Error('Packaged setup IPC did not load local settings');
    await win.webContents.executeJavaScript(`void window.takt.connect(${JSON.stringify(settings)})`);
    for (let i = 0; !win.webContents.getURL().startsWith('http:'); i++) {
      if (i > 180) throw new Error('Local connection timed out');
      await delay(500);
    }
    const base = new URL(win.webContents.getURL()).origin;
    if (process.env.TAKT_STYLE_ONLY === '1') {
      await delay(6000);
      const results = [];
      for (const theme of ['light', 'dark']) {
        await win.webContents.executeJavaScript(`document.documentElement.classList.toggle('dark', ${theme === 'dark'});document.documentElement.dataset.theme=${JSON.stringify(theme)}`);
        await delay(200);
        const style = await win.webContents.executeJavaScript(`({accent:getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(),width:getComputedStyle(document.documentElement).getPropertyValue('--chat-content-max-width').trim(),background:getComputedStyle(document.body).backgroundColor,bar:!!document.getElementById('takt-titlebar'),composer:document.querySelector('.chat-input-textarea')?.parentElement&&getComputedStyle(document.querySelector('.chat-input-textarea').parentElement).borderRadius})`);
        if (style.accent !== '#ff6b3d' || style.width !== '760px' || !style.bar || style.composer !== '20px') throw new Error('Desktop theme did not apply: ' + JSON.stringify(style));
        const screenshot = await win.webContents.capturePage();
        fs.writeFileSync(path.join(path.dirname(output), `desktop-${theme}.png`), screenshot.toPNG());
        results.push({ theme, ...style });
      }
      win.setSize(960, 640); await delay(300);
      fs.writeFileSync(path.join(path.dirname(output), 'desktop-compact.png'), (await win.webContents.capturePage()).toPNG());
      win.setSize(1440, 940);
      fs.writeFileSync(path.join(path.dirname(output), 'theme-result.json'), JSON.stringify(results, null, 2));
      console.log('Desktop theme validated in light, dark, and compact layouts');
      return;
    }
    const request = async (method, route, body) => {
      const r = await win.webContents.session.fetch(base + route, { method, headers: { 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
      const data = await r.json();
      if (!r.ok) throw new Error(`${route}: HTTP ${r.status}: ${data.error || 'failed'}`);
      return data;
    };
    const first = await request('POST', '/api/agent/new', { cwd: path.resolve(__dirname, '../..'), type: 'prompt', message: '记住测试数字 73462。只回复 TAKT_DESKTOP_CHAT_OK，不使用工具。', provider: 'vanyo', modelId: 'claude-sonnet-5', toolNames: [] });
    const waitReply = async expected => {
      for (let i = 0; i < 120; i++) {
        const data = await request('GET', `/api/sessions/${first.sessionId}`);
        const state = await request('GET', `/api/agent/${first.sessionId}`);
        if (!state.state?.isStreaming && (data.context?.messages || []).some(message => message.role === 'assistant' && JSON.stringify(message.content).includes(expected))) return;
        await delay(500);
      }
      throw new Error('Expected assistant reply was not stored');
    };
    await waitReply('TAKT_DESKTOP_CHAT_OK');
    await request('POST', `/api/agent/${first.sessionId}`, { type: 'prompt', message: '刚才测试数字是多少？只回复数字。' });
    await waitReply('73462');
    const terminal = await request('POST', '/api/terminal', { cwd: path.resolve(__dirname, '../..'), cols: 100, rows: 30 });
    await request('POST', `/api/terminal/${terminal.id}`, { type: 'input', data: 'echo TAKT_DESKTOP_%OS%\r' });
    await request('POST', `/api/terminal/${terminal.id}`, { type: 'resize', cols: 120, rows: 40 });
    const events = await win.webContents.session.fetch(base + `/api/terminal/${terminal.id}/events`);
    const reader = events.body.getReader();
    let buffer = '';
    const timeout = setTimeout(() => reader.cancel(), 10000);
    while (!buffer.includes('TAKT_DESKTOP_Windows_NT')) {
      const chunk = await reader.read();
      if (chunk.done) throw new Error('Terminal output marker missing');
      buffer += new TextDecoder().decode(chunk.value);
    }
    clearTimeout(timeout); await reader.cancel();
    await request('DELETE', `/api/terminal/${terminal.id}`);
    const closed = await win.webContents.session.fetch(base + `/api/terminal/${terminal.id}`);
    if (closed.status !== 404) throw new Error('Terminal was not closed');
    fs.writeFileSync(output, JSON.stringify({ setupIPC: true, localAuthentication: true, model: 'vanyo/claude-sonnet-5', sessionId: first.sessionId, firstReply: true, contextReply: true, terminalOutput: 'TAKT_DESKTOP_Windows_NT', resize: true, close: true }, null, 2));
    console.log('Live desktop validation passed');
    // Keep the tested client and its local service running for the user.
  } catch (error) { fs.writeFileSync(output, JSON.stringify({ error: error.message })); console.error(error.message); app.quit(); }
});
