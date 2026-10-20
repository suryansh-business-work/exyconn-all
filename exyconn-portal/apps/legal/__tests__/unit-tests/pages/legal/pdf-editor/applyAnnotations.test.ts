import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { PDFDocument, PDFPage, rgb } from 'pdf-lib';
import {
  applyAnnotations,
  hexToRgb,
} from '../../../../../src/pages/legal/pdf-editor/applyAnnotations';
import type { PdfAnnotation } from '../../../../../src/pages/legal/pdf-editor/pdf-editor.types';

/** 1×1 pictures, as the stamp dialog hands them over. */
const PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
const JPEG =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

/** A real two-page PDF, 600 × 800 points a page, so fractions map onto round numbers. */
let blank: Uint8Array;
beforeAll(async () => {
  const doc = await PDFDocument.create();
  doc.addPage([600, 800]);
  doc.addPage([600, 800]);
  blank = await doc.save();
});

afterEach(() => {
  vi.restoreAllMocks();
});

const at = { id: 'a', page: 0, x: 0.1, y: 0.25, w: 0.5, h: 0.125 };

describe('hexToRgb', () => {
  it('turns a hex colour into pdf-lib’s 0–1 channels', () => {
    expect(hexToRgb('#ff0000')).toEqual(rgb(1, 0, 0));
    expect(hexToRgb('#000000')).toEqual(rgb(0, 0, 0));
    const blue = hexToRgb('#1d4ed8');
    expect(blue).toEqual(rgb(0x1d / 255, 0x4e / 255, 0xd8 / 255));
  });
});

describe('applyAnnotations', () => {
  it('hands back an untouched copy when there is nothing to write', async () => {
    const saved = await applyAnnotations(blank, []);
    const doc = await PDFDocument.load(saved);
    expect(doc.getPageCount()).toBe(2);
    expect(doc.getPage(0).getSize()).toEqual({ width: 600, height: 800 });
  });

  it('writes each line of text down from the box’s top, in the chosen ink and size', async () => {
    const drawText = vi.spyOn(PDFPage.prototype, 'drawText');
    const text: PdfAnnotation = {
      ...at,
      kind: 'text',
      text: 'First line\nSecond line',
      fontSize: 12,
      color: '#b91c1c',
    };

    const saved = await applyAnnotations(blank, [text]);

    expect(drawText).toHaveBeenCalledTimes(2);
    // y is measured from the bottom: 800 - 0.25 × 800 = 600, less one line per row.
    expect(drawText).toHaveBeenNthCalledWith(
      1,
      'First line',
      expect.objectContaining({ x: 60, y: 588, size: 12, color: hexToRgb('#b91c1c') }),
    );
    expect(drawText).toHaveBeenNthCalledWith(
      2,
      'Second line',
      expect.objectContaining({ x: 60, y: 576 }),
    );
    expect((await PDFDocument.load(saved)).getPageCount()).toBe(2);
  });

  it('draws boxes, highlights and white-outs onto the page with PDF’s bottom-up y', async () => {
    const drawRectangle = vi.spyOn(PDFPage.prototype, 'drawRectangle');
    const box = { x: 60, y: 500, width: 300, height: 100 };

    await applyAnnotations(blank, [
      { ...at, kind: 'rect', color: '#15803d' },
      { ...at, id: 'b', kind: 'highlight' },
      { ...at, id: 'c', kind: 'whiteout' },
    ]);

    expect(drawRectangle).toHaveBeenNthCalledWith(1, {
      ...box,
      borderColor: hexToRgb('#15803d'),
      borderWidth: 2,
    });
    expect(drawRectangle).toHaveBeenNthCalledWith(2, {
      ...box,
      color: hexToRgb('#facc15'),
      opacity: 0.35,
    });
    expect(drawRectangle).toHaveBeenNthCalledWith(3, { ...box, color: rgb(1, 1, 1) });
  });

  it('joins a stroke’s points with lines, and draws nothing for a single dot', async () => {
    const drawLine = vi.spyOn(PDFPage.prototype, 'drawLine');

    await applyAnnotations(blank, [
      {
        ...at,
        kind: 'draw',
        color: '#111827',
        points: [
          [0, 0],
          [0.5, 0.5],
          [1, 1],
        ],
      },
      { ...at, id: 'dot', kind: 'draw', color: '#111827', points: [[0.2, 0.2]] },
    ]);

    expect(drawLine).toHaveBeenCalledTimes(2);
    expect(drawLine).toHaveBeenNthCalledWith(1, {
      start: { x: 0, y: 800 },
      end: { x: 300, y: 400 },
      thickness: 2,
      color: hexToRgb('#111827'),
    });
    expect(drawLine).toHaveBeenNthCalledWith(2, expect.objectContaining({ end: { x: 600, y: 0 } }));
  });

  it('embeds a PNG or a JPEG picture in its box', async () => {
    const embedPng = vi.spyOn(PDFDocument.prototype, 'embedPng');
    const embedJpg = vi.spyOn(PDFDocument.prototype, 'embedJpg');
    const drawImage = vi.spyOn(PDFPage.prototype, 'drawImage');

    const saved = await applyAnnotations(blank, [
      { ...at, kind: 'image', src: PNG },
      { ...at, id: 'j', page: 1, kind: 'image', src: JPEG },
    ]);

    expect(embedPng).toHaveBeenCalledTimes(1);
    expect(embedJpg).toHaveBeenCalledTimes(1);
    expect(drawImage).toHaveBeenCalledTimes(2);
    expect(drawImage.mock.calls[0][1]).toEqual({ x: 60, y: 500, width: 300, height: 100 });
    expect(saved.length).toBeGreaterThan(blank.length);
  });

  it('skips an annotation on a page the file does not have', async () => {
    const drawRectangle = vi.spyOn(PDFPage.prototype, 'drawRectangle');

    const saved = await applyAnnotations(blank, [{ ...at, page: 5, kind: 'whiteout' }]);

    expect(drawRectangle).not.toHaveBeenCalled();
    expect((await PDFDocument.load(saved)).getPageCount()).toBe(2);
  });
});
