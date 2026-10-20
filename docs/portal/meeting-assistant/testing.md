# Testing

## Automated

| Where | Runner | Covers |
| --- | --- | --- |
| `exyconn-meet-extension/__tests__/unit-tests` | vitest (100% gate on logic dirs) | Meet code parsing, meeting state machine, transcription-state and participant adapters on fixture DOM, reminder scheduling (intervals, caps, snooze/dismiss), WAV encoder, upload queue (retry/backoff/dedupe/backpressure), PKCE + rotating refresh, multi-tab isolation, manifest/bundle verify rules, consent-before-capture |
| `exyconn-meet-extension/src/options/forms/**.cy.tsx` | Cypress CT + axe | Extension settings form validation and accessibility |
| `exyconn-portal/server/__tests__/unit-tests/modules/meeting-assistant` | jest + in-memory Mongo | Lifecycle idempotency and reconnects, participants, WAV checks, transcription exactly-once and recording storage, evidence-checked analysis and dedupe on regenerate, email exactly-once, PKCE sign-in and refresh reuse detection, access scopes and the extension field fence, signed links, release registry rules, worker backoff and retention |
| `packages/meetings-ui/__tests__` + `*.form.cy.tsx` | vitest (100% gate) + Cypress CT | Portal screens and forms |

```bash
pnpm --filter @exyconn/meet-extension run test:coverage
pnpm --filter @exyconn/meet-extension run build:production && pnpm --filter @exyconn/meet-extension run verify
cd exyconn-portal/server && npx jest __tests__/unit-tests/modules/meeting-assistant
pnpm --filter @exyconn/meetings-ui test
```

Mocked Meet DOM fixtures prove the adapters' logic, **not** compatibility with today's live
Google Meet: run the manual matrix below on every release before INTERNAL_RELEASED.

## Manual matrix (real Google Meet)

Record pass/fail with the Chrome version, Meet UI language and date in the release's status note.

| # | Scenario | Expect |
| --- | --- | --- |
| 1 | Host, Workspace edition with transcripts, transcription ON | Status ON, no reminder; official import READY after the call |
| 2 | Co-host, transcription OFF | Reminder at the interval, capped; Remind later / Snooze / Dismiss behave |
| 3 | Participant (not host), cannot see controls | Status UNKNOWN, no reminder |
| 4 | Workspace edition without transcripts / personal account | Official import FAILED or none → notes from AI transcript |
| 5 | English meeting | Accurate transcript, notes in English |
| 6 | Hindi meeting | Hindi transcript (Devanagari), English notes quoting terms |
| 7 | Hinglish meeting | Mixed transcript as spoken, no translation |
| 8 | Single speaker / several speakers (diarization on) | Labels Speaker A/B…, never names until confirmed |
| 9 | Microphone permission denied | Tab audio only, clear message |
| 10 | Tab capture refused (Start from the in-page panel) | Message to start from the toolbar |
| 11 | Network drop for 1–2 minutes while recording | Uploads retry, capture pauses rather than drops, no duplicate lines |
| 12 | Browser reload mid-call | Same meeting resumes, capture must be restarted, consent kept |
| 13 | Service worker restart (`chrome://serviceworker-internals` stop) | Session recovered from storage, alarms continue |
| 14 | Call ends unexpectedly (close tab / laptop sleeps) | Finalized within ~10 min by stale recovery, notes generated |
| 15 | Two Meet tabs, different calls | Separate meetings, separate panels |
| 16 | Same call in two tabs | One meeting row, capture in one tab only |
| 17 | No verified attendee emails | Summary goes to the owner (and default recipients) only |
| 18 | Approval required | Email waits in AWAITING_APPROVAL until Send |
| 19 | Sign out from the portal (revoke session) | Extension stops within one request and asks to sign in |
| 20 | Keyboard only + screen reader | Icon movable by arrows, panel tabs and dialogs reachable, state announced |
