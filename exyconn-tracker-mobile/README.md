# Exyconn Tracker (Android + iOS)

The desktop tracker's phone app. It signs in against the same portal, runs the **same rules** —
the controller, tracking engine, durable outbox, schedule, presence and portal operations all
live in [`@exyconn/tracker-core`](../packages/tracker-core), shared with
[`exyconn-tracker-app`](../exyconn-tracker-app) — and syncs to the same Time Tracker / My
Tracker pages in the portal.

Stack: Expo SDK 57 · React Native 0.86 (New Architecture) · Expo Router · Tamagui · React Hook
Form + Zod · `@expo/vector-icons` · a local Kotlin module ([`modules/tracker-native`](modules/tracker-native)).

## What a phone records — and what it cannot

| | Desktop | Android | iPhone |
| --- | --- | --- | --- |
| Time worked, active vs idle | ✓ | ✓ (screen on and unlocked = in use) | ✓ while the tracker is open |
| Keeps tracking with the app closed | ✓ (tray) | ✓ (foreground service + ongoing notification) | — |
| Idle auto-pause | ✓ | ✓ | ✓ (on return to the app) |
| App in front | ✓ (window) | ✓ (Usage access) | — |
| Screenshots | ✓ | ✓ (Android screen-capture consent, each session) | — |
| Webcam photo in the screenshot corner | ✓ | ✓ (front camera, one frame) | — |
| Key press / click **counts** | ✓ | — | — |

The gaps are platform rules, not omissions. iOS lets no app see other apps, the screen or input.
Android could count touches only through an Accessibility Service — which the Play Store forbids
for monitoring and which can read what is typed, breaking the tracker's "counts, never content"
contract — so neither phone counts input. The app says so wherever a desktop figure would appear.

Everything that is not monitoring is identical on every platform: sign-in, the signed consent,
attendance, projects and tickets, presence, schedule-driven start/stop, messages and
announcements, off-computer claims, My Report (with CSV via the share sheet), the screenshot
gallery, timezone, theme, progress style, capture-sound mute and update checks.

Every Android capture is announced the moment it happens: a notification **showing the capture**,
with the camera shutter as its sound (muted by the workspace setting or this phone's own mute —
the notification appears either way). Tapping it opens that day in the gallery. When the
workspace takes screenshots and the employee declines Android's capture prompt — or stops sharing
mid-session — tracking does not start (or pauses) and says why.

## Builds — GitHub Actions only

Nothing is built on a developer machine. [`.github/workflows/tracker-release.yml`](../.github/workflows/tracker-release.yml)
builds, on every push to `main` touching the tracker, and on demand from the portal's
**Tech → Tracker Build** screen:

- **Android** — `expo prebuild` + Gradle → a signed `.apk` (install directly) and `.aab` (Play
  Store upload), signed with the upload keystore in the repository secrets
  `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`,
  `ANDROID_KEY_PASSWORD` ([`plugins/with-android-release-signing.js`](plugins/with-android-release-signing.js)
  refuses to fall back to debug signing).
- **iOS** — `expo prebuild` + `xcodebuild archive` → an **unsigned** `.ipa`. It installs only
  after re-signing, until an Apple Developer certificate and provisioning profile are configured.

Both land on the same GitHub Release as the desktop installers (`tracker-v<version>`) and are
posted to the same Slack channels. The version is the desktop tracker's — `scripts/bump-version.mjs`
mirrors it here on every commit, Android's versionCode is derived from it, and CI refuses a
release where the two disagree. The app checks the portal for a newer build and offers the APK
(Android) or the release page (iOS).

## Develop

```bash
pnpm install                                        # from the monorepo root
pnpm --filter exyconn-tracker-mobile typecheck
pnpm --filter exyconn-tracker-mobile lint
pnpm --filter exyconn-tracker-mobile test           # schemas and pure helpers (vitest)
```

`PORTAL_GRAPHQL_URL` points a build at another portal (it defaults to production). Forms follow
the repo pattern — `src/forms/<name>/` with `.form.tsx`, `.schema.ts`, `.types.tsx`, `index.tsx` —
and each schema is tested in `__tests__/unit-tests/forms/`.
