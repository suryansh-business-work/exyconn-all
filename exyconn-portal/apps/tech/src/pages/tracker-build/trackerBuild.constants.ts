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
];

/** Branch a build runs off by default. Builds are published from the default branch. */
export const DEFAULT_BUILD_REF = 'main';
