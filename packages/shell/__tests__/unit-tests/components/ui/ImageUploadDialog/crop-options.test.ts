import { describe, expect, it } from 'vitest';
import {
  clampZoom,
  DEFAULT_COLOR,
  MAX_ZOOM,
  MIN_ZOOM,
  ratioOf,
  resolveFill,
  zoomFor,
} from '@/components/ui/ImageUploadDialog/crop-options';

describe('ratioOf', () => {
  it('gives each shape its ratio, and none for the image own shape', () => {
    expect(ratioOf('original')).toBeUndefined();
    expect(ratioOf('square')).toBe(1);
    expect(ratioOf('story')).toBe(9 / 16);
  });
});

describe('clampZoom', () => {
  it('keeps the zoom between its limits', () => {
    expect(clampZoom(0.01)).toBe(MIN_ZOOM);
    expect(clampZoom(9)).toBe(MAX_ZOOM);
    expect(clampZoom(1.5)).toBe(1.5);
  });
});

describe('zoomFor', () => {
  it('fills at 100% whatever the shapes', () => {
    expect(zoomFor('fill', 2, 1)).toBe(1);
  });

  it('fits a wide or a tall image whole inside the frame, with a margin', () => {
    expect(zoomFor('fit', 2, 1)).toBeCloseTo(0.45);
    expect(zoomFor('fit', 0.5, 1)).toBeCloseTo(0.45);
    expect(zoomFor('fit', 1, 1)).toBeCloseTo(0.9);
  });

  it('never fits below the smallest zoom', () => {
    expect(zoomFor('fit', 10, 1)).toBe(MIN_ZOOM);
  });
});

describe('resolveFill', () => {
  it('blurs, or paints the picked colour', () => {
    expect(resolveFill('blur', '#000000', null, true)).toEqual({ kind: 'blur' });
    expect(resolveFill('color', '#123456', '#ffffff', true)).toEqual({
      kind: 'color',
      color: '#123456',
    });
  });

  it('paints the edge colour on auto, and nothing while it is unknown', () => {
    expect(resolveFill('auto', '#000000', '#fefefe', true)).toEqual({
      kind: 'color',
      color: '#fefefe',
    });
    expect(resolveFill('auto', '#000000', null, true)).toEqual({ kind: 'none' });
  });

  it('leaves the space clear on transparent, unless transparency is not allowed', () => {
    expect(resolveFill('transparent', '#000000', '#fefefe', true)).toEqual({ kind: 'none' });
    expect(resolveFill('transparent', '#000000', null, false)).toEqual({
      kind: 'color',
      color: DEFAULT_COLOR,
    });
  });
});
