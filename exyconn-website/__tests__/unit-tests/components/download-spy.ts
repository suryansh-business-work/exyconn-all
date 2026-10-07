/**
 * Captures a "save as file" link (an object URL on a temporary <a download>) instead of letting
 * jsdom try to navigate to it. For jsdom test files.
 */
import { vi } from "vitest";

export interface SavedFile {
  href: string;
  download: string;
  /** Whether the link was in the page when it was clicked. */
  attached: boolean;
}

export function spyOnDownloads() {
  const blobs: Blob[] = [];
  const saved: SavedFile[] = [];
  const createObjectURL = vi.fn((blob: Blob) => {
    blobs.push(blob);
    return `blob:http://localhost/${blobs.length}`;
  });
  const revokeObjectURL = vi.fn();
  Object.assign(URL, { createObjectURL, revokeObjectURL });
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
    this: HTMLAnchorElement
  ) {
    saved.push({ href: this.href, download: this.download, attached: this.isConnected });
  });
  return { blobs, saved, createObjectURL, revokeObjectURL };
}
