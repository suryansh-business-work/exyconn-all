import { vi } from 'vitest';

/** What the stub signature pad hands over when "Draw a signature" is pressed. */
export const PAD_SIGNATURE = 'data:image/png;base64,UEFE';

/**
 * Stands in for the shell's `SignaturePad` (its canvas is tested in @exyconn/shell): a button
 * that "draws" a fixed PNG.
 */
export function SignaturePadStub({
  label,
  helperText,
  onChange,
}: Readonly<{ label: string; helperText?: string; onChange: (value: string) => void }>) {
  return (
    <div data-testid="signature-pad">
      <p>{label}</p>
      <button type="button" onClick={() => onChange(PAD_SIGNATURE)}>
        Draw a signature
      </button>
      <p>{helperText}</p>
    </div>
  );
}

/** jsdom never loads images, so `onload` would never fire. This one "loads" next tick at 200 × 100. */
export class LoadingImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  naturalWidth = 200;
  naturalHeight = 100;

  set src(_value: string) {
    queueMicrotask(() => this.onload?.());
  }
}

/** A pdf.js document with `pages` pages of 612 × 792 points whose rendering just succeeds. */
export function fakePdfDoc(pages = 1, render = vi.fn(() => ({ promise: Promise.resolve() }))) {
  const page = {
    getViewport: ({ scale }: { scale: number }) => ({ width: 612 * scale, height: 792 * scale }),
    render,
  };
  return { numPages: pages, getPage: vi.fn(() => Promise.resolve(page)), render };
}
