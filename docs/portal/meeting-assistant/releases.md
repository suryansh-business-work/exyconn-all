# Releases and Chrome Web Store publishing

## Versioning

`exyconn-meet-extension/package.json` holds the human version (`MAJOR.MINOR.PATCH`), independent
of the tracker version. Each CI build adds the workflow's run number as Chrome's fourth version
part: run 57 of 1.0.0 is manifest `version` `1.0.0.57` (`version_name` "1.0.0 (build 57)"),
artifact `chrome-meeting-assistant-v1.0.0.57.zip`. Bump `package.json` only for a notable change.
The portal stores a version once: re-uploading the same bytes is a no-op, different bytes for a
stored version are refused (HTTP 409).

## Pipeline (`.github/workflows/meet-extension-release.yml`)

Every successful deploy of `main` (the workflow waits for Build & Deploy), or a manual dispatch (also from **Build new release** on the Releases page,
through the GitHub config in Tech that Tracker Build uses):

1. Quality checks — typecheck, lint, unit tests with the coverage gate.
2. `build:production` — Vite bundles (no remote code, no eval), manifest generated for the mode.
3. `verify` — manifest validation (MV3, permission allow-list, no `<all_urls>`, files exist,
   version format) and a bundle scan for eval/remote scripts/secrets/private keys.
4. `package` — deterministic ZIPs: `chrome-meeting-assistant-v<v>.zip` (internal, may carry the
   public `key`) and `…-store.zip` (no `key`), each with a `.sha256`, plus `release.json`
   (with the dispatch's `releaseChannel`). All of it is kept as the run's artifact.
5. Upload to the portal (`.github/scripts/upload-meet-extension.mjs`): a multipart POST to
   `/meet-assistant/releases/upload` with the run's GitHub Actions OIDC token (no secret). The
   server verifies the RS256 signature against GitHub's JWKS (cached an hour), `iss`
   `https://token.actions.githubusercontent.com`, `aud` = its `API_PUBLIC_URL`, `repository` =
   Release settings › GitHub repository (seeded `suryansh-business-work/exyconn-all`), `ref`
   `refs/heads/main`, `workflow_ref` = this workflow on main, `event_name` workflow_run (after a
   successful deploy) or workflow_dispatch. It checks the ZIP (≤ 10 MB, `PK\x03\x04`, size and SHA-256 as release.json
   says), stores it in the `ma_extension_releases` GridFS bucket, registers it as **QA_PENDING**,
   writes an audit row in the operator company and (if asked) posts to Slack. 10 uploads per IP
   per hour. A failed upload fails the run. Nothing is published as a GitHub Release.
6. Optional (dispatch input `store_upload`): upload the store ZIP via the Chrome Web Store API;
   `store_submit` additionally submits it for review. Neither marks anything published.

## Statuses (AI › Meeting Assistant › Releases, platform-operator ADMINs)

`DRAFT → BUILDING → QA_PENDING → READY_FOR_INTERNAL_TESTING → INTERNAL_RELEASED →
READY_FOR_STORE_SUBMISSION → SUBMITTED_FOR_REVIEW → IN_REVIEW → PUBLISHED`, plus
`BUILD_FAILED`, `REJECTED` (back to READY_FOR_STORE_SUBMISSION) and `DEPRECATED`. The server
enforces the allowed moves and a note on each; **PUBLISHED requires the store listing URL**
(`https://chromewebstore.google.com/…`) and is set only after the store confirms publication.
Users see a release only from INTERNAL_RELEASED on, and only on their company's channel
(STABLE ⊂ BETA ⊂ INTERNAL, Settings › Release channel). **Approve and publish** on a waiting
build moves it to INTERNAL_RELEASED on the chosen channel (Stable reaches every company) in one
step. Downloads go through a signed link valid for five minutes, streamed by the server from its
own storage.

## Release settings and Slack

Releases › **Release settings** (release managers): the GitHub repository whose workflow may
upload, and a Slack channel picked from the workspace's channels (the Slack bot configured in
Tech › Environment Variables › Slack). An approved or PUBLISHED build is posted there with its
version, changelog summary and a link to the portal's Chrome Extension page (never a raw file
URL). "Also post when a new build arrives for QA" is off by default.

## Rollback and deprecation

- Mark the bad version **DEPRECATED** (it disappears from downloads at once), then release a
  fixed higher version. Chrome Web Store: publish the fixed version; the store has no rollback
  to older bytes, so rollback = a new version with the previous code.
- Internal users reload the previous ZIP (still downloadable by release managers) while the fix ships.

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
- [ ] `API_PUBLIC_URL` on the server equals the workflow's `PORTAL_API_URL` (the OIDC audience).
- [ ] Release settings: the GitHub repository is right; a Slack channel picked if wanted.
- [ ] GitHub config active in Tech (only for the Build new release button).
- [ ] AI › Meeting Assistant › Settings reviewed: enabled, retention, budget, email approval.
- [ ] Build uploaded, internally tested ([testing.md](testing.md)), moved to INTERNAL_RELEASED.
