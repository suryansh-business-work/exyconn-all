import type { SvgIconComponent } from '@mui/icons-material';
import WindowIcon from '@mui/icons-material/Window';
import AppleIcon from '@mui/icons-material/Apple';
import TerminalIcon from '@mui/icons-material/Terminal';
import MemoryIcon from '@mui/icons-material/Memory';
import StorageIcon from '@mui/icons-material/Storage';
import DeveloperBoardIcon from '@mui/icons-material/DeveloperBoard';
import WifiIcon from '@mui/icons-material/Wifi';
import MonitorIcon from '@mui/icons-material/Monitor';
import AndroidIcon from '@mui/icons-material/Android';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import { color } from '@exyconn/shell/components/ui';

/** The platforms the tracker release workflow builds installers for. */
export type PlatformKey = 'windows' | 'macos' | 'linux' | 'android' | 'ios';

export interface RequirementRow {
  key: string;
  label: string;
  icon: SvgIconComponent;
  minimum: string;
  recommended: string;
}

export interface PlatformConfig {
  key: PlatformKey;
  label: string;
  /** What the installer file is, in one phrase. */
  fileLabel: string;
  icon: SvgIconComponent;
  accent: string;
  minOs: string;
  recommendedOs: string;
  /** Ordered install steps shown on the page. */
  steps: string[];
  /** OS permissions the app asks for on first run. */
  permissions: string[];
  /** Shown as a warning above the steps — empty when there is nothing to warn about. */
  caution: string;
  /** Hardware rows of the requirements table; the operating system row is added from above. */
  hardware: readonly RequirementRow[];
}

/** Network needs are the same everywhere: work is queued offline and synced later. */
const NETWORK_ROW: RequirementRow = {
  key: 'network',
  label: 'Network',
  icon: WifiIcon,
  minimum: 'Any internet connection — work is queued and synced when it returns',
  recommended: 'Stable broadband, 5 Mbps upload',
};

/** Hardware the desktop tracker needs. These are the same on Windows, macOS and Linux. */
const DESKTOP_HARDWARE: readonly RequirementRow[] = [
  {
    key: 'cpu',
    label: 'Processor',
    icon: DeveloperBoardIcon,
    minimum: 'Any 64-bit dual-core CPU',
    recommended: 'Quad-core or better',
  },
  {
    key: 'memory',
    label: 'Memory',
    icon: MemoryIcon,
    minimum: '4 GB RAM',
    recommended: '8 GB RAM or more',
  },
  {
    key: 'disk',
    label: 'Disk space',
    icon: StorageIcon,
    minimum: '500 MB free',
    recommended: '2 GB free — the outbox queues captures while offline',
  },
  {
    key: 'display',
    label: 'Display',
    icon: MonitorIcon,
    minimum: '1280 × 720',
    recommended: '1920 × 1080 — screenshots are stored at your native resolution',
  },
  NETWORK_ROW,
];

/** A phone only needs to reach the portal; any handset running a supported OS will do. */
const PHONE_HARDWARE: readonly RequirementRow[] = [NETWORK_ROW];

/**
 * Presentation config for each installer: label, install steps and the OS versions the
 * Electron 33 runtime (desktop) and the Expo runtime (phones) support. The builds themselves
 * come from the GitHub release, so nothing here is a version or a download URL.
 */
