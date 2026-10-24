import { TrackerPlatform, TrackerVersionBump } from '@exyconn/shell/graphql/generated';

/** The installers a build can produce, in the order the form offers them. */
export const BUILD_PLATFORMS: ReadonlyArray<{
  value: TrackerPlatform;
  label: string;
  artifact: string;
}> = [
  { value: TrackerPlatform.Windows, label: 'Windows', artifact: 'Installer (.exe)' },
  { value: TrackerPlatform.Macos, label: 'macOS', artifact: 'Disk image (.dmg)' },
  { value: TrackerPlatform.Linux, label: 'Linux', artifact: 'Portable app (.AppImage)' },
  {
    value: TrackerPlatform.Android,
    label: 'Android',
    artifact: 'App package (.apk) + Play bundle (.aab)',
  },
  { value: TrackerPlatform.Ios, label: 'iOS', artifact: 'Unsigned app (.ipa)' },
];

/** What the phone builds produce, since neither is a plain installer like the desktop ones. */
export const MOBILE_BUILD_HINT =
  'Android produces an APK to install directly and an AAB for the Play Store. iOS produces an ' +
  'unsigned IPA that installs only after re-signing, until an Apple Developer account is configured.';

/** Branch a build runs off by default. Builds are published from the default branch. */
export const DEFAULT_BUILD_REF = 'main';

/** How a build can raise the tracker version first, in the order the form offers them. */
export const VERSION_BUMPS: ReadonlyArray<{ value: TrackerVersionBump; label: string }> = [
  { value: TrackerVersionBump.Patch, label: 'Patch — fixes (1.4.2 → 1.4.3)' },
  { value: TrackerVersionBump.Minor, label: 'Minor — new features (1.4.2 → 1.5.0)' },
  { value: TrackerVersionBump.Major, label: 'Major — breaking changes (1.4.2 → 2.0.0)' },
  { value: TrackerVersionBump.None, label: 'Keep the current version (rebuild it)' },
];

/** Why the bump matters, under the field. */
export const VERSION_BUMP_HINT =
  'The new version is committed to the branch before building. Installed trackers only ' +
  'update to a higher version, so keep the current one only to rebuild a failed platform.';

/** The most builds retention can keep — the server's own limit (MAX_KEEP_LATEST_BUILDS). */
export const MAX_KEEP_LATEST_BUILDS = 500;
