# Releases and Chrome Web Store publishing

## Versioning

`exyconn-meet-extension/package.json` holds the version (semver `MAJOR.MINOR.PATCH`, which is
also a valid Chrome manifest version). It is independent of the tracker version. A version is
released once: the workflow stops if its tag exists, and the server refuses to register the
same version/channel with a different SHA-256 — never replace published bytes, bump instead.

## Pipeline (`.github/workflows/meet-extension-release.yml`)

Push to `main` touching the extension, or a manual dispatch:

1. Quality checks — typecheck, lint, unit tests with the coverage gate.
2. `build:production` — Vite bundles (no remote code, no eval), manifest generated for the mode.
3. `verify` — manifest validation (MV3, permission allow-list, no `<all_urls>`, files exist,
   version format) and a bundle scan for eval/remote scripts/secrets/private keys.
4. `package` — deterministic ZIPs: `chrome-meeting-assistant-v<v>.zip` (internal, may carry the
   public `key`) and `…-store.zip` (no `key`), each with a `.sha256`, plus `release.json`.
5. GitHub Release `meet-extension-v<v>` (not marked latest — the tracker updater reads latest).
6. Register with the portal (`maRegisterRelease`, needs `MEET_EXTENSION_REGISTER_API_KEY`) →
   status **QA_PENDING**.
7. Optional (dispatch input `store_upload`): upload the store ZIP via the Chrome Web Store API;
   `store_submit` additionally submits it for review. Neither marks anything published.

## Statuses (AI › Meeting Assistant › Releases, platform-operator ADMINs)

`DRAFT → BUILDING → QA_PENDING → READY_FOR_INTERNAL_TESTING → INTERNAL_RELEASED →
READY_FOR_STORE_SUBMISSION → SUBMITTED_FOR_REVIEW → IN_REVIEW → PUBLISHED`, plus
`BUILD_FAILED`, `REJECTED` (back to READY_FOR_STORE_SUBMISSION) and `DEPRECATED`. The server
enforces the allowed moves and a note on each; **PUBLISHED requires the store listing URL**
(`https://chromewebstore.google.com/…`) and is set only after the store confirms publication.
Users see a release only from INTERNAL_RELEASED on, and only on their company's channel
(STABLE ⊂ BETA ⊂ INTERNAL, Settings › Release channel). Downloads go through a signed link
valid for five minutes, streamed by the server from GitHub; the artifact URL is never exposed.

## Rollback and deprecation

- Mark the bad version **DEPRECATED** (it disappears from downloads at once), then release a
  fixed higher version. Chrome Web Store: publish the fixed version; the store has no rollback
  to older bytes, so rollback = a new version with the previous code.
- Internal users reload the previous ZIP from the GitHub Release while the fix ships.

## Chrome Web Store submission (manual parts)

Requirements before the first submission: a Chrome Web Store developer account for the
publisher (one-time fee, 2-step verification), a verified contact email, and the listing below.
The `CWS_*` secrets (OAuth client of the publisher account with the Chrome Web Store API
enabled: `CWS_CLIENT_ID`, `CWS_CLIENT_SECRET`, `CWS_REFRESH_TOKEN`, `CWS_PUBLISHER_ID`,
`CWS_ITEM_ID`) are needed for automated uploads; the first item must be created in the
Developer Dashboard by uploading `…-store.zip` by hand.

**Listing**

- Name: Exyconn Meeting Assistant
- Short description: Transcription reminders, consent-based meeting notes and action items for Google Meet, in your Exyconn workspace.
- Category: Productivity / Workflow & Planning. Language: English.
- Single purpose: helping a signed-in Exyconn user capture their own Google Meet meetings as notes and action items in Exyconn.
- Icons: built into the package (16/32/48/128); store icon 128×128 and screenshots 1280×800
  (floating assistant, panel tabs, consent dialog, portal notes) and a 440×280 promo tile must be
  captured from a real meeting — not generated.
- Privacy policy URL, support URL, website: Exyconn's published pages (must exist publicly
  before submission; the privacy policy must cover the data in [privacy.md](privacy.md)).
- Not affiliated with Google: never "official" or "Google approved" in the listing.

**Permission justifications**

| Permission | Why |
| --- | --- |
| `storage` | Keeps the user's preferences and sign-in tokens in the extension's own storage. |
| `alarms` | Schedules transcription reminders and heartbeats while the service worker sleeps. |
| `notifications` | Shows the "transcription is off" reminder when the user enables desktop notifications. |
| `tabCapture` | Captures the meeting tab's audio, only after the user clicks Start and confirms consent. |
| `offscreen` | Processes captured audio into 16 kHz WAV in an offscreen document (MV3 has no DOM in the worker). |
| `identity` | Runs the OAuth (PKCE) sign-in with the user's Exyconn account. |
| Host `https://meet.google.com/*` | Shows the assistant inside Google Meet and reads the visible meeting state. |
| Host `https://portal-server.exyconn.com/*` | Sends the user's own meeting data to their Exyconn workspace. |

**Data usage disclosure:** collects personal communications (meeting audio and transcripts the
user chooses to record), user activity (meeting join/leave as shown in Meet), and personally
identifiable information (the signed-in account and participant display names). Not sold, not
used for unrelated purposes or creditworthiness, transferred only to the user's Exyconn
workspace and OpenAI as its processor (see [privacy.md](privacy.md)).

**Reviewer instructions:** provide a test Exyconn account (created for the reviewer, removed
after review — never a real user's credentials in the form), the steps in [install.md](install.md),
a Google Meet link to join, and note that recording starts only after Start + consent.

## Deployment checklist

- [ ] Server deployed with the meeting-assistant module (merged to `main`, deploy green).
- [ ] `MEET_ASSISTANT_EXTENSION_IDS` set to the internal id (fixed `key`) and the store item id.
- [ ] Tech › Environment Variables: OpenAI config active; SMTP active; Google sign-in client
      has `https://portal-server.exyconn.com/oauth/google-meet/callback` as a redirect URI and
      the Google Meet REST API enabled (for official transcripts).
- [ ] GitHub config active in Tech (release downloads stream through it); repository secret
      `MEET_EXTENSION_REGISTER_API_KEY` (ADMIN API key in the operator company).
- [ ] AI › Meeting Assistant › Settings reviewed: enabled, retention, budget, email approval.
- [ ] Release registered, internally tested ([testing.md](testing.md)), moved to INTERNAL_RELEASED.
