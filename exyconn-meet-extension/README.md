# @exyconn/meet-extension — Exyconn Meeting Assistant

A Chrome Manifest V3 extension for Google Meet. It reminds the user when Meet's own
transcription is visibly off and — only after a click and a recorded consent — records the
call audio, which the portal saves (per the company's retention) and transcribes into notes and
action items. Everything is backed by the portal's GraphQL API (`meeting-assistant` module).

## Commands

```bash
pnpm --filter @exyconn/meet-extension codegen           # GraphQL types from the server SDL
pnpm --filter @exyconn/meet-extension typecheck
pnpm --filter @exyconn/meet-extension lint
pnpm --filter @exyconn/meet-extension test:coverage      # 100% gate on the logic
pnpm --filter @exyconn/meet-extension test:ct            # Cypress component spec (settings form)
pnpm --filter @exyconn/meet-extension build:production   # or build:development / build:staging
pnpm --filter @exyconn/meet-extension verify             # manifest + bundle checks
pnpm --filter @exyconn/meet-extension package            # zips + sha256 + release.json
```

`pnpm release` runs build → verify → package for production.

Load an unpacked build from `dist/chrome-meeting-assistant/` (the manifest is at its root).

## Modes

`scripts/modes.json` holds each mode's endpoints, injected at build time through `define`:

| Mode        | API                                  | Portal                          |
| ----------- | ------------------------------------ | ------------------------------- |
| development | `http://localhost:4004`              | `http://localhost:4021`         |
| staging     | `https://portal-server.exyconn.com`  | `https://employee.exyconn.com`  |
| production  | `https://portal-server.exyconn.com`  | `https://employee.exyconn.com`  |

Staging points at production on purpose: there is no staging deployment (changes go
`staging` → PR → `main`, which deploys).

`MEET_EXTENSION_PUBLIC_KEY` (optional, a PUBLIC key) is written into the manifest `key` so
unpacked internal installs get a stable id. The store zip never contains `key`. Never commit
keys; the bundle holds no API keys of any kind.

## Artifacts

`pnpm package` writes to `artifacts/`:

- `chrome-meeting-assistant-v<build version>.zip` — internal channel (keeps `key` if set)
- `chrome-meeting-assistant-v<build version>-store.zip` — Chrome Web Store (no `key`)
- a `.sha256` per zip and `release.json` (`version`, `buildNumber` = `EXTENSION_BUILD_NUMBER`,
  `commitSha` = `GITHUB_SHA` or `git rev-parse HEAD`, `builtAt`, `files[]`)

Zips are deterministic: sorted entries, fixed 1980-01-01 timestamps, Node built-ins only.

The build version is `package.json`'s version plus `EXTENSION_BUILD_NUMBER` as Chrome's fourth
part: CI sets it to the workflow's run number, so build 57 of 1.2.0 is manifest `version`
`1.2.0.57` (`version_name` "1.2.0 (build 57)"). Local builds leave it unset and keep the plain
package version. Every successful deploy of `main` (and every "Build new release" in AI › Meeting Assistant ›
Releases) builds one and uploads it to the portal (see docs/portal/meeting-assistant/releases.md);
bump `package.json` only for a notable change.

## Permissions

| Permission      | Why                                                              |
| --------------- | ---------------------------------------------------------------- |
| `storage`       | settings (sync), sign-in (session/local), per-tab state (session) |
| `alarms`        | reminders, heartbeats, finalize grace — survive worker suspension |
| `notifications` | the optional "transcription is off" reminder                     |
| `tabCapture`    | the call audio, after the user's click on the toolbar button      |
| `offscreen`     | the recorder document (AudioWorklet, 16 kHz PCM WAV)              |
| `identity`      | the portal sign-in (`launchWebAuthFlow`, OAuth code + PKCE S256)  |

Host access: `https://meet.google.com/*` and the mode's API origin only.

## Architecture (`src/`)

- `background/` — the module service worker. Sign-in and token refresh (single-flight,
  rotating refresh tokens), the per-tab session registry in `storage.session`, server
  sessions, heartbeats, participant batches (≤ 50), reminders, the upload queue (ordered,
  exponential backoff, max attempts, backpressure pauses capture — nothing is dropped), the
  offscreen document and finalization. Pure rules live in `background/logic/`.
- `content/` — the Meet page. `meet-adapter/` reads the VISIBLE UI only (all selectors in
  `selectors.ts`, best-effort; unreadable means UNKNOWN), one debounced MutationObserver.
  `app/` is the floating icon and side panel in a Shadow DOM.
- `offscreen/` — tab audio played back through a default-rate AudioContext (so the call stays
  audible) and captured by a separate 16 kHz context + `pcm-worklet.js`; mic only if enabled
  and permitted. Each ~25 s becomes a WAV chunk.
- `popup/`, `options/` — React (MUI via `@exyconn/ui`); the settings form is RHF + Zod in
  `options/forms/extension-settings/`.
- `services/`, `storage/`, `utils/`, `graphql/` — framework-free logic, 100% unit-tested.

The content script never holds a token: every portal call goes through the worker.

## Meet detection is best-effort

Google Meet has no DOM contract. When Meet changes, update
`src/content/meet-adapter/selectors.ts` and its fixtures in `__tests__/unit-tests/fixtures/`.
Phrases are English; in another UI language detection degrades to UNKNOWN, which never
triggers a reminder.
