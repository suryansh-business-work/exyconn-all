import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import UpscaleImage from './index';
import APIs from '../../shared/config/apis';
import { ACCEPTED_TYPES, formatBytes, outputFileName, upscaleErrorMessage, upscaleImage } from './utils';

vi.mock('../../shared/components/ToolLayout/ToolLayout', () => ({
  default: ({ children }: { children: ReactNode }) => <div data-testid="tool-layout">{children}</div>,
}));

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe('ACCEPTED_TYPES', () => {
  it('accepts jpeg, png, and webp only', () => {
    expect(ACCEPTED_TYPES.has('image/jpeg')).toBe(true);
    expect(ACCEPTED_TYPES.has('image/png')).toBe(true);
    expect(ACCEPTED_TYPES.has('image/webp')).toBe(true);
    expect(ACCEPTED_TYPES.has('image/gif')).toBe(false);
    expect(ACCEPTED_TYPES.has('application/pdf')).toBe(false);
  });
});

describe('formatBytes', () => {
  it('formats bytes, kilobytes, and megabytes', () => {
    expect(formatBytes(500)).toBe('500 B');
    expect(formatBytes(2048)).toBe('2.0 KB');
    expect(formatBytes(3 * 1024 * 1024)).toBe('3.00 MB');
  });
});

describe('outputFileName', () => {
  it('appends the scale before the original extension', () => {
    expect(outputFileName('photo.jpg', 2)).toBe('photo-upscaled-2x.jpg');
    expect(outputFileName('logo.final.png', 4)).toBe('logo.final-upscaled-4x.png');
  });

  it('defaults to png when the name has no extension', () => {
    expect(outputFileName('photo', 4)).toBe('photo-upscaled-4x.png');
  });
});

describe('upscaleErrorMessage', () => {
  it('reports too-large uploads for HTTP 413', () => {
    expect(upscaleErrorMessage(413)).toMatch(/too large/i);
  });

  it('reports service unavailability for 5xx statuses', () => {
    expect(upscaleErrorMessage(500)).toBe('Upscaling service is temporarily unavailable. Please try again later.');
    expect(upscaleErrorMessage(503)).toBe('Upscaling service is temporarily unavailable. Please try again later.');
  });

  it('falls back to a generic message with the status code', () => {
    expect(upscaleErrorMessage(400)).toBe('Upscaling failed (HTTP 400).');
  });
});

describe('upscaleImage', () => {
  const file = new File(['pixels'], 'photo.png', { type: 'image/png' });

  it('posts multipart form data with image and scale, returning the blob', async () => {
    const resultBlob = new Blob(['upscaled'], { type: 'image/png' });
    fetchMock.mockResolvedValue({ ok: true, status: 200, blob: () => Promise.resolve(resultBlob) });

    const blob = await upscaleImage(file, 4);

    expect(blob).toBe(resultBlob);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(APIs.imageTools.upscale, expect.objectContaining({ method: 'POST' }));
    const body = fetchMock.mock.calls[0][1].body as FormData;
    expect(body.get('scale')).toBe('4');
    expect((body.get('image') as File).name).toBe('photo.png');
  });

  it('rejects with a too-large message on HTTP 413', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 413 });
    await expect(upscaleImage(file, 2)).rejects.toThrow(/too large/i);
  });

  it('rejects with an unavailability message on HTTP 5xx', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 502 });
    await expect(upscaleImage(file, 2)).rejects.toThrow(/temporarily unavailable/i);
  });
});

describe('UpscaleImage component', () => {
  it('renders the upload zone, scale options, and disabled action button', () => {
    render(<UpscaleImage />);

    expect(screen.getByText('Drag & Drop Image Here')).toBeTruthy();
    expect(screen.getByText('Browse Files')).toBeTruthy();
    expect(screen.getByRole('button', { name: '2x' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '4x' })).toBeTruthy();
    const action = screen.getByRole('button', { name: 'Upscale Image' }) as HTMLButtonElement;
    expect(action.disabled).toBe(true);
    expect(screen.getByText(/Exyconn server/i)).toBeTruthy();
  });
});
