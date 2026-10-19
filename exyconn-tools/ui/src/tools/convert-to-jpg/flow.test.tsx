/**
 * Convert to JPG, end to end in the page: adding files, the quality option, converting
 * (including files that fail) and downloading the results one by one or all together.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { mockCanvasContext } from '../../__tests__/canvasMock';
import { installFakeImage } from '../../__tests__/helpers/imageMock';
import {
  NotAnError,
  dropFiles,
  encodeCanvasAs,
  imageOf,
  settleSnackbar,
  trackObjectUrls,
} from '../../__tests__/helpers/imageTools';
import ConvertToJpg from './index';

vi.mock('../../shared/components/ToolLayout/ToolLayout', async () =>
  (await import('../../__tests__/helpers/toolHarness')).toolLayoutStub()
);

const zone = () => screen.getByText('Drag & Drop Images Here').closest('.MuiPaper-root') as HTMLElement;
const input = (container: HTMLElement) => container.querySelector('input[type="file"]') as HTMLInputElement;
const convertButton = () => screen.getByRole('button', { name: /^Convert to JPG|^Converting/ });

let tracked: ReturnType<typeof trackObjectUrls>;
let qualities: Array<number | undefined>;

beforeEach(() => {
  tracked = trackObjectUrls();
  qualities = encodeCanvasAs(30);
  installFakeImage({ autoLoad: true, width: 64, height: 48, failFor: (src) => src === 'blob:broken.png' });
  mockCanvasContext(() => ({ drawImage: vi.fn(), fillRect: vi.fn() }));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('ConvertToJpg page', () => {
  it('refuses files that are not JPG, until the message is closed', async () => {
    render(<ConvertToJpg />);
    dropFiles(zone(), [imageOf('photo.jpg')]);
    expect(screen.getByText('Please select PNG, WEBP, GIF, or BMP images.')).toBeInTheDocument();
    expect(screen.queryByText(/file\(s\)/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    await settleSnackbar();
    expect(screen.queryByText('Please select PNG, WEBP, GIF, or BMP images.')).not.toBeInTheDocument();
  });

  it('keeps at most 20 files and says so, and clears them all', () => {
    const { container } = render(<ConvertToJpg />);
    const files = Array.from({ length: 21 }, (_, n) => imageOf(`p${n}.png`, 'image/png'));
    fireEvent.change(input(container), { target: { files } });
    expect(screen.getByText('20 file(s)')).toBeInTheDocument();
    expect(screen.getByText('Maximum 20 files at a time.')).toBeInTheDocument();
    fireEvent.change(input(container), { target: { files: [] } });
    expect(screen.getByText('20 file(s)')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Clear All' }));
    expect(screen.queryByText(/file\(s\)/)).not.toBeInTheDocument();
    expect(convertButton()).toBeDisabled();
  });

  it('converts at the chosen quality, reports the file that fails and downloads each result', async () => {
    render(<ConvertToJpg />);
    fireEvent.keyDown(screen.getByRole('slider', { name: /JPG Quality/ }), { key: 'ArrowRight' });
    expect(screen.getByText('JPG Quality: 95%')).toBeInTheDocument();
    dropFiles(zone(), [imageOf('logo.png', 'image/png'), imageOf('broken.png', 'image/png')]);
    expect(screen.getByText('2 file(s)')).toBeInTheDocument();

    fireEvent.click(convertButton());
    expect(await screen.findByText('Could not read broken.png.')).toBeInTheDocument();
    expect(screen.getByText('3 B → 30 B')).toBeInTheDocument();
    expect(qualities).toEqual([0.95]);

    fireEvent.click(screen.getByRole('button', { name: 'Download logo.jpg' }));
    expect(tracked.downloads.map((d) => d.name)).toEqual(['logo.jpg']);
    expect(tracked.downloads[0].blob?.type).toBe('image/jpeg');

    fireEvent.click(screen.getByRole('button', { name: 'Download All (1)' }));
    await waitFor(() => expect(tracked.downloads).toHaveLength(2));
    expect(tracked.downloads[1].name).toBe('logo.jpg');
  });

  it('shows its progress while converting', async () => {
    let finish: () => void = () => undefined;
    HTMLCanvasElement.prototype.toBlob = function (cb: BlobCallback) {
      finish = () => cb(new Blob(['x']));
    };
    render(<ConvertToJpg />);
    dropFiles(zone(), [imageOf('logo.png', 'image/png')]);
    fireEvent.click(convertButton());
    expect(await screen.findByText('Converting 1 of 1…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Converting…' })).toBeDisabled();
    finish();
    expect(await screen.findByRole('button', { name: 'Download logo.jpg' })).toBeInTheDocument();
  });

  it('reports a browser without canvas, an encoder that fails, and an unknown failure', async () => {
    render(<ConvertToJpg />);
    dropFiles(zone(), [imageOf('a.png', 'image/png')]);
    const list = () => within(screen.getByRole('list'));

    mockCanvasContext(() => null);
    fireEvent.click(convertButton());
    expect(await list().findByText('Canvas is not supported in this browser.')).toBeInTheDocument();

    mockCanvasContext(() => ({ drawImage: vi.fn(), fillRect: vi.fn() }));
    HTMLCanvasElement.prototype.toBlob = function (cb: BlobCallback) {
      cb(null);
    };
    fireEvent.click(convertButton());
    expect(await list().findByText('Image encoding failed.')).toBeInTheDocument();

    HTMLCanvasElement.prototype.toBlob = () => {
      throw new NotAnError();
    };
    fireEvent.click(convertButton());
    expect(await list().findByText('Conversion failed.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Download All/ })).not.toBeInTheDocument();
  });
});
