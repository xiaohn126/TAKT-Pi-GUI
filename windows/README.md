# Windows 11 delivery

Version 0.4.0 · Build date 2026-10-11 · Windows x64

## Install and use

Run `TAKT-Pi-GUI-Setup-0.4.0-x64.exe`, complete the per-user installation wizard, then open TAKT Pi GUI from the desktop or Start menu. A portable executable is also provided.

The package includes Node.js 22.22.2, production pi-web 0.11.1, pi coding agent and Windows PTY dependencies. No separate Node.js, pi, npm or WSL installation is needed. Git for Windows and external development tools are needed only for projects using them.

On first launch, select the recommended local mode and enter your own OpenAI Chat Completions compatible API URL, API Key, available model IDs and default model. VanYo uses `https://api.vanyospace.com/v1` and models permitted by your key group. Do not mix different keys' model groups in one configuration. Subsequent launches start the saved local service automatically. Custom local/remote modes remain available.

No developer keys, chats or configuration files are bundled. Users supply their own account and credit. Model limits default to conservative 128k context / 4096 output; advanced capabilities can be adjusted in the local agent configuration.

Ctrl+Shift+C changes settings; a blank API Key field retains the saved key. Credentials and sessions are under `%APPDATA%\TAKT Pi GUI\agent`. Keys are local JSON, not an encrypted credential vault. Uninstall retains data. Connection and log files are under `%APPDATA%\TAKT Pi GUI`. Alt reveals the menu; F11 toggles fullscreen; Escape exits fullscreen.

The package is unsigned: Windows may show an unknown publisher/SmartScreen prompt. Code signing requires a publisher certificate. Automatic updates are not included.

## Rebuild

```powershell
cd windows
npm ci
npm test
npm run prepare:delivery
npm run dist
```

Preparation downloads the pinned official backend, checks SHA-512, installs `server-package-lock.json` dependencies, includes licenses and copies the pinned Node runtime. It never copies local pi configuration. Prebuilt production assets avoid the previous Windows source-build tracing failure. Outputs are in `dist/windows`.

## Structure

- `main.cjs`, `preload.cjs`: window, sandboxed bridge, service lifecycle.
- `index.html`, `setup.cjs`, `desktop.css`: onboarding and desktop styling.
- `config.cjs`, `provider.cjs`: connection and per-user provider configuration.
- `prepare-delivery.ps1`, `backend-config.cjs`, `server-package-lock.json`: production staging.
- `package.json`, `package-lock.json`: app metadata, build dependencies, NSIS/portable packaging.
- `test/`: unit, startup and opt-in model/terminal checks.
- `runtime/`: ignored staging/test files; only explicitly selected production resources are packaged.

See [user instructions](../docs/07-windows-delivery.md) and [logbook](../docs/06-windows.md).
