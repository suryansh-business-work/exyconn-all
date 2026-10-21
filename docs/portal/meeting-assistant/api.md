# API

The SDL is the reference: `exyconn-portal/server/src/modules/meeting-assistant/ma.typeDefs.ts`
(meetings, transcripts, participants, recordings, logs, dashboard, extension session calls),
`ma.notes.typeDefs.ts` (notes, decisions, checklist, follow-up, email) and
`ma.admin.typeDefs.ts` (settings, extension sign-in, Google connection, releases). Client
operations: `packages/shell/src/graphql/operations/meeting-assistant.graphql` (portals) and
`exyconn-meet-extension/src/graphql/operations/` (extension), both codegen-typed.

## Scope and permissions

- Every operation requires a signed-in user of a company with the assistant enabled.
- `scope: MINE` (default) — meetings in the caller's `viewerIds`; `scope: ALL` — the AI role or
  ADMIN through the `MeetingAssistant` permission module.
- Changes to a meeting: its owner, or a company editor (`MeetingAssistant` EDIT).
- Releases: `maSetReleaseStatus`, `maApproveRelease`, `maStartExtensionBuild`,
  `maReleaseSettings`/`maUpdateReleaseSettings`, `maReleaseSlackChannels` — platform-operator ADMINs
  (`MaExtensionRelease`); everyone else only lists/downloads approved releases.
- Extension tokens may only call: `maExtensionContext`, `maStartSession`, `maRecordConsent`,
  `maHeartbeat`, `maRecordParticipantEvents`, `maFinalizeSession`, `maMeeting`, `maFollowUp`,
  `maTranscript`, `maParticipants`, `maNotes`, `maDecisions`, `maActionItemsPaged`,
  `maActionStats`, `maSetActionStatus`, `maLatestRelease`, `reportClientLogs`, `localeBundle`
  (`extension.fields.ts`).
- Paged lists take `TableQueryInput` and are registered with the table registry.

## REST (`/meet-assistant`)

| Method | Path | Auth | Body / result |
| --- | --- | --- | --- |
| POST | `/meet-assistant/auth/token` | none (PKCE) | `{grant_type:"authorization_code", code, code_verifier, redirect_uri, extension_id, device_label, extension_version}` or `{grant_type:"refresh_token", refresh_token, extension_id, extension_version}` → `{access_token, token_type, expires_in, refresh_token, refresh_expires_in}`; errors `{error, error_description}` (400/401/429) |
| POST | `/meet-assistant/auth/revoke` | none | `{refresh_token}` → 204 |
| POST | `/meet-assistant/audio` | Bearer extension token | `{meetingId, stream:"TAB"\|"MIC", seq, startMs, durationMs, audio:<base64 16 kHz mono PCM16 WAV>}` → `{status:"DONE"\|"DUPLICATE", segments[]}`; 400, 401, 403 `budget_exceeded`/`disabled`, 404, 409 `consent_required`/`meeting_ended`/`too_long`, 413, 415 `unsupported_audio`, 429 `busy`/`rate_limited` (+`retryAfterMs`), 502 `transcription_failed`, 503 `not_configured` |
| GET | `/meet-assistant/download?token=…` | signed link | release ZIP or merged recording WAV |
| GET | `/oauth/google-meet/callback` | OAuth state | Google's redirect after consent |

`seq` is per meeting and stream; re-sending a finished `seq` returns the stored segments and
never calls OpenAI again. Audio is never sent through GraphQL.

## Environment variables (server)

| Variable | Default | Purpose |
| --- | --- | --- |
| `MEET_ASSISTANT_EXTENSION_IDS` | empty (sign-in refused) | Comma-separated extension ids allowed to sign in (internal fixed id, store item id) |
| `MEET_ASSISTANT_PORTAL_URL` | `https://employee.exyconn.com` | Links in emails and the extension |
| `MEET_ASSISTANT_AUDIO_LIMIT` | `12mb` | JSON body limit of one audio upload (decoded WAV capped at 8 MB) |
| `API_PUBLIC_URL` | existing | Base of signed download links and the Google callback |

Database-managed (Tech › Environment Variables): OpenAI config, SMTP, Google sign-in client
(reused for the Meet connection), GitHub config (release downloads). Company settings live in
AI › Meeting Assistant › Settings (`MaSettings`).

## Extension build-time configuration

`exyconn-meet-extension/scripts/modes.json` (API and portal URLs per mode) and the optional
`MEET_EXTENSION_PUBLIC_KEY` (public key only). No secret is ever bundled.

## Repository secrets and variables (release workflow)

No secret for the portal: the build is uploaded with the run's OIDC token. `PORTAL_API_URL` and
`MEET_EXTENSION_PUBLIC_KEY` (variables), and optionally `CWS_CLIENT_ID`, `CWS_CLIENT_SECRET`, `CWS_REFRESH_TOKEN`,
`CWS_PUBLISHER_ID`, `CWS_ITEM_ID` (secrets) for Chrome Web Store uploads.
