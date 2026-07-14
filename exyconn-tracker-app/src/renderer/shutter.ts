// Imported, not read off disk: Vite fingerprints the file into the renderer bundle, so the
// URL is correct in dev (served by the dev server) AND in the packaged app (a file inside
// out/renderer/assets, which electron-builder already ships via its `out/**/*` glob). A
// hardcoded path would resolve to neither.
import shutterUrl from '../../assets/camera-sound.mp3';

/** Lazily built on first capture, then reused — one element, not one per screenshot. */
let shutter: HTMLAudioElement | null = null;
/** Set once the file has failed to load; stops us retrying a sound that will never play. */
let unavailable = false;

function load(): HTMLAudioElement | null {
  if (unavailable) {
    return null;
  }
  if (shutter === null) {
    const audio = new Audio(shutterUrl);
    audio.preload = 'auto';
    audio.addEventListener('error', () => {
      unavailable = true;
      console.warn('Camera shutter sound could not be loaded; captures stay silent.');
    });
    shutter = audio;
  }
  return shutter;
}

/**
 * Plays the camera shutter for a capture. Announcing every screenshot out loud is the point —
 * a tracker that photographs someone's screen in silence is surveillance.
 *
 * Every failure path is swallowed to a warning on purpose: a missing, unplayable or blocked
 * sound file must never break the capture that triggered it, and `play()` returns a promise
 * that rejects on its own (an unhandled rejection would take down the renderer's console).
 */
export function playShutter(): void {
  const audio = load();
  if (audio === null) {
    return;
  }
  try {
    // Rewind, so two captures close together are both audible instead of the second being
    // swallowed by the first still playing.
    audio.currentTime = 0;
    audio.play().catch((cause: unknown) => {
      console.warn('Camera shutter sound could not play', cause);
    });
  } catch (cause: unknown) {
    console.warn('Camera shutter sound could not play', cause);
  }
}
