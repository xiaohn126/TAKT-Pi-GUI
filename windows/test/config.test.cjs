const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { serverURL, serverCommand } = require('../config.cjs');
test('connection accepts roots and rejects credentials and unsafe protocols', () => {
  assert.equal(serverURL('http://127.0.0.1:30141/'), 'http://127.0.0.1:30141');
  assert.equal(serverURL('https://pi.example.com'), 'https://pi.example.com');
  for (const url of ['file:///C:/', 'javascript:alert(1)', 'https://pi:secret@example.com', 'https://example.com/api', 'https://example.com/?password=x']) assert.throws(() => serverURL(url));
});
test('locates Windows source builds and standalone servers including spaces', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'takt test '));
  try {
    assert.throws(() => serverCommand(dir));
    fs.mkdirSync(path.join(dir, 'node_modules/next/dist/bin'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'node_modules/next/dist/bin/next'), '');
    fs.mkdirSync(path.join(dir, '.next-native'));
    fs.writeFileSync(path.join(dir, '.next-native/BUILD_ID'), 'test');
    assert.equal(serverCommand(dir).dist, '.next-native');
    fs.writeFileSync(path.join(dir, 'server.js'), '');
    assert.deepEqual(serverCommand(dir), { cwd: dir, args: ['server.js'], dist: null });
  } finally { fs.rmSync(dir, { recursive: true }); }
});
