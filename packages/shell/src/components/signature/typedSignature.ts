/** The signature canvas's drawing size, in CSS pixels. */
export const SIGNATURE_HEIGHT = 180;

/** A typed name rendered as a signature: script-style ink on a transparent PNG. */
export function renderTypedSignature(name: string, ink: string, width = 600): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = SIGNATURE_HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) {
    return '';
  }
  context.fillStyle = ink;
  context.font = 'italic 56px "Segoe Script", "Brush Script MT", cursive';
  context.textBaseline = 'middle';
  context.fillText(name.trim(), 24, SIGNATURE_HEIGHT / 2, width - 48);
  return canvas.toDataURL('image/png');
}
