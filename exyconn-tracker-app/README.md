# Exyconn Tracker (desktop)

Cross-platform (Windows + macOS) desktop time tracker for Exyconn employees. Signs in
against the same portal auth server, records work activity, and syncs it to the portal
where it appears under **Time Tracker** (managers) and **My Tracker** (the employee).

## What it records — and what it deliberately does not

While tracking is **on**, the app records:

- Time worked, and whether you were active or idle
- The **number** of key presses and mouse clicks — **never which keys, never what you type**
- Which application/window is in the foreground, and for how long
- Periodic screenshots (interval, count, blur, quality, and randomization are set in the portal)
- **If the workspace switches it on:** a webcam photo taken at the same moment as each
  screenshot and composited into a corner of it (the corner is set in the portal)

Every capture is announced twice, whatever page the app is on and even while it sits hidden in
the tray: an OS notification **showing the screenshot itself**, and an audible camera shutter.
The webcam is opened for a single frame and released immediately, so the camera light goes on
and straight back off rather than staying lit all day.

Webcam capture is **off by default** and can only be turned on by an administrator. When it
is on, the consent screen says so in the app's own words — a sentence an admin cannot edit
out of the disclosure they author — and macOS asks for camera access before the first photo.

It records **nothing** when tracking is off, and the employee can pause or stop at any time
from the tray. The keystroke/click figures are counters only: the global input hook
(`uiohook-napi`) is wired to increment a number and discard the keycode — this is a
productivity tracker, not a keylogger. See `src/main/trackers/input-counter.ts` and the
portal's `tracker.constants.ts` privacy contract.

Access is opt-in and disclosed: an admin grants access (which emails the employee), and the
employee must accept an in-app consent screen listing the above before any tracking starts.

## Architecture

| Layer    | Path                         | Responsibility                                               |
| -------- | ---------------------------- | ------------------------------------------------------------ |
| Main     | `src/main/index.ts`          | App lifecycle, window, tray, IPC                             |
| Main     | `src/main/controller.ts`     | State machine: auth → consent → track                        |
| Main     | `src/main/engine.ts`         | The per-second tracking loop                                 |
| Main     | `src/main/trackers/*`        | Input counting, window usage, screenshots, macOS permissions |
| Main     | `src/main/outbox.ts`         | Durable at-least-once sync queue (survives restart)          |
| Main     | `src/main/portal-client.ts`  | GraphQL calls to the portal (from Node, so no CORS)          |
| Main     | `src/main/store.ts`          | Device token encrypted at rest via `safeStorage`             |
| Preload  | `src/preload/index.ts`       | Typed `window.tracker` bridge (context isolation on)         |
| Main     | `src/main/capture-bridge.ts` | Asks a renderer for the webcam photo (main has no camera)    |
| Main     | `src/main/window-chrome.ts`  | Minimise/maximise/close for the frameless windows            |
| Renderer | `src/renderer/*`             | React UI: login, consent, permissions, dashboard             |
| Renderer | `src/renderer/capture/*`     | Webcam frame + compositing it onto the screenshot            |
| Shared   | `src/shared/*`               | Types + config shared across processes                       |

The device token is **non-expiring** (the employee never signs in again) but bound to a
device row in the portal DB. Every call re-checks the device and the access grant, so a
lost laptop is cut off instantly by revoking the device or access — no `JWT_SECRET`
rotation, which would sign out the whole portal.

## Screenshot quality

`screenshotQuality` is a straight 0-100 percentage, it **defaults to 100**, and **100 means
actual best quality**: the screen is kept at its native resolution and encoded losslessly as
PNG, with no downscale. Below 100 the shot is a JPEG at that quality, downscaled to
`screenshotMaxWidth` — which is what keeps a working day of screenshots to a sane upload
size. The rule lives in one place, `src/main/trackers/capture-policy.ts`, and is unit-tested.

There is a ceiling (`MAX_CAPTURE_BYTES`), kept deliberately under the portal's own
`TRACKER_LIMITS.maxScreenshotBytes`. A lossless capture over it is re-encoded as a
quality-100 JPEG **at the same resolution** — resolution is the quality a manager actually
looks at, so when something has to give it is the encoder, never the pixel count. Without
that ceiling an oversized upload came back `BAD_USER_INPUT`, which the outbox treats as
permanent and drops: quality 100 did not produce worse screenshots, it produced none.

Blur is independent of the dial: it is a privacy decision, so a workspace that asks for
lossless captures still gets unreadable ones. The webcam photo is composited **after** the
blur pass — blur exists to stop on-screen content being readable, and a workspace that has
asked to see who is at the desk is not asking to see them smeared.

## Uploading

