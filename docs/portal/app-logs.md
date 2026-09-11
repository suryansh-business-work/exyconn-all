# App logs — Tech › Logs

Every error and debug log from the phone tracker, the desktop tracker, the portals and the
API ends up in one table at **tech.exyconn.com/tech/logs**. Each row is one *distinct*
problem, with how many times it happened, to how many people, who saw it last, on which
platform and build, and on which screen. Open a row to see the individual occurrences: who,
when, which device, the stack, the React component stack and the breadcrumbs that led to it.

## Handing a problem to Claude

- **Robot button on a row**, or **Copy fix prompt for Claude** in the drawer, copies a
  Markdown prompt holding the stack, the breadcrumbs, the context, the recent occurrences and
  where the code for that source lives. Paste it into Claude Code at the repo root.
- **Copy open errors for Claude** above the grid copies every OPEN error (of the chosen
  source, if one is picked) as one prompt.
- After the fix ships, **Mark resolved**. A resolved problem that happens again re-opens by
  itself; **Ignore** keeps counting without re-opening.

The prompts are built on the server (`modules/logs/logs.prompt.ts`) from the stored rows.

## Where logs come from

| Source | Captured automatically | Code |
| --- | --- | --- |
| `MOBILE` | uncaught JS errors (fatal ones too — written to disk before the app dies), unhandled rejections, every screen render error (each route exports `ScreenErrorBoundary`, so the screen shows a retry instead of the app closing), `console.error`/`warn`, and **app closes JS never sees** (native crash, killed by the OS) via the session marker | `exyconn-tracker-mobile/src/tracker/crash-handlers.ts` |
| `DESKTOP` | main-process `uncaughtException`/`unhandledRejection`, a renderer or GPU process that dies, renderer errors (sent to main over IPC), render errors per section, `console.error`/`warn` | `exyconn-tracker-app/src/main/crash-handlers.ts`, `src/renderer/logger.ts` |
| `PORTAL` | uncaught errors, unhandled rejections, render errors per page, GraphQL queries the API refused to validate, requests that got no answer, `console.error`/`warn` | `packages/shell/src/logging/` |
| `SERVER` | every resolver error except the expected answers (UNAUTHENTICATED, FORBIDDEN, NOT_FOUND, BAD_USER_INPUT, …) | `exyconn-portal/server/src/modules/logs/logs.plugin.ts` |

Every client entry carries the current route and the last 30 breadcrumbs (screens opened,
status changes, earlier logs). The screen, the user (from the session; a user the client only
claimed is marked *unverified*), the device and the build are stamped on each batch.

## Logging from code

The console is already captured, so an existing `console.error('Saving failed', err)` is
reported as-is. For anything else, import the app's logger:

```ts
import { logger } from '../tracker/logger';        // mobile
import { logger } from './logger';                  // desktop main or renderer
import { portalLogger } from '@exyconn/shell/logging/portalLogger'; // portals

logger.error('Saving the timezone failed', err, { timezone });
logger.warn('Slow sync', undefined, { ms });
logger.info('Signed in');
logger.debug('Opened the calendar');
logger.breadcrumb('Tapped Start'); // not sent on its own; rides along with the next error
```

## How it works

- `@exyconn/logger` (zero dependencies) is the client: a queue written to durable storage
  **before** any send (a file on the phone and the desktop, localStorage in a browser), so a
  crash is delivered on the next launch. Errors are sent at once, everything else within
  10 s, 25 entries per call; an entry identical to one still waiting is folded into its
  `count`, so a render loop sends one row.
- `reportClientLogs` is public — a crash on the login screen must still arrive — and
  rate-limited per user, else per IP. Over the limit the batch is dropped, not retried.
- The server groups entries by fingerprint (source, app, level, error name, and the message
  with ids and numbers masked) into `AppLogGroup`, and keeps each occurrence as an
  `AppLogEvent` for 30 days.

## Not covered yet

- **Minified release stacks.** Phone and desktop release stacks point into the bundle, not
  the source. The route, the component stack and the breadcrumbs usually find the code;
  uploading source maps from `tracker-release.yml` would make the stacks exact.
- **Native crash details.** An unexpected exit is reported with the screens that were open,
  but not the native stack. Android's `ApplicationExitInfo` would give the real reason.
