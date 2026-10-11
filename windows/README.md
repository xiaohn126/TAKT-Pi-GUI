# Windows 11 desktop client

Version 0.3.0 · Build date 2026-10-11

Desktop styling follows the macOS client's implemented palette, orange accent, centered 760px chat column, soft sidebar and rounded composer. Windows caption controls remain native. Press Alt to reveal the menu, F11 to toggle fullscreen. The server's browser UI is unchanged. This is visual styling, not a SwiftUI port or exact native-material reproduction.

Windows uses an Electron window displaying the existing pi-web UI. The macOS SwiftUI client is retained. This is a separate frontend, not a Windows build of SwiftUI; feature availability follows the connected pi-web version.

## Run

Open `dist/windows/TAKT-Pi-GUI-0.3.0-win-x64.exe`. No Electron/Node installation is required for remote mode. Enter the root URL of a running pi-web server, then sign in on its login page. Use HTTPS for a remote server. OAuth links open in the default browser.

For local mode, install Node.js 22.19+ and Git for Windows, configure the pi CLI and provider credentials, and prepare the same server used by the Mac app:

```powershell
git clone https://github.com/willwill85/pi-web.git pi-web-custom
cd pi-web-custom
npm install
npm run build
```

Select that built directory in the app and, if needed, the full path to `node.exe`. The client starts the server on loopback with a random port and password, authenticates using `/api/web-auth`, and stops its process tree on normal exit or when changing connection. Windows compatibility of terminal/agent tools depends on the server and installed shell; the desktop package does not bundle pi-web, pi CLI, or their native modules. No WSL is needed for the desktop client.

Ctrl+Shift+C returns to connection settings. The menu opens the log directory. Connection settings and `sidecar.log` are stored in Electron's per-user application data directory; passwords are not saved. A failed local server requires reconnecting. After a forced process termination, check for an orphan server before starting another session in the same directory.

## Build and verify

```powershell
cd windows
npm ci
npm test
npx electron test/smoke.cjs
npm run dist
```

The output is an unsigned x64 portable executable in `dist/windows`; Windows may display an unknown publisher prompt. Source dependencies are pinned in `package-lock.json`. The application renderer uses sandboxing, context isolation, no Node integration, restricted navigation and no remote IPC access. See [Electron security guidance](https://www.electronjs.org/docs/latest/tutorial/security).

## Directory structure

- `main.cjs`: desktop lifecycle, connection, local server supervision.
- `desktop.css`: macOS-inspired colors, typography and component styling.
- `config.cjs`: URL validation and server discovery.
- `index.html`, `setup.cjs`, `preload.cjs`: connection UI and limited setup bridge.
- `test/`: configuration regression tests and real Electron startup capture.
- `package.json`, `package-lock.json`: version, build date, dependencies and packaging.

Validation of startup and packaging does not establish live model authentication, streamed replies, terminal execution, or remote-pi behavior. Test those against your configured server.
