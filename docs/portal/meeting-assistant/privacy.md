# Security and privacy

## Consent and control

- Nothing is recorded until the signed-in user clicks **Start** on the meeting tab and confirms
  that participants were told the call is being recorded, saved and transcribed. The server
  refuses audio for a meeting without that confirmation (`consent_required`), and records who
  confirmed and when (audit log + meeting Activity).
- A visible state (label and colour) shows while recording; Pause/Stop are always available;
  recording stops when the call ends or reaches the company's maximum length.
- Turning on reminders never starts recording. The extension cannot and does not switch on
  Google Meet's own transcription.
- No hidden data is read: the extension reads only what Meet shows on screen and never uses
  internal Meet media interfaces. Participant emails are never guessed.

## What is stored, where, and for how long

| Data | Where | Retention |
| --- | --- | --- |
| Saved audio from older extension builds (16 kHz PCM WAV, when `saveRecordings` is on) | MongoDB GridFS `ma_recordings`, company-scoped | `audioRetentionDays` (default 90; 0 = until the meeting is deleted) |
| Screen recording (tab video + call audio, stored as WebM and downloaded as MP4, when `saveRecordings` is on) | MongoDB GridFS `ma_screen`, company-scoped | `audioRetentionDays`, same as saved audio |
| Transcript lines, event log, chunk receipts | MongoDB, company-scoped | `transcriptRetentionDays` (default 180) |
| Notes, decisions, actions, deliveries | MongoDB, company-scoped | Until the meeting is deleted |
| Google refresh token | MongoDB, AES-256-GCM sealed | Until the user disconnects |
| Extension refresh token | Only a SHA-256 hash on the server; the token in `chrome.storage.local` | 30 days sliding; revoked on sign-out, reuse or from the portal |
| Access token | `chrome.storage.session` only (cleared when Chrome closes) | 15 minutes |

Deleting a meeting deletes its audio, transcript, participants, notes, actions, deliveries,
jobs and log (the audit log keeps the line that it was deleted). Deleting a user's account is
covered by the portal's account deletion; their meetings remain company records until deleted.

## Third-party processing (OpenAI)

Sent to OpenAI from the server only (the key never reaches a browser or the extension):
- each recorded audio chunk (to `gpt-4o-transcribe` / `gpt-4o-transcribe-diarize`);
- the transcript text, meeting title, date, time zone and participant display names (to GPT-4o)
  for notes.
Not sent: emails, tokens, other portal data. OpenAI API data is not used for training by
default under OpenAI's API terms; companies should confirm this fits their own policy.

## Security controls

- Sign-in: OAuth 2.0 authorization code + PKCE (S256) through `chrome.identity`; one-time
  codes (60 s, hashed, bound to extension id, redirect URI and challenge); refresh tokens rotate
  on every use and a replayed one revokes the session.
- Extension tokens are a narrow credential: they only reach the extension's allow-listed
  GraphQL fields and are refused by every role guard; each request re-checks the session row,
  account status and token version.
- Company isolation: tenant plugin on every model; GridFS reads/writes filtered by
  `organizationId` explicitly; non-AI users see only meetings they own or were matched to.
- Downloads: HMAC-signed, five-minute links bound to one file and one person.
- Uploads: transcription chunks as base64 JSON capped at 12 MB (WebM magic bytes or a
  16 kHz mono PCM16 WAV header validated); screen pieces as raw `video/webm` streamed into
  GridFS with an 8 MB cap per piece. Both rate limited per user; transcription concurrency
  bounded per process.
- Logs (pino + event log) never contain audio, transcript text, tokens or email bodies.
- Extension CSP `script-src 'self'`; no remote code; bundle scanned in CI for eval/secrets.
