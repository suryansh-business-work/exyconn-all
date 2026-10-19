/**
 * Compress Image, end to end in the page: adding files, the compression options, compressing
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
import CompressImage from './index';

vi.mock('../../shared/components/ToolLayout/ToolLayout', async () =>
  (await import('../../__tests__/helpers/toolHarness')).toolLayoutStub()
);

const zone = () => screen.getByText('Drag & Drop Images Here').closest('.MuiPaper-root') as HTMLElement;
const input = (container: HTMLElement) => container.querySelector('input[type="file"]') as HTMLInputElement;
const compressButton = () => screen.getByRole('button', { name: /^Compress/ });
let drawImage: ReturnType<typeof vi.fn>;
let fillRect: ReturnType<typeof vi.fn>;

let tracked: ReturnType<typeof trackObjectUrls>;
let qualities: Array<number | undefined>;

beforeEach(() => {
  tracked = trackObjectUrls();
  qualities = encodeCanvasAs(30);
  installFakeImage({ autoLoad: true, width: 64, height: 48, failFor: (src) => src === 'blob:broken.jpg' });
  drawImage = vi.fn();
  fillRect = vi.fn();
  mockCanvasContext(() => ({ drawImage, fillRect }));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('CompressImage page', () => {
  it('refuses files that are not images, until the message is closed', async () => {
    render(<CompressImage />);
    dropFiles(zone(), [imageOf('notes.txt', 'text/plain')]);
    expect(screen.getByText('Please select JPG, PNG, WEBP, or GIF images.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    await settleSnackbar();
    expect(screen.queryByText('Please select JPG, PNG, WEBP, or GIF images.')).not.toBeInTheDocument();
  });

  it('keeps at most 20 files and says so, and clears them all', () => {
    const { container } = render(<CompressImage />);
    const files = Array.from({ length: 21 }, (_, n) => imageOf(`p${n}.png`, 'image/png'));
    fireEvent.change(input(container), { target: { files } });
    expect(screen.getByText('20 file(s)')).toBeInTheDocument();
    expect(screen.getByText('Maximum 20 files at a time.')).toBeInTheDocument();
    fireEvent.change(input(container), { target: { files: [] } });
    expect(screen.getByText('20 file(s)')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Clear All' }));
    expect(screen.queryByText(/file\(s\)/)).not.toBeInTheDocument();
    expect(compressButton()).toBeDisabled();
  });

  it('compresses to JPEG on white, shows the saving or growth, and downloads each result', async () => {
    render(<CompressImage />);
    fireEvent.keyDown(screen.getByRole('slider', { name: /Quality/ }), { key: 'ArrowLeft' });
    expect(screen.getByText('Quality: 75%')).toBeInTheDocument();
    dropFiles(zone(), [
      imageOf('big.png', 'image/png', 'x'.repeat(3000)),
      imageOf('tiny.png', 'image/png'),
      imageOf('broken.jpg'),
    ]);

    fireEvent.click(compressButton());
    expect(await screen.findByText('Could not read broken.jpg.')).toBeInTheDocument();
    expect(screen.getByText('2.9 KB → 30 B')).toBeInTheDocument();
    expect(screen.getByText('99% saved').closest('.MuiChip-root')).toHaveClass('MuiChip-colorSuccess');
    expect(screen.getByText('-900% saved').closest('.MuiChip-root')).toHaveClass('MuiChip-colorDefault');
    expect(qualities).toEqual([0.75, 0.75]);
    expect(fillRect).toHaveBeenCalledWith(0, 0, 64, 48);

    fireEvent.click(screen.getByRole('button', { name: 'Download big.png' }));
    expect(tracked.downloads.map((d) => d.name)).toEqual(['big-compressed.jpg']);
    expect(tracked.downloads[0].blob?.type).toBe('image/jpeg');

    fireEvent.click(screen.getByRole('button', { name: 'Download All (2)' }));
    await waitFor(() => expect(tracked.downloads).toHaveLength(3));
    expect(tracked.downloads.map((d) => d.name)).toEqual([
      'big-compressed.jpg',
      'big-compressed.jpg',
      'tiny-compressed.jpg',
    ]);
  });

  it('compresses to WEBP within a size limit', async () => {
    render(<CompressImage />);
    fireEvent.click(screen.getByRole('button', { name: 'WEBP' }));
    fireEvent.click(screen.getByRole('button', { name: 'WEBP' }));
    expect(screen.queryByLabelText('Max width/height (px)')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Limit max dimension' }));
    const limit = screen.getByLabelText('Max width/height (px)');
    fireEvent.change(limit, { target: { value: 'abc' } });
    expect(limit).toHaveValue(1);
    fireEvent.change(limit, { target: { value: '-5' } });
    expect(limit).toHaveValue(1);
    fireEvent.change(limit, { target: { value: '32' } });
    expect(limit).toHaveValue(32);

    dropFiles(zone(), [imageOf('photo.jpg')]);
    fireEvent.click(compressButton());
    fireEvent.click(await screen.findByRole('button', { name: 'Download photo.jpg' }));
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 32, 24);
    expect(fillRect).not.toHaveBeenCalled();
    expect(tracked.downloads[0].name).toBe('photo-compressed.webp');
    expect(tracked.downloads[0].blob?.type).toBe('image/webp');
  });

  it('shows its progress while compressing', async () => {
    let finish: () => void = () => undefined;
    HTMLCanvasElement.prototype.toBlob = function (cb: BlobCallback) {
      finish = () => cb(new Blob(['x']));
    };
    render(<CompressImage />);
    dropFiles(zone(), [imageOf('photo.jpg')]);
    fireEvent.click(compressButton());
    expect(await screen.findByText('Compressing 1 of 1…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Compressing…' })).toBeDisabled();
    finish();
    expect(await screen.findByRole('button', { name: 'Download photo.jpg' })).toBeInTheDocument();
  });

  it('reports a browser without canvas, an encoder that fails, and an unknown failure', async () => {
    render(<CompressImage />);
    dropFiles(zone(), [imageOf('a.jpg')]);
    const list = () => within(screen.getByRole('list'));

    mockCanvasContext(() => null);
    fireEvent.click(compressButton());
    expect(await list().findByText('Canvas is not supported in this browser.')).toBeInTheDocument();

    mockCanvasContext(() => ({ drawImage, fillRect }));
    HTMLCanvasElement.prototype.toBlob = function (cb: BlobCallback) {
      cb(null);
    };
    fireEvent.click(compressButton());
    expect(await list().findByText('Image encoding failed.')).toBeInTheDocument();

    HTMLCanvasElement.prototype.toBlob = () => {
      throw new NotAnError();
    };
    fireEvent.click(compressButton());
    expect(await list().findByText('Compression failed.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Download All/ })).not.toBeInTheDocument();
  });
});
