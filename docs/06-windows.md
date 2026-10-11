# Windows support logbook

## 2026-10-11 · 0.3.0

Windows applies a desktop-only stylesheet from `windows/desktop.css`, mirroring the implemented Swift Theme values rather than the older blue-accent design specification. The renderer retains pi-web behavior. Native Windows caption controls remain; a draggable title strip replaces separate menu/title chrome. Alt opens the menu and F11 toggles fullscreen.

Canonical file paths fix packaged setup IPC validation. Local pi-web currently runs in development mode: the production webpack build encountered EPERM while tracing a Windows ApplicationInsights file. The downloaded VanYo guide confirms the OpenAI-compatible `/v1` Chat Completions endpoint. Credentials stay in the user's pi auth file, outside Git. Actual desktop authentication, two assistant replies with context, and PTY input/output/resize/close passed. Theme checks capture light, dark and compact layouts without sending new model requests.

## 2026-10-11 · 0.2.0

The existing SwiftUI/AppKit frontend and Darwin sidecar supervisor cannot run on Windows. Added a separate Electron desktop client using the existing pi-web frontend and protocol, avoiding a second implementation of session reducers, model settings, files and terminal views.

Supports remote servers and already-built local pi-web checkouts or standalone directories. Local services bind to loopback, use a random password/port and authenticate through the server's HttpOnly web session. Credentials never enter the connection settings file. Windows process-tree termination is used on normal exit. A settings shortcut allows recovery from an unavailable remote endpoint.

Packaging produces an unsigned Windows x64 portable executable. Backend/runtime dependencies are explicitly external so native terminal modules are installed for the user's OS, rather than copying macOS binaries. The Windows frontend version/build date are in `windows/package.json`; macOS package version is also updated to 0.2.0.

See [Windows instructions and folder map](../windows/README.md). The startup smoke check covers the rendered connection window, limited bridge, and absence of renderer Node access. Configuration tests cover URL restrictions and server discovery. Live backend/provider behavior requires a configured pi-web service and is separate from these checks.
