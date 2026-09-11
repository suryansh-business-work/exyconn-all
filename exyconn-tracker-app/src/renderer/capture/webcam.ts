/** Turns base64 + a MIME type into a drawable image. */
export function loadImage(base64: string, mimeType: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('The screen capture could not be decoded.'));
    image.src = `data:${mimeType};base64,${base64}`;
  });
}

/**
 * Grabs a single frame from the webcam and releases the camera immediately.
 *
 * The light going on and straight back off is the honest signal, and holding the device open
 * between captures would leave it lit for the whole working day — which would say something
 * about this app that is not true.
 */
export async function grabWebcamFrame(): Promise<HTMLVideoElement> {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: { ideal: 640 }, height: { ideal: 480 } },
    audio: false,
  });

  const video = document.createElement('video');
  video.srcObject = stream;
  video.muted = true;

  try {
    await video.play();
    // One frame is not necessarily ready the instant play() resolves; a camera that has just
    // woken up hands over black pixels until it has metered the scene.
    await new Promise((resolve) => {
      requestAnimationFrame(resolve);
    });
    return video;
  } finally {
    stream.getTracks().forEach((track) => track.stop());
  }
}
