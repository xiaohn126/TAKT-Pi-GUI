# Changelog

## 0.3.0 · 2026-10-11
- Windows desktop styling mirrors the macOS palette, orange accent, 760px chat column and rounded composer; an integrated draggable title bar retains Windows caption controls.
- Fixed packaged setup IPC path validation. Live desktop checks verified VanYo replies, multi-turn context and terminal output/resize/close.

## 0.2.0 · 2026-10-11
- Added Windows 11 Electron client, remote/local connection setup, server lifecycle, startup tests and portable x64 packaging. See `windows/README.md`.

## Unreleased
- Docs: overview, architecture, feature parity, Codex UI spec, roadmap, pi-remote compatibility.


## 0.1.0 (P0 + P1 core)
- Native SwiftUI app boots the pi-web sidecar (random port + password), shows real threads.
- Sidebar (projects, pinned, archive, rename/fork/delete), thread view with streaming, thinking, grouped tool calls, diffs, "N files changed" card, composer (model / reasoning, `/` and `@` completion, attachments, steer/queue, drafts), extension dialogs, notifications, settings.
- Right side panel, file viewer, terminal, Git review: placeholders (P2).
