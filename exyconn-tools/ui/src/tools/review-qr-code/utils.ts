import QRCode from 'qrcode';
import type { QRCodeRenderersOptions } from 'qrcode';

export const QR_SIZE_MIN = 200;
export const QR_SIZE_MAX = 1000;
export const QR_SIZE_DEFAULT = 300;
export const DEFAULT_FG_COLOR = '#000000';
export const DEFAULT_BG_COLOR = '#ffffff';

export interface QrStyle {
  size: number;
  fgColor: string;
  bgColor: string;
}

export const buildReviewUrl = (placeId: string): string => {
  const trimmed = placeId.trim();
  if (!trimmed) return '';
  return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(trimmed)}`;
};

export const clampQrSize = (value: number): number => {
  if (Number.isNaN(value)) return QR_SIZE_DEFAULT;
  return Math.min(QR_SIZE_MAX, Math.max(QR_SIZE_MIN, Math.round(value)));
};

export const buildQrOptions = ({ size, fgColor, bgColor }: QrStyle): QRCodeRenderersOptions => ({
  width: clampQrSize(size),
  margin: 2,
  errorCorrectionLevel: 'M',
  color: { dark: fgColor, light: bgColor },
});

export const renderQrToCanvas = (canvas: HTMLCanvasElement, text: string, style: QrStyle): Promise<void> =>
  QRCode.toCanvas(canvas, text, buildQrOptions(style));

export const qrToPngDataUrl = (text: string, style: QrStyle): Promise<string> =>
  QRCode.toDataURL(text, buildQrOptions(style));

export const downloadDataUrl = (dataUrl: string, fileName: string): void => {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = fileName;
  a.click();
};
