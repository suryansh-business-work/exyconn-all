# @exyconn/chat-widget

The visitor chat bubble for exyconn.com and tools.exyconn.com, with **zero runtime
dependencies**: vanilla TypeScript and DOM, rendered inside a Shadow DOM root so neither the
host page's CSS nor the widget's can leak across. It speaks the portal's `/chat/ws` socket
(server: `exyconn-portal/server/src/modules/website-chat`, visitor side of the protocol).

Used by:

- `exyconn-website` — `src/scripts/chat-widget.ts`, loaded from `src/layouts/Page.astro` when
  the browser is idle. The socket URL is derived from `PUBLIC_PORTAL_GRAPHQL_URL`, which the
  server prints into `<meta name="exyconn-portal-graphql">` at request time.
- `exyconn-tools/ui` — `src/main.tsx`, socket URL from `VITE_CHAT_SOCKET_URL` (a build arg).
  Tools is an npm project outside the pnpm workspace, so it consumes the source through a
  tsconfig `paths` entry and a Vite alias, and its Docker image copies `packages/chat-widget`.
  That is also why this package's `tsconfig.json` does not extend `@exyconn/config`.

## Use

```ts
import { mountChatWidget } from '@exyconn/chat-widget';

const unmount = mountChatWidget({
  socketUrl: 'wss://portal-server.exyconn.com/chat/ws',
  site: 'WEBSITE', // or 'TOOLS'
  theme: { primary: 'var(--color-primary)' }, // any subset of ChatTheme
  privacyUrl: '/privacy-policy',
});
```

Browser only: call it from client code, never during a server render or a prerender.

## What it does

- **Launcher** (bottom-right) with an unread badge; it bounces on a new reply. Hidden entirely
  when the team turns the chat off (`config.enabled`).
- **Panel** (`role="dialog"`, non-modal) that scales/fades in, closes on Esc, moves focus in and
  back to the launcher, and goes full screen below 480px. Motion is dropped under
  `prefers-reduced-motion`.
- **Header**: bot name, online/offline status, a settings menu (sound on/off — remembered per
  site, download the conversation as `chat-<ticketReference>.txt`, end the chat after an
  in-widget confirm) and minimise.
- **Tabs** (ARIA tablist, arrow keys): _Chat with us_ (live, humans), _Knowledge Bot_ (AI) and
  _FAQs_ (searchable, no sign-in needed).
- **Sign-in**: name, email, optional phone, checked with the server's own rules, then the
  emailed 6-digit code (resend after 30 s, change email). The pass is kept in localStorage
  (`exyconn-chat:<site>:token`) and sent with `hello` on every (re)connect.
- **Threads**: bubbles per sender, slide-in for new ones, local-time timestamps, "Seen" after
  the team reads, typing dots, auto-scroll, welcome text when empty, the offline banner, and
  an animated switch to the Knowledge Bot when no one answered in time.
- **Composer**: autosizing box (Enter sends, Shift+Enter breaks the line, 2000 characters),
  and in the live chat when uploads are allowed: up to four pictures/clips under the size
  limit and voice notes (MediaRecorder, up to two minutes). Messages appear at once and are
  replaced by the server's echo (same `clientId`); a refused one is marked _Not sent_ with
  Retry.
- **Notifications** while the panel is closed or the tab hidden: unread badge, a Web Audio
  chime (no audio file) when sound is on, and a `(n) ` prefix on the page title.
- **Socket**: connects on first open (or at once when a pass is stored), pings every 25 s,
  reconnects with exponential backoff capped at 30 s.

## Theming

Every colour, radius, shadow and the font come from `ChatTheme` (`src/tokens.ts`), written as
`--cw-*` custom properties on the shadow host. Values are any CSS value, so a site can pass its
own variables (`var(--color-surface)`) and the widget follows its light/dark switch. The
defaults meet WCAG AA contrast.

## Text

Every English string is in `src/strings.ts`, one object, ready to be translated. The bot name,
welcome and offline messages and the FAQs come from the server's config.

## Scripts

`typecheck`, `lint`, `format`, `test` (vitest, passes with no tests).
