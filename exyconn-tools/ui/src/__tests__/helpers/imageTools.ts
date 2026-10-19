/**
 * Shared steps for the in-browser image tools (convert, compress, resize…): object URLs named
 * after the file they point at, so a test can make one image fail to decode, and a record of
 * every download with the blob behind it.
 */
import { vi } from 'vitest';
import { act, fireEvent } from '@testing-library/react';

export interface ImageDownload {
  name: string;
  blob: Blob | undefined;
}

/**
 * Object URLs read `blob:<file name>` for a File and `blob:out-<n>` for any other Blob, and
 * anchor clicks are recorded as downloads instead of navigating.
 */
export function trackObjectUrls() {
  const blobs = new Map<string, Blob>();
  const downloads: ImageDownload[] = [];
  let outputs = 0;
  URL.createObjectURL = vi.fn((blob: Blob) => {
    outputs += 1;
    const url = blob instanceof File ? `blob:${blob.name}` : `blob:out-${outputs}`;
    blobs.set(url, blob);
    return url;
  });
  URL.revokeObjectURL = vi.fn();
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    downloads.push({ name: this.download, blob: blobs.get(this.getAttribute('href') ?? '') });
  });
  return { downloads, blobs };
}

/** An image File of the given type whose size is the length of `content`. */
export const imageOf = (name: string, type = 'image/jpeg', content = 'abc') => new File([content], name, { type });

/** Every canvas encodes to a blob of `size` bytes in the type asked for, recording the quality. */
export function encodeCanvasAs(size: number) {
  const qualities: Array<number | undefined> = [];
  HTMLCanvasElement.prototype.toBlob = function (cb: BlobCallback, type?: string, quality?: number) {
    qualities.push(quality);
    cb(new Blob(['x'.repeat(size)], { type: type ?? 'image/png' }));
  };
  return qualities;
}

/** Lets a Snackbar's exit transition finish so its message leaves the DOM. */
export async function settleSnackbar() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
  });
}

/** Drops nothing, then the files, on the dashed zone that holds `zoneText`. */
export function dropFiles(zone: HTMLElement, files: File[]) {
  fireEvent.dragOver(zone);
  fireEvent.dragLeave(zone);
  fireEvent.drop(zone, { dataTransfer: { files: [] } });
  fireEvent.drop(zone, { dataTransfer: { files } });
}

/** Something thrown that is not an Error, as a third-party callback might. */
export class NotAnError {}
