/**
 * Asks Chrome for microphone access from this extension page. The offscreen recorder cannot
 * show a permission prompt, so the grant has to be made here, once, for the extension.
 */
export async function requestMicrophone(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    for (const track of stream.getTracks()) {
      track.stop();
    }
    return true;
  } catch {
    return false;
  }
}
