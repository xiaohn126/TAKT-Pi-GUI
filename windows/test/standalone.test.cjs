const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const { validate } = require('../standalone.cjs');
test('standalone refuses weak authentication and invalid ports before launch', () => {
  const good = { port: 30141, password: 'a-strong-test-password', directory: path.resolve('.'), agentDirectory: path.resolve('agent') };
  assert.equal(validate(good), good);
  for (const port of [0, 80, 65536, '30141', 30141.5]) assert.throws(() => validate({ ...good, port }));
  for (const password of ['', null, 'short']) assert.throws(() => validate({ ...good, password }));
  assert.throws(() => validate({ ...good, agentDirectory: 'relative' }));
  assert.throws(() => validate({ ...good, publicURL: 'http://pi.example.com' }));
  assert.throws(() => validate({ ...good, publicURL: 'https://pi:secret@pi.example.com' }));
  assert.equal(validate({ ...good, publicURL: 'https://pi.example.com' }).publicURL, 'https://pi.example.com');
});
test('scheduled launch can read explicit state without a user profile environment', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'takt-server-'));
  try {
    fs.writeFileSync(path.join(directory, 'server.js'), '');
    fs.writeFileSync(path.join(directory, 'server.json'), JSON.stringify({ port: 30141, password: 'strong-test-password', directory, agentDirectory: directory, node: process.execPath }));
    const result = spawnSync(process.execPath, [path.resolve(__dirname, '../standalone.cjs'), 'check', '--state', directory], { encoding: 'utf8', env: { ...process.env, TAKT_SERVER_STATE: path.join(directory, 'missing-profile') } });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Configuration valid/);
    assert.doesNotMatch(result.stdout, /strong-test-password/);
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});
