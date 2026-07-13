import { systemPreferences, shell } from 'electron';
import type { PermissionState } from '@shared/types';

/**
 * macOS TCC permissions. Screen Recording (screenshots + window titles) and Accessibility
 * (the global input hook) cannot be granted programmatically — they are user toggles in
 * System Settings. We can only check status, prompt where an API exists, and deep-link.
 * On Windows nothing is required, so everything reports granted.
 */
const isMac = process.platform === 'darwin';

export function getPermissions(): PermissionState {
  if (!isMac) {
    return { screenRecording: true, accessibility: true, allGranted: true };
  }

  const screenRecording = systemPreferences.getMediaAccessStatus('screen') === 'granted';
  const accessibility = systemPreferences.isTrustedAccessibilityClient(false);
  return {
    screenRecording,
    accessibility,
    allGranted: screenRecording && accessibility,
  };
}

/**
 * Nudges the user toward granting a permission. Accessibility has a real prompt API;
 * Screen Recording does not, so we open the relevant System Settings pane.
 */
export async function requestPermission(kind: 'screenRecording' | 'accessibility'): Promise<void> {
  if (!isMac) {
    return;
  }

  if (kind === 'accessibility') {
    // `true` shows the system prompt and deep-links to the Accessibility pane.
    systemPreferences.isTrustedAccessibilityClient(true);
    return;
  }

  await shell.openExternal(
    'x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture',
  );
}
