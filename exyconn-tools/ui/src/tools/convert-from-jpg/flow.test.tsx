/**
 * Convert from JPG, end to end in the page: adding files, the output options, converting
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
import ConvertFromJpg from './index';

vi.mock('../../shared/components/ToolLayout/ToolLayout', async () =>
  (await import('../../__tests__/helpers/toolHarness')).toolLayoutStub()
);

const zone = () => screen.getByText('Drag & Drop JPG Images Here').closest('.MuiPaper-root') as HTMLElement;
const input = (container: HTMLElement) => container.querySelector('input[type="file"]') as HTMLInputElement;
const convertButton = () => screen.getByRole('button', { name: /^Convert to/ });

let tracked: ReturnType<typeof trackObjectUrls>;
let qualities: Array<number | undefined>;

beforeEach(() => {
  tracked = trackObjectUrls();
  qualities = encodeCanvasAs(30);
  installFakeImage({ autoLoad: true, width: 64, height: 48, failFor: (src) => src === 'blob:broken.jpg' });
  mockCanvasContext(() => ({ drawImage: vi.fn() }));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('ConvertFromJpg page', () => {
  it('refuses files that are not JPG, until the message is closed', async () => {
    render(<ConvertFromJpg />);
    dropFiles(zone(), [imageOf('logo.png', 'image/png')]);
    expect(screen.getByText('Please select JPG images.')).toBeInTheDocument();
    expect(screen.queryByText(/file\(s\)/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    await settleSnackbar();
    expect(screen.queryByText('Please select JPG images.')).not.toBeInTheDocument();
  });

  it('keeps at most 20 files and says so, and clears them all', () => {
    const { container } = render(<ConvertFromJpg />);
    const files = Array.from({ length: 21 }, (_, n) => imageOf(`p${n}.jpg`));
    fireEvent.change(input(container), { target: { files } });
    expect(screen.getByText('20 file(s)')).toBeInTheDocument();
    expect(screen.getByText('Maximum 20 files at a time.')).toBeInTheDocument();
    fireEvent.change(input(container), { target: { files: [] } });
    expect(screen.getByText('20 file(s)')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Clear All' }));
    expect(screen.queryByText(/file\(s\)/)).not.toBeInTheDocument();
    expect(convertButton()).toBeDisabled();
  });

  it('converts to PNG, reports the file that fails and downloads each result', async () => {
    render(<ConvertFromJpg />);
    dropFiles(zone(), [imageOf('photo.jpg'), imageOf('broken.jpg')]);
    expect(screen.getByText('2 file(s)')).toBeInTheDocument();

    fireEvent.click(convertButton());
    expect(await screen.findByText('Could not read broken.jpg.')).toBeInTheDocument();
    expect(screen.getByText('3 B → 30 B')).toBeInTheDocument();
    expect(qualities).toEqual([undefined]);

    fireEvent.click(screen.getByRole('button', { name: 'Download photo.png' }));
    expect(tracked.downloads.map((d) => d.name)).toEqual(['photo.png']);
    expect(tracked.downloads[0].blob?.type).toBe('image/png');

    fireEvent.click(screen.getByRole('button', { name: 'Download All (1)' }));
    await waitFor(() => expect(tracked.downloads).toHaveLength(2));
    expect(tracked.downloads[1].name).toBe('photo.png');
  });

  it('converts to WEBP at the chosen quality', async () => {
    render(<ConvertFromJpg />);
    fireEvent.click(screen.getByRole('button', { name: 'WEBP' }));
    // Pressing the selected format again keeps it.
    fireEvent.click(screen.getByRole('button', { name: 'WEBP' }));
    expect(screen.queryByText(/PNG is lossless/)).not.toBeInTheDocument();
    const slider = screen.getByRole('slider', { name: /WEBP Quality/ });
    fireEvent.keyDown(slider, { key: 'ArrowLeft' });
    expect(screen.getByText('WEBP Quality: 85%')).toBeInTheDocument();

    dropFiles(zone(), [imageOf('photo.jpg')]);
    fireEvent.click(screen.getByRole('button', { name: 'Convert to WEBP' }));
    const download = await screen.findByRole('button', { name: 'Download photo.webp' });
    expect(qualities).toEqual([0.85]);
    fireEvent.click(download);
    expect(tracked.downloads[0]).toMatchObject({ name: 'photo.webp' });
    expect(tracked.downloads[0].blob?.type).toBe('image/webp');
  });

  it('shows its progress while converting', async () => {
    let finish: () => void = () => undefined;
    HTMLCanvasElement.prototype.toBlob = function (cb: BlobCallback) {
      finish = () => cb(new Blob(['x']));
    };
    render(<ConvertFromJpg />);
    dropFiles(zone(), [imageOf('photo.jpg')]);
    fireEvent.click(convertButton());
    expect(await screen.findByText('Converting 1 of 1…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Converting…' })).toBeDisabled();
    finish();
    expect(await screen.findByRole('button', { name: 'Download photo.png' })).toBeInTheDocument();
  });

  it('reports a browser without canvas, an encoder that fails, and an unknown failure', async () => {
    render(<ConvertFromJpg />);
    dropFiles(zone(), [imageOf('a.jpg')]);
    const list = () => within(screen.getByRole('list'));

    mockCanvasContext(() => null);
    fireEvent.click(convertButton());
    expect(await list().findByText('Canvas is not supported in this browser.')).toBeInTheDocument();

    mockCanvasContext(() => ({ drawImage: vi.fn() }));
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
