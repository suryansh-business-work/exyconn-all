# Meeting Assistant

A Google Meet assistant: a Chrome extension (`exyconn-meet-extension/`) that reminds people
when Meet transcription is off and, **only after the user clicks Start and confirms
participants were told**, records and transcribes the call. The portal server turns the
transcript into notes, decisions and an action checklist, emails a summary, and shows it all
in the AI portal (whole company) and the employee portal (my meetings).

| Document | For |
| --- | --- |
| [install.md](install.md) | Installing the internal build, signing in, troubleshooting |
| [releases.md](releases.md) | Release flow, Chrome Web Store listing and publishing, rollback, deployment checklist |
| [privacy.md](privacy.md) | Security, privacy, consent, what goes to OpenAI, retention |
| [api.md](api.md) | GraphQL operations, REST endpoints, environment variables |
| [testing.md](testing.md) | Automated tests and the manual Google Meet test matrix |
| [bot.md](bot.md) | The meeting bot: how it joins and records, its Google sign-in, deployment, limits |
| [`exyconn-meet-extension/README.md`](../../../exyconn-meet-extension/README.md) | Extension commands, build modes, permissions, source layout |

## Architecture

```
Google Meet tab ── content script (Shadow DOM floating assistant, visible-UI adapter)
      │           recorder: "Share this tab" (getDisplayMedia) → MediaRecorder
      │             · WebM/Opus file every ~15 s per stream (call, optional mic) → transcript
      │             · tab video (H.264) + mixed audio, one WebM in ~5 s pieces → screen recording
      │ chrome.runtime messages
Service worker ── auth (PKCE + rotating refresh), session registry per tab, reminders (alarms),
      │           two upload queues (retry/backoff/backpressure), heartbeats, finalize
      │ HTTPS: GraphQL /graphql (extension token, allow-listed fields)
      │        REST  /meet-assistant/auth/token · /auth/revoke · /audio (base64 WebM in JSON)
      │              · /video/:meetingId/:seq (raw WebM piece, streamed into GridFS)
Portal server (modules/meeting-assistant)
  ├─ lifecycle: one session per person per call (idempotent start, reconnect window, stale recovery)
  ├─ transcription: WebM/WAV check → gpt-4o-transcribe(-diarize) → segments (Hinglish in Roman script)
  ├─ screen recording: pieces streamed into GridFS `ma_screen`, one track per recording start;
  │    downloaded as MP4 (ffmpeg remuxes H.264, encodes older VP8 parts once, audio → AAC)
  ├─ Google Meet API import (optional, per user): official transcript + participants
  ├─ worker (15 s tick, and at once on finalize): IMPORT_OFFICIAL → ANALYZE (GPT-4o, JSON, evidence-checked) → EMAIL
  ├─ email: exactly once per recipient per notes version (delivery rows)
  ├─ event log (MaEvent) + audit log (person's Activity) for every step
  └─ release registry (platform model) + signed, expiring downloads
Meeting bot (exyconn-meet-bot, Docker `meet-bot`): claims a trip (`/meet-assistant/bot/claim`), joins the call
  in Chromium on Xvfb, then records exactly like the extension with the owner's bot session — see bot.md
Portals: packages/meetings-ui mounted in apps/ai (/ai/meeting-assistant/*, scope ALL)
         and apps/employee (/me/meetings/*, scope MINE)
```

## What relies on what

