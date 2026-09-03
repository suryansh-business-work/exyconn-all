import { systemPreferences, shell } from 'electron';
import type { PermissionKind, PermissionState } from '@shared/types';

/**
 * macOS TCC permissions. Screen Recording (screenshots + window titles) and Accessibility
 * (the global input hook) cannot be granted programmatically — they are user toggles in
 * System Settings. We can only check status, prompt where an API exists, and deep-link.
 * Camera has a real prompt API. On Windows nothing is required, so everything reports granted.
 */
const isMac = process.platform === 'darwin';

const GRANTED: PermissionState = {
  screenRecording: true,
  accessibility: true,
  camera: true,
  allGranted: true,
};

/**
 * `needsCamera` is the workspace's webcam setting. Camera access is only ever a blocker when
 * a photo is actually going to be taken — an employee whose workspace has webcam capture off
 * must never be stopped at a permissions screen for a camera nobody will use.
 */
export function getPermissions(needsCamera = false): PermissionState {
  if (!isMac) {
    return GRANTED;
  }

  const screenRecording = systemPreferences.getMediaAccessStatus('screen') === 'granted';
  const accessibility = systemPreferences.isTrustedAccessibilityClient(false);
  const camera = !needsCamera || systemPreferences.getMediaAccessStatus('camera') === 'granted';

  return {
    screenRecording,
    accessibility,
    camera,
    allGranted: screenRecording && accessibility && camera,
  };
}

/**
 * Nudges the user toward granting a permission. Accessibility and Camera have real prompt
 * APIs; Screen Recording does not, so we open the relevant System Settings pane.
 */
export async function requestPermission(kind: PermissionKind): Promise<void> {
  if (!isMac) {
    return;
  }

  if (kind === 'accessibility') {
    // `true` shows the system prompt and deep-links to the Accessibility pane.
    systemPreferences.isTrustedAccessibilityClient(true);
    return;
  }

  if (kind === 'camera') {
    // Only prompts the first time; afterwards macOS answers from its stored decision, so a
    // previously-denied employee is sent to the pane where they can change it.
    const granted = await systemPreferences.askForMediaAccess('camera');
    if (granted) {
      return;
    }
    await shell.openExternal(
      'x-apple.systempreferences:com.apple.preference.security?Privacy_Camera',
    );
    return;
  }

  await shell.openExternal(
    'x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture',
  );
}
