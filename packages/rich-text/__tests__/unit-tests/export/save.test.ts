import { afterEach, describe, expect, it, vi } from 'vitest';
import { fileStem, saveBlob } from '../../../src/export/save';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('fileStem', () => {
  it('replaces every character a file system refuses', () => {
    expect(fileStem('NDA: Acme / 2026')).toBe('NDA- Acme - 2026');
    expect(fileStem('a\\b*c?d"e<f>g|h')).toBe('a-b-c-d-e-f-g-h');
  });

  it('trims the title and falls back to "document" when nothing is left', () => {
    expect(fileStem('  Offer letter  ')).toBe('Offer letter');
    expect(fileStem('   ')).toBe('document');
  });
});

describe('saveBlob', () => {
  it('clicks a download link for the blob and releases its URL afterwards', () => {
    const createObjectURL = vi.fn(() => 'blob:mock/1');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL, revokeObjectURL }));
    const clicked: HTMLAnchorElement[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicked.push(this);
    });
    const blob = new Blob(['x'], { type: 'application/pdf' });

    saveBlob(blob, 'Offer.pdf');

    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(clicked).toHaveLength(1);
    expect(clicked[0]?.href).toBe('blob:mock/1');
    expect(clicked[0]?.download).toBe('Offer.pdf');
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock/1');
  });
});
