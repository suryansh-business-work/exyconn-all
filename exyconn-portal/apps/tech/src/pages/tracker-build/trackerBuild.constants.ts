import { TrackerPlatform } from '@exyconn/shell/graphql/generated';

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
