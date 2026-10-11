# Windows support logbook

## 2026-10-11 · 0.4.0

Delivery includes official prebuilt pi-web 0.11.1 instead of a development checkout. Node.js 22.22.2 and Windows terminal modules are explicit resources outside asar, removing manual dependency installation and avoiding source-build tracing failure. Backend config reuses published production values without runtime TypeScript installation.

NSIS installs per user, creates desktop/Start menu shortcuts and preserves user data on uninstall. Portable output remains available. First-run setup writes an OpenAI Chat Completions provider into an isolated application agent directory; developer keys and ~/.pi data are excluded. The key group defines available models. Keys are local JSON, not encrypted. Git/project toolchains and publisher signing remain external.

Backend archive digest and dependencies are pinned. Staging copies only registry resources and licenses. Provider tests cover key reuse, secret omission from returned settings, unrelated provider preservation and input validation. Live installation evidence follows validation.

Validation: a fresh source profile with PATH limited to Windows system directories passed two gpt-6.1-sol replies, context recall, rendered chat and PTY input/output/resize/close. NSIS was actually installed per user; desktop/Start menu links and the 0.4.0 uninstall registration exist. The installed EXE, using its own packaged runtime/backend and the same restricted PATH, passed the same tests through its real renderer. The provider briefly returned overloaded errors before retrying successfully; test waits allow for service delays. `dist/windows/delivery-installed-result.json` and `delivery-installed-chat.png` are local evidence, not release payloads.

Packaging requires a separate extraResources matcher rooted at backend node_modules: electron-builder excludes a root node_modules directory from generic resource copies. The final resource audit examined 20,726 files and found neither supplied personal API key; the app archive contains only the eight explicitly selected app files. The unsigned installer and portable executable are approximately 225 MB each. No VM/fresh physical PC test was performed; clean configuration and restricted PATH tests verify local dependency isolation on this Windows 11 machine.

## 2026-10-11 · 0.3.0

Windows applies a desktop-only stylesheet from `windows/desktop.css`, mirroring the implemented Swift Theme values rather than the older blue-accent design specification. The renderer retains pi-web behavior. Native Windows caption controls remain; a draggable title strip replaces separate menu/title chrome. Alt opens the menu and F11 toggles fullscreen.

Canonical file paths fix packaged setup IPC validation. Local pi-web currently runs in development mode: the production webpack build encountered EPERM while tracing a Windows ApplicationInsights file. The downloaded VanYo guide confirms the OpenAI-compatible `/v1` Chat Completions endpoint. Credentials stay in the user's pi auth file, outside Git. Actual desktop authentication, two assistant replies with context, and PTY input/output/resize/close passed. Theme checks capture light, dark and compact layouts without sending new model requests.

## 2026-10-11 · 0.2.0

The existing SwiftUI/AppKit frontend and Darwin sidecar supervisor cannot run on Windows. Added a separate Electron desktop client using the existing pi-web frontend and protocol, avoiding a second implementation of session reducers, model settings, files and terminal views.

Supports remote servers and already-built local pi-web checkouts or standalone directories. Local services bind to loopback, use a random password/port and authenticate through the server's HttpOnly web session. Credentials never enter the connection settings file. Windows process-tree termination is used on normal exit. A settings shortcut allows recovery from an unavailable remote endpoint.

Packaging produces an unsigned Windows x64 portable executable. Backend/runtime dependencies are explicitly external so native terminal modules are installed for the user's OS, rather than copying macOS binaries. The Windows frontend version/build date are in `windows/package.json`; macOS package version is also updated to 0.2.0.

See [Windows instructions and folder map](../windows/README.md). The startup smoke check covers the rendered connection window, limited bridge, and absence of renderer Node access. Configuration tests cover URL restrictions and server discovery. Live backend/provider behavior requires a configured pi-web service and is separate from these checks.
