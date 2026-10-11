const $ = id => document.getElementById(id);
$('mode').onchange = () => { $('remote').hidden = $('mode').value !== 'remote'; $('local').hidden = $('mode').value !== 'local'; };
$('browse').onclick = async () => { const dir = await window.takt.directory(); if (dir) $('directory').value = dir; };
window.takt.settings().then(s => { for (const key of ['mode', 'url', 'directory', 'node']) if (s[key]) $(key).value = s[key]; $('mode').onchange(); });
$('connect').onclick = async () => {
  $('connect').disabled = true; $('error').textContent = '正在连接…';
  try { const result = await window.takt.connect(Object.fromEntries(['mode','url','directory','node'].map(k => [k, $(k).value]))); if (result?.error) $('error').textContent = result.error; }
  catch { $('error').textContent = '连接失败，请重试。'; }
  finally { $('connect').disabled = false; }
};
