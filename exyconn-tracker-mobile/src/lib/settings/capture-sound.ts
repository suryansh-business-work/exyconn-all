/** What the phone's capture-sound switch can do right now. */
export interface CaptureSoundInput {
  /** False on a phone that takes no screenshots (iPhone): there is nothing to announce. */
  canCapture: boolean;
  /** The workspace has already silenced captures for everyone. */
  mutedByWorkspace: boolean;
  /** This phone's own mute. */
  muted: boolean;
}

/**
 * What the switch is actually doing right now, in the employee's own terms.
 *
 * It silences and nothing more: the capture notification still appears on every capture, so
 * muting can never become a way of being screenshotted without knowing. When the workspace has
 * already muted captures — or this phone takes none — there is nothing left for the switch to
 * silence, and it says so rather than pretending to be in charge.
 */
export function captureSoundCaption({
  canCapture,
  mutedByWorkspace,
  muted,
}: CaptureSoundInput): string {
  if (!canCapture) {
    return 'iPhone does not let apps capture the screen, so this phone takes no screenshots and there are no captures to announce.';
  }
  if (mutedByWorkspace) {
    return 'Your workspace has already turned the capture sound off for everyone. You still get a notification for every screenshot.';
  }
  if (muted) {
    return 'Screenshots are taken silently on this phone. You still get a notification for every one.';
  }
  return 'A camera shutter plays each time a screenshot is taken. Muting it changes nothing about what is captured.';
}

/** The switch only means something when there is a sound left for it to silence. */
export function captureSoundLocked({ canCapture, mutedByWorkspace }: CaptureSoundInput): boolean {
  return !canCapture || mutedByWorkspace;
}
