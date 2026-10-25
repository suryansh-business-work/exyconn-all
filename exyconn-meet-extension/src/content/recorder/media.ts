/** Chrome's getDisplayMedia options beyond the DOM typings: offer this tab, nothing else. */
interface TabShareOptions extends DisplayMediaStreamOptions {
  preferCurrentTab: boolean;
  selfBrowserSurface: 'include';
  surfaceSwitching: 'exclude';
  systemAudio: 'exclude';
  monitorTypeSurfaces: 'exclude';
}

/** 720p at 15 fps keeps a screen recording near 0.5 GB per hour while staying readable. */
const TAB_SHARE: TabShareOptions = {
  video: {
    width: { ideal: 1280, max: 1280 },
    height: { ideal: 720, max: 720 },
    frameRate: { ideal: 15, max: 15 },
  },
  audio: true,
  preferCurrentTab: true,
  selfBrowserSurface: 'include',
  surfaceSwitching: 'exclude',
  systemAudio: 'exclude',
  monitorTypeSurfaces: 'exclude',
};

export function stopTracks(stream: MediaStream | null): void {
  for (const track of stream?.getTracks() ?? []) {
    track.stop();
  }
}

/**
 * Asks Chrome to share this tab, with its audio. Must run straight from the user's click:
 * Chrome shows its "Share this tab" dialog only during a user gesture. Throws an English
 * source string when the share was refused or came without the call's audio.
 */
export async function shareThisTab(): Promise<MediaStream> {
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getDisplayMedia(TAB_SHARE);
  } catch (error) {
    throw new Error('Sharing this tab was cancelled, so transcription did not start', {
      cause: error,
    });
  }
  if (stream.getAudioTracks().length === 0) {
    stopTracks(stream);
    throw new Error('Keep "Also share tab audio" ticked when you share this tab, then try again');
  }
  return stream;
}

/**
 * The user's own microphone, through the permission Meet already holds on this page. Null
 * when it is unavailable; the call's audio is still recorded.
 */
export async function openMicrophone(): Promise<MediaStream | null> {
  try {
    return await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true } });
  } catch {
    return null;
  }
}

/** The call and the microphone mixed into one track, for the screen recording's soundtrack. */
export function mixAudio(
  context: AudioContext,
  tab: MediaStream,
  mic: MediaStream | null,
): MediaStreamTrack {
  const destination = context.createMediaStreamDestination();
  context.createMediaStreamSource(tab).connect(destination);
  if (mic !== null) {
    context.createMediaStreamSource(mic).connect(destination);
  }
  return destination.stream.getAudioTracks()[0];
}

/** Only the audio tracks of a stream, as their own stream (MediaRecorder records all tracks). */
export function audioOnly(stream: MediaStream): MediaStream {
  return new MediaStream(stream.getAudioTracks());
}
