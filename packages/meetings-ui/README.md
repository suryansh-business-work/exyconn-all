# `@exyconn/meetings-ui`

The Meeting Assistant screens — the portal side of the Google Meet Chrome extension. One set of
screens, mounted twice:

| App | Base path | Scope |
| --- | --- | --- |
| AI portal | `/ai/meeting-assistant` | `ALL` — the whole company (AI role) |
| My Workspace | `/me/meetings` | `MINE` — the viewer's own meetings |

Every page takes `scope` and `basePath`, so the routes it links to (`<basePath>/meetings/:id/:tab?`,
`<basePath>/actions`, `<basePath>/extension`) follow whichever app mounts it.

```tsx
const MEETINGS = { scope: 'ALL', basePath: '/ai/meeting-assistant' } as const;

<Route path="/ai/meeting-assistant" element={<MeetingDashboardPage {...MEETINGS} />} />
<Route path="/ai/meeting-assistant/meetings/:id/:tab?" element={<MeetingDetailPage {...MEETINGS} />} />
```

## Screens

- `MeetingDashboardPage` — eight figures (each with an (i) explaining how it is counted), meetings per
  day, and filters kept in the URL (date range, organizer on `ALL`, participant, status, language).
- `MeetingsListPage` — the server-paged register; `notesOnly` pins it to meetings whose AI summary is ready.
- `MeetingDetailPage` — tabs: overview (facts, title/language, follow-up), transcript (Meet or AI,
  "Load more", confirm speaker, official import), participants, AI notes (current vs original, edit with
  version check, regenerate, revisions, PDF/Word/Markdown/text/JSON), action items, decisions, email
  (preview in a sandboxed frame, send/approve, retry), recording (WAV per stream) and activity (its log).
- `TranscriptsPage`, `ParticipantsPage`, `LogsPage` — server-paged searches across meetings.
- `ActionChecklistPage` / `ActionChecklist` — completion tiles, complete/reopen in place, bulk status and
  priority, add/edit/delete, evidence, comments and history.
- `ExtensionPage` — the newest release, install guide (unpacked load), changelog, signed-in browsers,
  Google Meet connection.
- `ConnectExtensionPage` — the extension's PKCE consent screen (`/me/meetings/connect-extension`).
- `MeetingSettingsPage`, `ReleasesPage` — AI portal only; releases behind `ProtectedRoute` for ADMIN.

## Conventions

Lists read through `useScopedFetcher` — `usePagedFetcher` with the extra `scope` / `meetingId`
arguments these queries take, and filters a screen pins. Forms follow the four-file folder rule under
`src/forms/`. Operations live in `packages/shell/src/graphql/operations/meeting-assistant.graphql`.

## Tests

`pnpm --filter @exyconn/meetings-ui test` (vitest, 100% coverage gate) and `test:ct` (Cypress
component specs for every form).
