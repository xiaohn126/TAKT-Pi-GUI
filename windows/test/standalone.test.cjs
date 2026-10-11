const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { validate } = require('../standalone.cjs');
test('standalone refuses weak authentication and invalid ports before launch', () => {
  const good = { port: 30141, password: 'a-strong-test-password', directory: path.resolve('.'), agentDirectory: path.resolve('agent') };
  assert.equal(validate(good), good);
  for (const port of [0, 80, 65536, '30141', 30141.5]) assert.throws(() => validate({ ...good, port }));
  for (const password of ['', null, 'short']) assert.throws(() => validate({ ...good, password }));
  assert.throws(() => validate({ ...good, agentDirectory: 'relative' }));
});
