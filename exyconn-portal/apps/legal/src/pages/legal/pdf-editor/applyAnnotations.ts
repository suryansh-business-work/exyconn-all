import { PDFDocument, StandardFonts, rgb, type PDFPage } from 'pdf-lib';
import { HIGHLIGHT, type PdfAnnotation } from './pdf-editor.types';
import { inSequence } from '@exyconn/shell/utils/inSequence';

/** "#1d4ed8" as pdf-lib's 0–1 RGB. */
export function hexToRgb(hex: string) {
  const value = Number.parseInt(hex.slice(1), 16);
  return rgb(((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255);
}

/** A data URL's bytes, and whether it is a PNG (else a JPEG). */
function imageBytes(src: string): { bytes: Uint8Array; png: boolean } {
  const [head, base64] = src.split(',');
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (char) => char.codePointAt(0) ?? 0);
  return { bytes, png: head.includes('image/png') };
}

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** An annotation's box in the page's points; PDF measures y from the bottom. */
function boxOn(page: PDFPage, a: PdfAnnotation): Box {
  const { width, height } = page.getSize();
  return {
    x: a.x * width,
    y: height - (a.y + a.h) * height,
    width: a.w * width,
    height: a.h * height,
  };
}

async function draw(doc: PDFDocument, page: PDFPage, a: PdfAnnotation) {
  const box = boxOn(page, a);
  const { width, height } = page.getSize();
  switch (a.kind) {
    case 'text': {
      const font = await doc.embedFont(StandardFonts.Helvetica);
      a.text.split('\n').forEach((line, index) => {
        page.drawText(line, {
          x: box.x,
          y: height - a.y * height - a.fontSize * (index + 1),
          size: a.fontSize,
          font,
          color: hexToRgb(a.color),
        });
      });
      return;
    }
    case 'rect':
      page.drawRectangle({ ...box, borderColor: hexToRgb(a.color), borderWidth: 2 });
      return;
    case 'highlight':
      page.drawRectangle({ ...box, color: hexToRgb(HIGHLIGHT.color), opacity: HIGHLIGHT.opacity });
      return;
    case 'whiteout':
      page.drawRectangle({ ...box, color: rgb(1, 1, 1) });
      return;
    case 'draw':
      for (let i = 1; i < a.points.length; i += 1) {
        const [x1, y1] = a.points[i - 1];
        const [x2, y2] = a.points[i];
        page.drawLine({
          start: { x: x1 * width, y: height - y1 * height },
          end: { x: x2 * width, y: height - y2 * height },
          thickness: 2,
          color: hexToRgb(a.color),
        });
      }
      return;
    case 'image': {
      const { bytes, png } = imageBytes(a.src);
      const image = png ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
      page.drawImage(image, box);
    }
  }
}

/** Writes every annotation into the PDF itself and returns the new file's bytes. */
export async function applyAnnotations(
  bytes: Uint8Array,
  annotations: readonly PdfAnnotation[],
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes);
  const pages = doc.getPages();
  // In order: a later annotation is drawn over an earlier one.
  await inSequence(annotations, async (annotation) => {
    const page = pages[annotation.page];
    if (page) {
      await draw(doc, page, annotation);
    }
  });
  return doc.save();
}
