const $ = id => document.getElementById(id);
$('mode').onchange = () => { for (const mode of ['bundled', 'remote', 'local']) $(mode).hidden = $('mode').value !== mode; };
$('browse').onclick = async () => { const dir = await window.takt.directory(); if (dir) $('directory').value = dir; };
const fields = ['mode', 'url', 'directory', 'node', 'baseUrl', 'apiKey', 'models', 'defaultModel'];
window.takt.settings().then(s => { for (const key of fields) if (s[key] && key !== 'apiKey') $(key).value = s[key]; $('mode').onchange(); });
$('connect').onclick = async () => {
  $('connect').disabled = true; $('error').textContent = '正在连接…';
  try { const result = await window.takt.connect(Object.fromEntries(fields.map(k => [k, $(k).value]))); if (result?.error) $('error').textContent = result.error; }
  catch { $('error').textContent = '连接失败，请重试。'; }
  finally { $('connect').disabled = false; }
};
