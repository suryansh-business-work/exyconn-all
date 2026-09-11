import type { ConfigContext, ExpoConfig } from 'expo/config';
// A relative path into the design system, as the desktop tracker's build config does: the
// config is evaluated by Node, and the token file is the one place a hex literal may live.
import { neutral, sky, white } from '../packages/ui/src/tokens/colors.tokens';
import { version } from './package.json';

/** The production portal. CI builds for staging point at it with PORTAL_GRAPHQL_URL instead. */
const PRODUCTION_GRAPHQL_URL = 'https://portal-server.exyconn.com/graphql';

/**
 * Android's versionCode must rise with every build a device is asked to install over the last
 * one. Derived from the semver the pre-commit hook bumps (shared with the desktop tracker), so
 * 1.9.8 → 10908 and 1.10.0 → 11000: monotonic for as long as minor and patch stay below 100.
 */
function versionCode(semver: string): number {
  const [major, minor, patch] = semver.split('.').map((part) => Number.parseInt(part, 10));
  return major * 10_000 + minor * 100 + patch;
}

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Exyconn Tracker',
  slug: 'exyconn-tracker',
  scheme: 'exyconntracker',
  version,
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    bundleIdentifier: 'com.exyconn.tracker',
    buildNumber: String(versionCode(version)),
    supportsTablet: true,
    infoPlist: {
      // The app uses no encryption beyond the OS's own HTTPS — exempt from export compliance.
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: 'com.exyconn.tracker',
    versionCode: versionCode(version),
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: white,
    },
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-localization',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 160,
        resizeMode: 'contain',
        backgroundColor: white,
        dark: { backgroundColor: neutral[900] },
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: sky[500],
        // The shutter the capture channel plays — the phone's counterpart of the desktop's.
        sounds: ['./assets/camera_shutter.mp3'],
      },
    ],
    [
      'expo-build-properties',
      {
        android: { minSdkVersion: 26, compileSdkVersion: 36, targetSdkVersion: 36 },
        ios: { deploymentTarget: '16.0' },
      },
    ],
    './plugins/with-android-release-signing',
  ],
  experiments: { typedRoutes: true },
  extra: {
    portalGraphqlUrl: process.env.PORTAL_GRAPHQL_URL ?? PRODUCTION_GRAPHQL_URL,
  },
});
