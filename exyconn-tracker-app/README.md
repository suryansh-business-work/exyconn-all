# Exyconn Tracker (desktop)

Cross-platform (Windows + macOS) desktop time tracker for Exyconn employees. Signs in
against the same portal auth server, records work activity, and syncs it to the portal
where it appears under **Time Tracker** (managers) and **My Tracker** (the employee).

## What it records — and what it deliberately does not

While tracking is **on**, the app records:

- Time worked, and whether you were active or idle
- The **number** of key presses and mouse clicks — **never which keys, never what you type**
- Which application/window is in the foreground, and for how long
- Periodic screenshots (interval, count, blur, and randomization are set in the portal)

It records **nothing** when tracking is off, and the employee can pause or stop at any time
from the tray. The keystroke/click figures are counters only: the global input hook
(`uiohook-napi`) is wired to increment a number and discard the keycode — this is a
productivity tracker, not a keylogger. See `src/main/trackers/input-counter.ts` and the
portal's `tracker.constants.ts` privacy contract.

Access is opt-in and disclosed: an admin grants access (which emails the employee), and the
employee must accept an in-app consent screen listing the above before any tracking starts.

## Architecture

| Layer | Path | Responsibility |
|---|---|---|
| Main | `src/main/index.ts` | App lifecycle, window, tray, IPC |
| Main | `src/main/controller.ts` | State machine: auth → consent → track |
| Main | `src/main/engine.ts` | The per-second tracking loop |
| Main | `src/main/trackers/*` | Input counting, window usage, screenshots, macOS permissions |
| Main | `src/main/outbox.ts` | Durable at-least-once sync queue (survives restart) |
| Main | `src/main/portal-client.ts` | GraphQL calls to the portal (from Node, so no CORS) |
| Main | `src/main/store.ts` | Device token encrypted at rest via `safeStorage` |
| Preload | `src/preload/index.ts` | Typed `window.tracker` bridge (context isolation on) |
| Renderer | `src/renderer/*` | React UI: login, consent, permissions, dashboard |
| Shared | `src/shared/*` | Types + config shared across processes |

The device token is **non-expiring** (the employee never signs in again) but bound to a
device row in the portal DB. Every call re-checks the device and the access grant, so a
lost laptop is cut off instantly by revoking the device or access — no `JWT_SECRET`
rotation, which would sign out the whole portal.

## Develop

```bash
# from the monorepo root
pnpm install
pnpm --filter exyconn-tracker-app dev      # launches Electron with HMR
```

Point it at a portal with `PORTAL_GRAPHQL_URL` (defaults to `http://localhost:1002/graphql`).
Requires an employee who has been granted tracker access in the portal.

> `pnpm dev` runs through `scripts/electron-vite.mjs`, which strips `ELECTRON_RUN_AS_NODE`
> before launching. VS Code's integrated terminal (and some CI shells) export that flag,
> which would otherwise make the Electron binary boot as plain Node and crash the app at
> startup. The launcher makes `pnpm dev` work from any terminal.

## Build installers

```bash
pnpm --filter exyconn-tracker-app package:win   # NSIS installer (Windows)
pnpm --filter exyconn-tracker-app package:mac    # DMG (macOS, must run ON macOS)
```

A macOS DMG can only be built on macOS, and for distribution it must be **code-signed and
notarized** with your Apple Developer ID — set that up in `electron-builder.yml` / CI. The
native modules ship N-API prebuilt binaries, so there is nothing to compile.

## macOS permissions

macOS gates the tracker behind two TCC permissions the user must grant in **System Settings
→ Privacy & Security** (neither can be granted by entitlement):

- **Screen Recording** — screenshots and window titles
- **Accessibility** — the global keyboard/mouse counter

The app checks these on launch and shows a Permissions screen with Grant buttons.
Windows needs no permissions. In dev, an unsigned app can lose these grants on each rebuild;
sign with a stable identity for reliable testing.
