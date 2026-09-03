import type { WebcamCorner } from '@shared/types';

/**
 * How wide the webcam photo is drawn, as a share of the screenshot's width. Big enough to
 * recognise a face on a 1280px shot, small enough that it never covers the work it sits on.
 */
const OVERLAY_WIDTH_RATIO = 0.22;

/** Gap between the photo and the edges of the screenshot, as a share of its width. */
const MARGIN_RATIO = 0.015;

/** Fallback shape when a camera does not report usable dimensions. */
const DEFAULT_ASPECT = 4 / 3;

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Where the webcam photo goes on a screenshot of this size.
 *
 * Pure geometry, kept out of the drawing code so the one thing an admin actually chose — the
 * corner — can be tested without a camera, a canvas or a screen.
 */
export function overlayRect(
  corner: WebcamCorner,
  canvas: { width: number; height: number },
  aspectRatio: number,
): Rect {
  const usableAspect = aspectRatio > 0 ? aspectRatio : DEFAULT_ASPECT;
  const width = Math.round(canvas.width * OVERLAY_WIDTH_RATIO);
  const height = Math.round(width / usableAspect);
  const margin = Math.round(canvas.width * MARGIN_RATIO);

  const left = corner === 'top-left' || corner === 'bottom-left';
  const top = corner === 'top-left' || corner === 'top-right';

  return {
    x: left ? margin : canvas.width - width - margin,
    y: top ? margin : canvas.height - height - margin,
    width,
    height,
  };
}

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
