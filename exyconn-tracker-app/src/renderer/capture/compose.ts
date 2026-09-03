import type { CaptureRequest } from '@shared/types';
import { grabWebcamFrame, loadImage, overlayRect } from './webcam';

/** Radius of the rounded frame drawn around the photo, as a share of its width. */
const CORNER_RADIUS_RATIO = 0.06;

/** Border thickness around the photo, so it reads as an inset and not as part of the screen. */
const BORDER_RATIO = 0.012;

/** Strips the `data:<mime>;base64,` prefix a canvas adds — the portal is sent raw base64. */
function toBase64(dataUrl: string): string {
  return dataUrl.slice(dataUrl.indexOf(',') + 1);
}

/** Draws the webcam frame into the chosen corner, inside a rounded, bordered card. */
function drawOverlay(
  context: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  request: CaptureRequest,
  canvas: HTMLCanvasElement,
): void {
  const aspect = video.videoWidth / video.videoHeight;
  const rect = overlayRect(request.corner, canvas, aspect);
  const radius = Math.round(rect.width * CORNER_RADIUS_RATIO);
  const border = Math.max(1, Math.round(rect.width * BORDER_RATIO));

  context.save();
  context.beginPath();
  context.roundRect(rect.x, rect.y, rect.width, rect.height, radius);
  context.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  context.lineWidth = border;
  context.stroke();
  context.clip();
  context.drawImage(video, rect.x, rect.y, rect.width, rect.height);
  context.restore();
}

/**
 * Composites the webcam photo into the corner of a screen capture and returns it in the same
 * encoding main asked for — PNG stays lossless, a JPEG keeps the workspace's quality.
 *
 * Runs in whichever renderer is alive, which is normally the hidden tray window: a hidden
 * BrowserWindow still runs its JS, still reaches the camera, and still draws to a canvas, so
 * a capture never depends on which page the employee happens to be looking at.
 */
export async function composeCapture(request: CaptureRequest): Promise<string> {
  const screen = await loadImage(request.screen, request.mimeType);

  const canvas = document.createElement('canvas');
  canvas.width = screen.naturalWidth;
  canvas.height = screen.naturalHeight;

  const context = canvas.getContext('2d');
  if (context === null) {
    throw new Error('This window cannot draw the capture.');
  }
  context.drawImage(screen, 0, 0);

  const video = await grabWebcamFrame();
  drawOverlay(context, video, request, canvas);

  // A canvas only encodes JPEG or PNG, which is exactly the two the quality dial produces.
  return toBase64(canvas.toDataURL(request.mimeType, request.quality / 100));
}
