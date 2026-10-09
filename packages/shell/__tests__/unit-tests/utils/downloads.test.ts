import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { downloadCsv } from '@/utils/csv';
import { downloadBase64File, fileToDataUrl } from '@/utils/file';

/** Captures the anchor each download clicks and the blob it points at. */
function trackDownloads() {
  const blobs: Blob[] = [];
  const anchors: HTMLAnchorElement[] = [];
  vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
    blobs.push(blob as Blob);
    return `blob:test/${blobs.length}`;
  });
  const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    anchors.push(this);
  });
  return { blobs, anchors, revoke };
}

describe('downloadCsv', () => {
  let tracked: ReturnType<typeof trackDownloads>;
  beforeEach(() => {
    tracked = trackDownloads();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('saves the text as UTF-8 CSV with a BOM, and frees the URL afterwards', async () => {
    downloadCsv('payroll.csv', 'a,b');

    const [blob] = tracked.blobs;
    expect(blob.type).toBe('text/csv;charset=utf-8');
    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect(Array.from(bytes.slice(0, 3))).toEqual([0xef, 0xbb, 0xbf]);
    expect(new TextDecoder().decode(bytes.slice(3))).toBe('a,b');
    expect(tracked.anchors[0].download).toBe('payroll.csv');
    expect(tracked.anchors[0].href).toBe('blob:test/1');
    expect(tracked.revoke).toHaveBeenCalledWith('blob:test/1');
  });

  it('adds the .csv extension when the name lacks it', () => {
    downloadCsv('leave-report', 'x');
    expect(tracked.anchors[0].download).toBe('leave-report.csv');
  });
});

describe('downloadBase64File', () => {
  let tracked: ReturnType<typeof trackDownloads>;
  beforeEach(() => {
    tracked = trackDownloads();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('decodes the base64 body into the exact bytes and saves it under the given name', async () => {
    const original = [0x25, 0x50, 0x44, 0x46, 0x00, 0xff];
    const base64 = btoa(String.fromCodePoint(...original));

    downloadBase64File('payslip.pdf', 'application/pdf', base64);

    const [blob] = tracked.blobs;
    expect(blob.type).toBe('application/pdf');
    expect([...new Uint8Array(await blob.arrayBuffer())]).toEqual(original);
    expect(tracked.anchors[0].download).toBe('payslip.pdf');
    expect(tracked.revoke).toHaveBeenCalledWith('blob:test/1');
  });

  it('rejects a body that is not base64', () => {
    expect(() => downloadBase64File('x.pdf', 'application/pdf', '%%%')).toThrow();
    expect(tracked.anchors).toHaveLength(0);
  });
});

/** A reader that fails the way the browser does, with or without an error object. */
function failingReader(error: DOMException | null) {
  return class {
    error = error;
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    readAsDataURL() {
      queueMicrotask(() => this.onerror?.());
    }
  };
}

describe('fileToDataUrl', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads a file as a base64 data URL', async () => {
    const file = new File(['hi'], 'a.txt', { type: 'text/plain' });
    await expect(fileToDataUrl(file)).resolves.toBe('data:text/plain;base64,aGk=');
  });

  it("rejects with the reader's own error", async () => {
    const error = new DOMException('Unreadable', 'NotReadableError');
    vi.stubGlobal('FileReader', failingReader(error));

    await expect(fileToDataUrl(new File(['x'], 'a.png'))).rejects.toBe(error);
  });

  it('rejects with a generic error when the reader gives none', async () => {
    vi.stubGlobal('FileReader', failingReader(null));

    await expect(fileToDataUrl(new File(['x'], 'a.png'))).rejects.toThrow('Failed to read file');
  });
});
