import { PLATFORMS, type PlatformConfig, type PlatformKey } from './download.config';

/** User-agent fragment -> platform, checked in order. */
const SIGNATURES: [string, PlatformKey][] = [
  ['win', 'windows'],
  ['mac', 'macos'],
  ['linux', 'linux'],
  ['x11', 'linux'],
];

/** Looks a platform up by key, or null when the key is not one of ours. */
export function platformFor(key: string | null): PlatformConfig | null {
  return PLATFORMS.find((platform) => platform.key === key) ?? null;
}

/**
 * The platform the visitor is browsing from, so the right installer is preselected.
 * Falls back to the first configured platform when the agent says nothing useful.
 */
export function detectPlatform(userAgent: string): PlatformConfig {
  const agent = userAgent.toLowerCase();
  const hit = SIGNATURES.find(([fragment]) => agent.includes(fragment));
  return (hit && platformFor(hit[1])) ?? PLATFORMS[0];
}
