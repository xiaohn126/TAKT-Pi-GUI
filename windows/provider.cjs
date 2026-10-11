const fs = require('node:fs');
const path = require('node:path');
function readJSON(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return {}; throw new Error('配置文件无法读取，请先修复或备份：' + file); }
}
function configureProvider(directory, options) {
  const base = new URL(options.baseUrl);
  if (!['https:', 'http:'].includes(base.protocol) || base.username || base.password || base.search || base.hash) throw new Error('请输入有效的 API 根地址（含 /v1），不要在地址中填写密钥。');
  const ids = [...new Set(String(options.models || '').split(/[\n,，]/).map(s => s.trim()).filter(Boolean))];
  if (!ids.length || !ids.includes(options.defaultModel)) throw new Error('请填写模型列表，并选择列表中的默认模型。');
  fs.mkdirSync(directory, { recursive: true });
  const auth = readJSON(path.join(directory, 'auth.json'));
  const key = String(options.apiKey || '').trim() || auth.desktop?.key;
  if (!key) throw new Error('请填写自己的 API Key。');
  const models = readJSON(path.join(directory, 'models.json'));
  const settings = readJSON(path.join(directory, 'settings.json'));
  auth.desktop = { type: 'api_key', key };
  models.providers ||= {};
  models.providers.desktop = { baseUrl: base.href.replace(/\/$/, ''), api: 'openai-completions', models: ids.map(id => ({ id, input: ['text'], contextWindow: 128000, maxTokens: 4096, reasoning: false })) };
  settings.defaultProvider = 'desktop'; settings.defaultModel = options.defaultModel;
  for (const [name, data] of Object.entries({ auth, models, settings })) {
    const file = path.join(directory, name + '.json');
    fs.writeFileSync(file + '.tmp', JSON.stringify(data, null, 2), { mode: 0o600 });
    fs.renameSync(file + '.tmp', file);
  }
  return { baseUrl: models.providers.desktop.baseUrl, models: ids.join('\n'), defaultModel: options.defaultModel };
}
module.exports = { configureProvider };