| Feature | Source | Reliability |
| --- | --- | --- |
| Meeting detection, join state, title | Extension DOM integration (visible Meet UI) | Best effort; Google can change the UI |
| Live transcription state ON/OFF | Extension DOM integration | Best effort; **UNKNOWN** whenever it cannot be read, never a guessed OFF |
| Transcription state after the call | Official Google Meet API (if the owner connected Google) | Verified: a transcript exists or not |
| Participants during the call | Extension DOM (People panel / tiles), marked `MEET_UI`, confidence 0.6 | Best effort; no emails |
| Participants after the call | Official Google Meet API (`GOOGLE_MEET_API`) | Authoritative; replaces UI rows |
| The signed-in user | Portal account (`EXTENSION_USER`) | Verified identity and email |
| Audio and screen capture | Chrome "Share this tab" (`getDisplayMedia`) in the Meet page; mic through Meet's own permission | Needs a click on Start in the in-Meet panel |
| Transcript (independent) | OpenAI `gpt-4o-transcribe` / `-diarize` via the server | Hindi, English, Hinglish; diarization gives labels, never names |
| Transcript (official) | Google Meet REST API v2 (`meetings.space.readonly`) | Only where the Workspace edition, organizer and language allow it; Hindi is not assumed |
| Meeting bot | `exyconn-meet-bot` in Chromium on Xvfb, see [bot.md](bot.md) | Best effort on the visible Meet UI; recording and transcription as reliable as the extension |
| Notes, decisions, actions | OpenAI GPT-4o (JSON mode + Zod) via the server, written in the meeting's language (English, Hindi in Devanagari, Hinglish in Roman letters; AUTO = the language mostly spoken) | Items without valid transcript evidence are dropped |

## Data model (`server/src/modules/meeting-assistant/models`)

`MaMeeting` (one call per owner; `sessionKey` + partial unique index on live sessions),
`MaParticipant` (attendance sessions, rejoins, source, confidence), `MaTranscriptSegment`
(unique per meeting/source/stream/chunk/index), `MaAudioChunk` (exactly-once receipt), saved
audio in GridFS bucket `ma_recordings` (metadata carries `organizationId`), `MaNotes`
(original + current + revisions, version guard), `MaDecision` / `MaActionItem` (fingerprint
dedupe, `editedFields`, history, comments, evidence), `MaEmailDelivery` (unique per
meeting/version/recipient), `MaJob` (idempotency key, backoff), `MaEvent` (the log),
`MaSettings` (per company), `MaExtensionSession` + `MaAuthCode` (sign-in),
`MaGoogleConnection` (sealed refresh token), `MaExtensionRelease` (platform model).
Everything except releases and OAuth state is company-scoped by the tenant plugin.

## Access

- Any employee whose company has the assistant on (and who is in `allowedUserIds`, when set)
  uses the extension and sees meetings they own or were matched to (`viewerIds`).
- The AI role and ADMIN see the whole company (permission module `MeetingAssistant`).
- Releases are managed by ADMINs of the platform operator company (`MaExtensionRelease`);
  CI registers builds with an ADMIN API key.
- Every action is written to the audit log under the person (their Activity on the employee
  and user pages) and to the meeting's event log (AI › Meeting Assistant › Logs).

## Known Google Meet limitations

- The extension cannot turn Meet's own transcription on; it reminds and can open the visible
  controls. Hosts, co-hosts, Workspace edition and admin policy decide who can.
- Official transcripts appear minutes after the call; the import retries every 10 minutes
  (8 attempts) and then falls back to the AI transcript.
- The Meet API identifies signed-in users as `users/{id}`, never an email — participant
  emails are only ever the portal's own verified addresses.
- Diarization labels are per ~25 s chunk; confirm speakers in the transcript tab.
- Detection relies on English UI text/ARIA labels; other Meet UI languages may report UNKNOWN.

## Operational cost notes

- Transcription: `gpt-4o-transcribe` is billed per audio token (~$0.006/min at list price);
  a 60-minute call with tab + microphone streams ≈ 2 × 60 min.
- Notes: one GPT-4o call per ~48k characters of transcript plus one merge call for long calls.
- Costs are recorded per meeting (`costUsd`) at the prices in Tech › AI pricing; the company's
  `monthlyBudgetUsd` stops transcription and notes once spent; `maxMeetingMinutes` caps one call.
- Saved audio is ~1.9 MB per minute per stream (16 kHz PCM16) in MongoDB GridFS; set
  `audioRetentionDays` accordingly or switch `saveRecordings` off.
