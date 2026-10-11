const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.TAKT_PLAYWRIGHT_MODULE || 'playwright');
const delay = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  let browser;
  const output = path.resolve(__dirname, '../../dist/windows/delivery-installed-result.json');
  try {
    for (let i = 0; i < 60; i++) {
      try { browser = await chromium.connectOverCDP('http://127.0.0.1:9322'); break; } catch { await delay(500); }
    }
    if (!browser) throw new Error('Installed application debugging connection failed');
    const page = browser.contexts()[0].pages()[0];
    if (!process.env.TAKT_TEST_CONFIG) throw new Error('Set TAKT_TEST_CONFIG to a private setup JSON file');
    const setup = JSON.parse(fs.readFileSync(process.env.TAKT_TEST_CONFIG));
    if (!page.url().startsWith('http:')) {
      await page.waitForURL('file:///**/index.html', { timeout: 30000 });
      await page.evaluate(s => { void window.takt.connect(s).then(r => { if (r?.error) document.getElementById('error').textContent = r.error; }); }, setup);
    }
    await page.waitForURL('http://127.0.0.1:*/', { timeout: 90000 });
    const base = new URL(page.url()).origin;
    const request = (method, route, body) => page.evaluate(async ({method, route, body}) => {
      const r = await fetch(route, { method, headers: {'Content-Type':'application/json'}, ...(body ? { body: JSON.stringify(body) } : {}) });
      const data = await r.json(); if (!r.ok) throw new Error(route + ': HTTP ' + r.status + ': ' + (data.error || 'failed')); return data;
    }, {method, route, body});
    const first = await request('POST', '/api/agent/new', { cwd: path.resolve(__dirname, '../..'), type:'prompt', message:'记住测试数字 49371。只回复 TAKT_INSTALL_CHAT_OK，不使用工具。', provider:'desktop', modelId:'gpt-6.1-sol', toolNames:[] });
    const reply = async expected => {
      for(let i=0;i<360;i++) {
        const data=await request('GET','/api/sessions/'+first.sessionId);
        const state=await request('GET','/api/agent/'+first.sessionId);
        if(!state.state?.isStreaming && (data.context?.messages||[]).some(m=>m.role==='assistant'&&JSON.stringify(m.content).includes(expected))) return;
        await delay(500);
      } throw new Error('Missing assistant reply '+expected);
    };
    await reply('TAKT_INSTALL_CHAT_OK');
    await request('POST','/api/agent/'+first.sessionId,{type:'prompt',message:'刚才测试数字是多少？只回复数字。'});
    await reply('49371');
    const terminal=await request('POST','/api/terminal',{cwd:path.resolve(__dirname,'../..'),cols:100,rows:30});
    await request('POST','/api/terminal/'+terminal.id,{type:'input',data:'echo TAKT_INSTALL_%OS%\r'});
    await request('POST','/api/terminal/'+terminal.id,{type:'resize',cols:120,rows:40});
    await page.evaluate(async id => {
      const r=await fetch('/api/terminal/'+id+'/events'); const reader=r.body.getReader(); let out='';
      const timeout=setTimeout(()=>reader.cancel(),10000);
      try { while(!out.includes('TAKT_INSTALL_Windows_NT')) {const chunk=await reader.read();if(chunk.done) throw new Error('Terminal output missing');out+=new TextDecoder().decode(chunk.value);} }
      finally {clearTimeout(timeout);await reader.cancel();}
    },terminal.id);
    await request('DELETE','/api/terminal/'+terminal.id);
    const closed=await page.evaluate(async id=>(await fetch('/api/terminal/'+id)).status,terminal.id);
    if(closed!==404) throw new Error('Terminal close failed');
    await page.goto(base+'/?session='+encodeURIComponent(first.sessionId));
    await page.getByText('TAKT_INSTALL_CHAT_OK',{exact:true}).waitFor();
    await page.getByText('49371',{exact:true}).waitFor();
    await page.screenshot({path:path.join(path.dirname(output),'delivery-installed-chat.png')});
    fs.writeFileSync(output,JSON.stringify({installedExecutable:true,model:'desktop/gpt-6.1-sol',sessionId:first.sessionId,firstReply:true,contextReply:true,rendered:true,terminalOutput:'TAKT_INSTALL_Windows_NT',resize:true,close:true,screenshot:true},null,2));
    console.log('Installed EXE conversation and terminal validation passed');
  } catch(error) {fs.writeFileSync(output,JSON.stringify({error:error.message})); console.error(error.message);process.exitCode=1;}
  finally {if(browser)await browser.close();}
})();
