const fs = require('node:fs');
const path = require('node:path');
function serverURL(value) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error('请输入 pi-web 根地址，例如 http://127.0.0.1:30141');
  }
  return url.origin;
}
function serverCommand(directory) {
  const cwd = path.resolve(directory);
  if (fs.existsSync(path.join(cwd, 'server.js'))) return { cwd, args: ['server.js'], dist: null };
  const cli = 'node_modules/next/dist/bin/next';
  const dist = ['.next-native', '.next'].find(name => fs.existsSync(path.join(cwd, name, 'BUILD_ID')));
  if (!dist || !fs.existsSync(path.join(cwd, cli))) throw new Error('该目录没有已构建的 pi-web 服务，请先安装依赖并构建。');
  return { cwd, args: [cli, 'start', '-H', '127.0.0.1'], dist };
}
module.exports = { serverURL, serverCommand };