Uploading is automatic and always on, at the cadence an admin sets in the portal
(`syncIntervalMinutes`, default 5 minutes). There is no "Sync now" button and no switch:
both existed, and between them an employee could work a full week with the toggle off and
nothing uploaded, with nobody finding out until the timesheet came back empty. The outbox is
durable, so an unreachable portal still costs nothing.

Closing the app while an upload is in flight does not lose work — the queue survives a
restart — but it does make that work climb again. So a real quit is held: the window says
what is still going up and the app closes itself the moment it lands (`close-guard.ts`). The
hold has a 30-second ceiling, because an upload that will not finish must never trap somebody
in an app they asked to close.

## Windows and the tray

Both windows are **frameless**: the tracker draws its own title bar, so minimise, maximise and
close are part of the app rather than a strip of OS chrome bolted to the top of it. Commands
are routed back to the window they came from, so the gallery's buttons never reach the tracker
window.

Closing the window leaves the app running in the tray, which is how it is meant to be used —
tracking carries on and the tray icon stays as the visible reminder. An employee can turn that
off in **Settings → This app**, and close then means quit. The preference is per-install and
stored locally; it is not the workspace's to set — and neither is the light/dark choice
alongside it, which defaults to following the OS.

The header carries a recording indicator on every page: a slow green pulse while tracking,
a still dot otherwise. Only `tracking` animates — a dot that pulsed while paused would say
the opposite of the truth, which is the one thing a monitoring app cannot afford.

Every dashboard tile opens on click. A number on a monitoring dashboard is half a fact; the
detail gives the other half — the unabbreviated figure, the numbers around it, and the rule
or privacy promise that produced it.

## Staying in step with the portal

Once signed in, the app calls `trackerHeartbeat` every minute (`TrackerController`), and that
one round-trip is what keeps the two sides in agreement:

- **The portal learns the app is running.** It stamps the device's `lastSeenAt`, which is what
  Tracker → Devices shows as _Last seen_ and counts under _Online now_. The console polls on the
  same cadence, so it stays live while an admin watches it.
- **The app adopts what an admin changed.** The heartbeat answers with the current settings,
  consent state and timezone, and they are handed straight to the running engine — a new
  interval, screenshot rule, idle threshold or sync cadence takes effect within a minute
  instead of at the next restart.
- **A revoked device or grant is noticed.** The heartbeat fails the same way every other device
  call does, so an app sitting idle signs itself out with a reason rather than waiting for an
  upload that may never come.

A failed heartbeat is not fatal: the session carries on and the next one retries. Tracking
itself never pauses for it, and queued work stays in the durable outbox.

## Develop

```bash
# from the monorepo root
pnpm install
pnpm --filter exyconn-tracker-app dev      # launches Electron with HMR
```

Point it at a portal with `PORTAL_GRAPHQL_URL` (in dev it defaults to
`http://localhost:4004/graphql`; a packaged build defaults to the production portal).
Requires an employee who has been granted tracker access in the portal.

> `pnpm dev` runs through `scripts/electron-vite.mjs`, which strips `ELECTRON_RUN_AS_NODE`
> before launching. VS Code's integrated terminal (and some CI shells) export that flag,
> which would otherwise make the Electron binary boot as plain Node and crash the app at
> startup. The launcher makes `pnpm dev` work from any terminal.

## Build installers

```bash
pnpm --filter exyconn-tracker-app package:win   # NSIS installer (Windows)
pnpm --filter exyconn-tracker-app package:mac    # DMG (macOS, must run ON macOS)
pnpm --filter exyconn-tracker-app package:linux  # AppImage (Linux)
```

CI does this for you: every push to `main` that touches `exyconn-tracker-app/` runs
`.github/workflows/tracker-release.yml`, which builds all three installers, publishes them
on a GitHub Release tagged `tracker-v<package.json version>`, and uploads the files to Slack
(secrets `SLACK_BOT_TOKEN` + `SLACK_CHANNEL_ID`). Bump `version` in `package.json` before
merging so the release gets a new tag.

A macOS DMG can only be built on macOS, and for distribution it must be **code-signed and
notarized** with your Apple Developer ID — set that up in `electron-builder.yml` / CI. The
native modules ship N-API prebuilt binaries, so there is nothing to compile.

## macOS permissions

macOS gates the tracker behind two TCC permissions the user must grant in **System Settings
→ Privacy & Security** (neither can be granted by entitlement):

- **Screen Recording** — screenshots and window titles
- **Accessibility** — the global keyboard/mouse counter
- **Camera** — only when the workspace has switched webcam capture on. This one has a real
  prompt API, so the app asks directly and only deep-links if the employee has already refused.
  When webcam capture is off, `permissions.camera` reports granted and nobody is stopped at the
  permissions screen for a camera that will never be used.

The app checks these on launch and shows a Permissions screen with Grant buttons.
Windows needs no permissions. In dev, an unsigned app can lose these grants on each rebuild;
sign with a stable identity for reliable testing.
