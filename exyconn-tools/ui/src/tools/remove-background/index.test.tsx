import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import RemoveBackground from './index';
import APIs from '../../shared/config/apis';
import {
  ACCEPTED_TYPES, fileToDataUrl, formatBytes, outputFileName,
  removeBackground, removeBackgroundErrorMessage,
} from './utils';

vi.mock('../../shared/components/ToolLayout/ToolLayout', () => ({
  default: ({ children }: { children: ReactNode }) => <div data-testid="tool-layout">{children}</div>,
}));

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
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
    expect(ACCEPTED_TYPES.has('image/svg+xml')).toBe(false);
  });
});

describe('formatBytes', () => {
  it('formats bytes, kilobytes, and megabytes', () => {
    expect(formatBytes(100)).toBe('100 B');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.00 MB');
  });
});

describe('outputFileName', () => {
  it('replaces the extension with a -no-background png suffix', () => {
    expect(outputFileName('logo.jpg')).toBe('logo-no-background.png');
    expect(outputFileName('team.photo.webp')).toBe('team.photo-no-background.png');
  });

  it('handles names without an extension', () => {
    expect(outputFileName('portrait')).toBe('portrait-no-background.png');
  });
});

describe('removeBackgroundErrorMessage', () => {
  it('reports too-large uploads for HTTP 413', () => {
    expect(removeBackgroundErrorMessage(413)).toMatch(/too large/i);
  });

  it('reports service unavailability for 5xx statuses', () => {
    expect(removeBackgroundErrorMessage(500)).toBe('Background removal service is temporarily unavailable. Please try again later.');
    expect(removeBackgroundErrorMessage(502)).toBe('Background removal service is temporarily unavailable. Please try again later.');
  });

  it('falls back to a generic message with the status code', () => {
    expect(removeBackgroundErrorMessage(422)).toBe('Background removal failed (HTTP 422).');
  });
});

describe('fileToDataUrl', () => {
  it('reads a file into a data URL', async () => {
    const file = new File(['hello'], 'note.txt', { type: 'text/plain' });
    const dataUrl = await fileToDataUrl(file);
    expect(dataUrl.startsWith('data:text/plain')).toBe(true);
  });
});

describe('removeBackground', () => {
  it('posts the data URL as JSON and returns the processed image', async () => {
    const processed = 'data:image/png;base64,cHJvY2Vzc2Vk';
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true, image: processed }),
    });

    const image = await removeBackground('data:image/png;base64,b3JpZ2luYWw=');

    expect(image).toBe(processed);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(APIs.imageTools.removeBackground, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: 'data:image/png;base64,b3JpZ2luYWw=' }),
    });
  });

  it('rejects with an unavailability message on HTTP 5xx', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 });
    await expect(removeBackground('data:image/png;base64,eA==')).rejects.toThrow(/temporarily unavailable/i);
  });

  it('rejects when the server returns no image', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({ success: false }) });
    await expect(removeBackground('data:image/png;base64,eA==')).rejects.toThrow(/no image/i);
  });
});

describe('RemoveBackground component', () => {
  it('renders the upload zone, disabled action button, and server note', () => {
    render(<RemoveBackground />);

    expect(screen.getByText('Drag & Drop Image Here')).toBeTruthy();
    expect(screen.getByText('Browse Files')).toBeTruthy();
    const action = screen.getByRole('button', { name: 'Remove Background' }) as HTMLButtonElement;
    expect(action.disabled).toBe(true);
    expect(screen.getByText(/Processing happens on the Exyconn server/i)).toBeTruthy();
  });
});
