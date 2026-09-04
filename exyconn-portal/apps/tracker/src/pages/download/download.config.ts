import type { SvgIconComponent } from '@mui/icons-material';
import WindowIcon from '@mui/icons-material/Window';
import AppleIcon from '@mui/icons-material/Apple';
import TerminalIcon from '@mui/icons-material/Terminal';
import MemoryIcon from '@mui/icons-material/Memory';
import StorageIcon from '@mui/icons-material/Storage';
import DeveloperBoardIcon from '@mui/icons-material/DeveloperBoard';
import WifiIcon from '@mui/icons-material/Wifi';
import MonitorIcon from '@mui/icons-material/Monitor';

/** The three platforms the tracker release workflow builds installers for. */
export type PlatformKey = 'windows' | 'macos' | 'linux';

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
}

/**
 * Presentation config for each installer: label, install steps and the OS versions the
 * Electron 33 runtime supports. The builds themselves come from the GitHub release, so
 * nothing here is a version or a download URL.
 */
export const PLATFORMS: PlatformConfig[] = [
  {
    key: 'windows',
    label: 'Windows',
    fileLabel: '.exe installer',
    icon: WindowIcon,
    accent: '#4f8cff',
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
  },
  {
    key: 'macos',
    label: 'macOS',
    fileLabel: 'universal .dmg (Intel + Apple silicon)',
    icon: AppleIcon,
    accent: '#a78bfa',
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
  },
  {
    key: 'linux',
    label: 'Linux',
    fileLabel: 'portable .AppImage',
    icon: TerminalIcon,
    accent: '#34d399',
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
  },
];

export interface RequirementRow {
  key: string;
  label: string;
  icon: SvgIconComponent;
  minimum: string;
  recommended: string;
}

/**
 * Hardware the tracker needs. These are the same on every platform; the operating
 * system row is added per platform from the config above.
 */
export const REQUIREMENTS: RequirementRow[] = [
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
  {
    key: 'network',
    label: 'Network',
    icon: WifiIcon,
    minimum: 'Any internet connection — work is queued and synced when it returns',
    recommended: 'Stable broadband, 5 Mbps upload',
  },
];
