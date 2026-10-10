/**
 * Shared steps for the PDF/image tool tests: real PDFs built with pdf-lib, Files that can be
 * read back (jsdom's File has no arrayBuffer), and a capture of everything the tool downloads.
 */
import { vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { inflateSync } from 'node:zlib';
import { PDFDocument } from 'pdf-lib';

/** A real PDF with `pages` blank pages of the given size. */
export async function makePdf(pages = 2, size: [number, number] = [200, 300]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) doc.addPage(size);
  return doc.save();
}

/** Reads a Blob or File into bytes the way a browser would. */
export function readBytes(blob: Blob): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}

/** A File whose `arrayBuffer()` and `text()` work under jsdom. */
export function makeFile(bytes: BlobPart, name: string, type: string): File {
  const raw = typeof bytes === 'string' ? Uint8Array.from(new TextEncoder().encode(bytes)) : (bytes as Uint8Array);
  const file = new File([raw as BlobPart], name, { type });
  Object.defineProperty(file, 'arrayBuffer', {
    value: async () => raw.slice().buffer,
    configurable: true,
  });
  Object.defineProperty(file, 'text', {
    value: async () => new TextDecoder().decode(raw),
    configurable: true,
  });
  return file;
}

export const pdfFile = (bytes: Uint8Array, name = 'doc.pdf') => makeFile(bytes as BlobPart, name, 'application/pdf');

/** The page count of a downloaded PDF blob. */
export async function pageCountOf(blob: Blob): Promise<number> {
  const doc = await PDFDocument.load(await readBytes(blob));
  return doc.getPageCount();
}

export interface Download {
  name: string;
  blob: Blob;
}

/** Records every object URL the tool creates and every download it triggers. */
export function captureDownloads() {
  const downloads: Download[] = [];
  let lastBlob: Blob | null = null;
  let urls = 0;
  URL.createObjectURL = vi.fn((blob: Blob) => {
    lastBlob = blob;
    urls += 1;
    return `blob:captured-${urls}`;
  }) as typeof URL.createObjectURL;
  URL.revokeObjectURL = vi.fn();
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    downloads.push({ name: this.download, blob: lastBlob as Blob });
  });
  return downloads;
}

export const fileInput = (container: HTMLElement) => container.querySelector('input[type="file"]') as HTMLInputElement;

/** Picks files through the tool's hidden file input. */
export function upload(container: HTMLElement, ...files: File[]) {
  fireEvent.change(fileInput(container), { target: { files } });
}

/** Drops files on the dashed upload zone, hovering over it first. */
export function dropOnZone(file: File, zoneText: RegExp = /Drag & Drop/) {
  const zone = screen.getByText(zoneText).closest('.MuiPaper-root') as HTMLElement;
  fireEvent.dragOver(zone);
  fireEvent.dragLeave(zone);
  fireEvent.drop(zone, { dataTransfer: { files: [file] } });
}

/** A 1x1 PNG as a data URL, the smallest honest image fixture. */
export const PNG_1X1 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

/** The same 1x1 PNG as a File. */
export function pngFile(name = 'pic.png', type = 'image/png'): File {
  const binary = atob(PNG_1X1.split(',')[1]);
  const bytes = Uint8Array.from(binary, (ch) => ch.codePointAt(0) ?? 0);
  return makeFile(bytes as BlobPart, name, type);
}

/** Every inflated content stream of a PDF, in file order, as latin1 text. */
export async function contentStreams(blob: Blob): Promise<string[]> {
  const raw = Buffer.from(await readBytes(blob)).toString('latin1');
  const out: string[] = [];
  for (const match of raw.matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g)) {
    try {
      out.push(inflateSync(Buffer.from(match[1], 'latin1')).toString('latin1'));
    } catch {
      out.push(match[1]);
    }
  }
  return out;
}

/** The text a PDF draws, with the text matrix of each run, parsed from its content streams. */
export async function drawnText(blob: Blob) {
  const runs: { text: string; x: number; y: number; matrix: number[] }[] = [];
  const num = '([\\d.e-]+)';
  const pattern = new RegExp(`${Array(6).fill(num).join(' ')} Tm[\\s\\S]*?(?:\\(([^)]*)\\)|<([0-9A-Fa-f]*)>) Tj`, 'g');
  for (const stream of await contentStreams(blob)) {
    for (const m of stream.matchAll(pattern)) {
      const matrix = m.slice(1, 7).map(Number);
      const text = m[7] ?? Buffer.from(m[8], 'hex').toString('latin1');
      runs.push({ text, x: matrix[4], y: matrix[5], matrix });
    }
  }
  return runs;
}

/** A 1x1 baseline JPEG, the smallest honest JPEG fixture. */
const JPEG_1X1_BASE64 =
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

export function jpegFile(name = 'photo.jpg'): File {
  const bytes = Uint8Array.from(atob(JPEG_1X1_BASE64), (ch) => ch.codePointAt(0) ?? 0);
  return makeFile(bytes as BlobPart, name, 'image/jpeg');
}