export const PLATFORMS: PlatformConfig[] = [
  {
    key: 'windows',
    label: 'Windows',
    fileLabel: '.exe installer',
    icon: WindowIcon,
    accent: color.blue[400],
    minOs: 'Windows 10 (64-bit, version 1809)',
    recommendedOs: 'Windows 11 (64-bit)',
    steps: [
      'Download the .exe installer and run it.',
      'SmartScreen may say "Windows protected your PC" — choose More info › Run anyway. The build is not code-signed yet.',
      'Pick an install folder (per-user by default, so no admin password is needed) and finish the wizard.',
      'Launch Exyconn Tracker and sign in with your portal email and password.',
      'Read the consent screen and accept it — tracking cannot start until you do.',
    ],
    permissions: [
      'Allow the app through Windows Firewall so it can sync to the portal.',
      'Camera access, only if your workspace has enabled webcam capture.',
    ],
    caution: 'The installer is not code-signed yet, so SmartScreen will warn you once.',
    hardware: DESKTOP_HARDWARE,
  },
  {
    key: 'macos',
    label: 'macOS',
    fileLabel: 'universal .dmg (Intel + Apple silicon)',
    icon: AppleIcon,
    accent: color.violet[300],
    minOs: 'macOS 11 Big Sur',
    recommendedOs: 'macOS 14 Sonoma or newer',
    steps: [
      'Download the .dmg and open it, then drag Exyconn Tracker into Applications.',
      'The build is unsigned, so the first launch must be right-click › Open › Open — a double-click is blocked by Gatekeeper.',
      'If macOS still refuses, run: xattr -dr com.apple.quarantine "/Applications/Exyconn Tracker.app"',
      'Sign in with your portal email and password, then accept the consent screen.',
      'Grant Screen Recording when asked, and quit and reopen the app once so macOS applies it.',
    ],
    permissions: [
      'Screen Recording — required, screenshots are blank without it.',
      'Accessibility / Automation — reads the active window title for app usage.',
      'Camera, only if your workspace has enabled webcam capture.',
    ],
    caution: 'There is no Apple Developer ID on the build yet, so the .dmg ships unsigned.',
    hardware: DESKTOP_HARDWARE,
  },
  {
    key: 'linux',
    label: 'Linux',
    fileLabel: 'portable .AppImage',
    icon: TerminalIcon,
    accent: color.emerald[400],
    minOs: 'Ubuntu 20.04 / any glibc 2.31+ desktop, X11',
    recommendedOs: 'Ubuntu 22.04 or newer, X11 session',
    steps: [
      'Download the .AppImage — there is nothing to install, it runs from where you put it.',
      'Make it executable: chmod +x "Exyconn Tracker-<version>.AppImage"',
      'Run it by double-clicking, or from a terminal with ./"Exyconn Tracker-<version>.AppImage".',
      'Sign in with your portal email and password, then accept the consent screen.',
      'Keep the file somewhere permanent — moving or deleting it removes the app.',
    ],
    permissions: [
      'An X11 session: screenshots and the input counter do not work under Wayland.',
      'libfuse2 must be installed for AppImages to run on Ubuntu 22.04+.',
    ],
    caution: 'Wayland sessions are not supported — log in with "Ubuntu on Xorg".',
    hardware: DESKTOP_HARDWARE,
  },
  {
    key: 'android',
    label: 'Android',
    fileLabel: '.apk app package',
    icon: AndroidIcon,
    accent: color.green[500],
    minOs: 'Android 7.0 (Nougat)',
    recommendedOs: 'The newest Android version your phone offers',
    steps: [
      'Open this page on your Android phone and download the .apk.',
      'When Android asks, allow your browser (or file manager) to install unknown apps — the build does not come from the Play Store.',
      'Open the downloaded file and tap Install.',
      'Launch Exyconn Tracker and sign in with your portal email and password.',
      'Read the consent screen and accept it — tracking cannot start until you do.',
    ],
    permissions: [
      'Install unknown apps, for the browser or file manager that opens the .apk — once.',
    ],
    caution: 'The app is installed straight from the .apk, so Android will ask you to allow it once.',
    hardware: PHONE_HARDWARE,
  },
  {
    key: 'ios',
    label: 'iOS',
    fileLabel: 'unsigned .ipa (needs re-signing)',
    icon: PhoneIphoneIcon,
    accent: color.sky[500],
    minOs: 'iOS 15.1',
    recommendedOs: 'The newest iOS version your iPhone offers',
    steps: [
      'Download the .ipa — an iPhone will not install it as it is, because it is unsigned.',
      'Ask Tech to re-sign it with your team\'s Apple certificate and provisioning profile.',
      'Install the re-signed build on your iPhone.',
      'If iOS says the developer is not trusted, trust it under Settings › General › VPN & Device Management.',
      'Launch Exyconn Tracker, sign in with your portal email and password, and accept the consent screen.',
    ],
    permissions: [
      'Trust for the signing profile, under Settings › General › VPN & Device Management.',
    ],
    caution:
      'There is no Apple Developer account on the build yet, so the .ipa installs only after it has been re-signed.',
    hardware: PHONE_HARDWARE,
  },
];
