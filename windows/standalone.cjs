// Independent pi-web host. Secrets belong in the private state directory, never argv.
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { randomBytes } = require('node:crypto');
const { serverCommand, serverURL } = require('./config.cjs');
const stateArgument = process.argv.indexOf('--state');
const state = stateArgument >= 0 ? process.argv[stateArgument + 1] : process.env.TAKT_SERVER_STATE || path.join(process.env.ProgramData || process.env.LOCALAPPDATA || process.env.HOME, 'TAKT-Pi-Server');
if (!state || !path.isAbsolute(state)) throw new Error('State directory must be absolute');
const configFile = path.join(state, 'server.json');
function validate(c) {
  if (!Number.isInteger(c.port) || c.port < 1024 || c.port > 65535) throw new Error('Invalid fixed port');
  if (typeof c.password !== 'string' || c.password.length < 16) throw new Error('Password must have at least 16 characters');
  if (!path.isAbsolute(c.directory) || !path.isAbsolute(c.agentDirectory)) throw new Error('Backend and agent directories must be absolute');
  if (c.publicURL && !serverURL(c.publicURL).startsWith('https://')) throw new Error('Public URL must use HTTPS');
  return c;
}
function initialize() {
  fs.mkdirSync(state, { recursive: true });
  if (fs.existsSync(configFile)) throw new Error('Configuration already exists; edit it locally to change settings');
  const runtime = path.join(__dirname, 'runtime', 'delivery');
  const c = validate({ port: 30141, password: randomBytes(32).toString('base64url'), directory: path.join(runtime, 'package'), node: path.join(runtime, 'node.exe'), agentDirectory: path.join(state, 'agent'), publicURL: 'https://pi.xiao-dev.top', cloudflared: '', tunnelConfig: '', tokenFile: '' });
  fs.mkdirSync(c.agentDirectory, { recursive: true });
  fs.writeFileSync(configFile, JSON.stringify(c, null, 2), { flag: 'wx', mode: 0o600 });
  console.log(`Configuration created: ${configFile}\nPassword stays in this file. Configure models in the private agent directory.`);
}
function launch(c) {
  validate(c);
  if (c.cloudflared && (!!c.tunnelConfig === !!c.tokenFile)) throw new Error('Configure exactly one of tunnelConfig or tokenFile');
  for (const file of [c.node, c.cloudflared, c.tunnelConfig, c.tokenFile].filter(Boolean)) if (!fs.existsSync(file)) throw new Error('Missing configured file');
  fs.mkdirSync(path.join(state, 'logs'), { recursive: true });
  const command = serverCommand(c.directory);
  const env = { ...process.env, PORT: String(c.port), HOSTNAME: '127.0.0.1', PI_WEB_PASSWORD: c.password, PI_CODING_AGENT_DIR: c.agentDirectory, NODE_ENV: 'production', NEXT_TELEMETRY_DISABLED: '1' };
  // pi-web rejects unknown Host headers before authentication; trust only our public host.
  if (c.publicURL) env.PI_WEB_HOSTNAME = new URL(c.publicURL).host;
  env.PATH = path.dirname(c.node) + path.delimiter + (env.PATH || '');
  if (command.dist) env.PI_WEB_DIST_DIR = command.dist;
  const children = new Set();
  let closing = false;
  const timers = new Set();
  function supervise(name, exe, args, cwd, childEnv) {
    if (closing) return;
    const log = fs.createWriteStream(path.join(state, 'logs', name + '.log'), { flags: 'a' });
    log.write(`\n[${new Date().toISOString()}] Starting ${name}\n`);
    const p = spawn(exe, args, { cwd, env: childEnv, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    children.add(p);
    p.stdout.pipe(log, { end: false }); p.stderr.pipe(log, { end: false });
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true; children.delete(p); log.end();
      if (!closing) { const timer = setTimeout(() => { timers.delete(timer); supervise(name, exe, args, cwd, childEnv); }, 5000); timers.add(timer); }
    };
    p.once('error', () => { log.write('Process could not start; check executable path and permissions.\n'); finish(); });
    p.once('exit', finish);
  }
  supervise('backend', c.node, command.dist ? [...command.args, '-p', String(c.port)] : command.args, command.cwd, env);
  if (c.cloudflared) {
    const args = c.tokenFile ? ['tunnel', '--no-autoupdate', 'run', '--token-file', c.tokenFile] : ['tunnel', '--config', c.tunnelConfig, '--no-autoupdate', 'run'];
    supervise('tunnel', c.cloudflared, args, state, process.env);
  }
  const stop = () => {
    closing = true;
    for (const timer of timers) clearTimeout(timer);
    for (const p of children) {
      if (process.platform === 'win32' && p.pid) spawn('taskkill', ['/PID', String(p.pid), '/T', '/F'], { windowsHide: true });
      else p.kill();
    }
  };
  process.once('SIGINT', stop); process.once('SIGTERM', stop);
  console.log(`Independent backend: http://127.0.0.1:${c.port}; logs: ${path.join(state, 'logs')}`);
}
if (require.main === module) {
  try {
    if (process.argv[2] === 'init') initialize();
    else {
      const c = validate(JSON.parse(fs.readFileSync(configFile, 'utf8').replace(/^\uFEFF/, '')));
      if (process.argv[2] === 'check') {
        serverCommand(c.directory);
        for (const file of [c.node, c.cloudflared, c.tunnelConfig, c.tokenFile].filter(Boolean)) if (!fs.existsSync(file)) throw new Error('Missing configured file');
        if (c.cloudflared && (!!c.tunnelConfig === !!c.tokenFile)) throw new Error('Configure exactly one tunnel credential source');
        console.log('Configuration valid (secrets omitted)');
      } else launch(c);
    }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { validate };
