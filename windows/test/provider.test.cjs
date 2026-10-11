const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { configureProvider } = require('../provider.cjs');
test('isolated provider setup retains saved key without exposing it and preserves other providers', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'takt-provider-'));
  try {
    fs.writeFileSync(path.join(dir, 'auth.json'), JSON.stringify({ other: { type: 'api_key', key: 'other' } }));
    const options = { baseUrl: 'https://example.com/v1', apiKey: 'test-only-key', models: 'a\nb', defaultModel: 'b' };
    assert.equal(JSON.stringify(configureProvider(dir, options)).includes(options.apiKey), false);
    configureProvider(dir, { ...options, apiKey: '' });
    const auth = JSON.parse(fs.readFileSync(path.join(dir, 'auth.json')));
    assert.equal(auth.desktop.key, options.apiKey); assert.equal(auth.other.key, 'other');
    assert.equal(JSON.parse(fs.readFileSync(path.join(dir, 'settings.json'))).defaultModel, 'b');
    assert.throws(() => configureProvider(dir, { ...options, defaultModel: 'missing' }));
    assert.throws(() => configureProvider(dir, { ...options, baseUrl: 'file:///C:/' }));
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
