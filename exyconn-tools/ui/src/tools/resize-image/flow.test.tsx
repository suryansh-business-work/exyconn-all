/**
 * Resize Image, end to end in the page: loading an image, the size controls (aspect lock,
 * percent and preset sizes), the output format, resizing and downloading.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
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
import ResizeImage from './index';

vi.mock('../../shared/components/ToolLayout/ToolLayout', async () =>
  (await import('../../__tests__/helpers/toolHarness')).toolLayoutStub()
);

const zone = () => screen.getByText('Drag & Drop Image Here').closest('.MuiPaper-root') as HTMLElement;
const widthBox = () => screen.getByLabelText('Width (px)');
const heightBox = () => screen.getByLabelText('Height (px)');
const resizeButton = () => screen.getByRole('button', { name: /^Resiz/ });

let tracked: ReturnType<typeof trackObjectUrls>;
let qualities: Array<number | undefined>;
let drawImage: ReturnType<typeof vi.fn>;
let fillRect: ReturnType<typeof vi.fn>;

beforeEach(() => {
  tracked = trackObjectUrls();
  qualities = encodeCanvasAs(30);
  installFakeImage({ autoLoad: true, width: 64, height: 48, failFor: (src) => src === 'blob:broken.png' });
  drawImage = vi.fn();
  fillRect = vi.fn();
  mockCanvasContext(() => ({ drawImage, fillRect }));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const loadPhoto = async (name = 'photo.png') => {
  dropFiles(zone(), [imageOf(name, 'image/png')]);
  expect(await screen.findByText(name)).toBeInTheDocument();
};

describe('ResizeImage page', () => {
  it('keeps every control disabled until an image is loaded', () => {
    render(<ResizeImage />);
    expect(widthBox()).toBeDisabled();
    expect(heightBox()).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Toggle aspect ratio lock' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '50%' })).toBeDisabled();
    expect(resizeButton()).toBeDisabled();
  });

  it('refuses a file that is not an image, and one that cannot be decoded', async () => {
    const { container } = render(<ResizeImage />);
    dropFiles(zone(), [imageOf('notes.txt', 'text/plain')]);
    expect(screen.getByText('Please select a JPG, PNG, WEBP, or GIF image.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    await settleSnackbar();

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [] } });
    fireEvent.change(input, { target: { files: [imageOf('broken.png', 'image/png')] } });
    expect(await screen.findByText('Could not read image.')).toBeInTheDocument();
    expect(widthBox()).toBeDisabled();
  });

  it('shows the loaded image with its size and keeps the aspect ratio while locked', async () => {
    render(<ResizeImage />);
    await loadPhoto();
    expect(screen.getByText('Original: 64 × 48 px')).toBeInTheDocument();
    expect(screen.getByAltText('Preview of photo.png')).toHaveAttribute('src', 'blob:photo.png');
    expect(widthBox()).toHaveValue(64);
    expect(heightBox()).toHaveValue(48);

    fireEvent.change(widthBox(), { target: { value: '32' } });
    expect(heightBox()).toHaveValue(24);
    fireEvent.change(heightBox(), { target: { value: '12' } });
    expect(widthBox()).toHaveValue(16);

    fireEvent.click(screen.getByRole('button', { name: 'Toggle aspect ratio lock' }));
    fireEvent.change(widthBox(), { target: { value: '100' } });
    expect(heightBox()).toHaveValue(12);
    fireEvent.change(heightBox(), { target: { value: 'x' } });
    expect(heightBox()).toHaveValue(1);
    expect(widthBox()).toHaveValue(100);
  });

  it('scales by percent of the original and applies a common size', async () => {
    render(<ResizeImage />);
    await loadPhoto();
    fireEvent.click(screen.getByRole('button', { name: '50%' }));
    expect([widthBox(), heightBox()].map((box) => (box as HTMLInputElement).value)).toEqual(['32', '24']);
    fireEvent.click(screen.getByRole('button', { name: 'Thumbnail 300×300' }));
    expect([widthBox(), heightBox()].map((box) => (box as HTMLInputElement).value)).toEqual(['300', '300']);
  });

  it('resizes to JPEG on white and names the download for the format it was encoded in', async () => {
    render(<ResizeImage />);
    await loadPhoto();
    fireEvent.click(screen.getByRole('button', { name: '25%' }));
    fireEvent.click(screen.getByRole('button', { name: 'JPEG' }));
    fireEvent.click(screen.getByRole('button', { name: 'JPEG' }));
    fireEvent.click(resizeButton());

    const download = await screen.findByRole('button', { name: 'Download (16 × 12)' });
    expect(fillRect).toHaveBeenCalledWith(0, 0, 16, 12);
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 16, 12);
    expect(qualities).toEqual([0.92]);

    fireEvent.click(screen.getByRole('button', { name: 'WEBP' }));
    fireEvent.click(download);
    expect(tracked.downloads).toHaveLength(1);
    expect(tracked.downloads[0].name).toBe('photo-16x12.jpg');
    expect(tracked.downloads[0].blob?.type).toBe('image/jpeg');
  });

  it('replaces the image and its result when another one is loaded', async () => {
    render(<ResizeImage />);
    await loadPhoto();
    fireEvent.click(resizeButton());
    await screen.findByRole('button', { name: /^Download/ });

    await loadPhoto('second.png');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:photo.png');
    expect(screen.queryByRole('button', { name: /^Download/ })).not.toBeInTheDocument();
    expect(screen.getByAltText('Preview of second.png')).toBeInTheDocument();
  });

  it('shows progress while resizing', async () => {
    let finish: () => void = () => undefined;
    HTMLCanvasElement.prototype.toBlob = function (cb: BlobCallback) {
      finish = () => cb(new Blob(['x']));
    };
    render(<ResizeImage />);
    await loadPhoto();
    fireEvent.click(resizeButton());
    expect(await screen.findByRole('button', { name: 'Resizing…' })).toBeDisabled();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    finish();
    expect(await screen.findByRole('button', { name: 'Download (64 × 48)' })).toBeInTheDocument();
  });

  it('reports a browser without canvas, an encoder that fails and an unknown failure', async () => {
    render(<ResizeImage />);
    await loadPhoto();
    mockCanvasContext(() => null);
    fireEvent.click(resizeButton());
    expect(await screen.findByText('Canvas is not supported in this browser.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    await settleSnackbar();

    mockCanvasContext(() => ({ drawImage, fillRect }));
    HTMLCanvasElement.prototype.toBlob = function (cb: BlobCallback) {
      cb(null);
    };
    fireEvent.click(resizeButton());
    expect(await screen.findByText('Image encoding failed.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    await settleSnackbar();

    HTMLCanvasElement.prototype.toBlob = () => {
      throw new NotAnError();
    };
    fireEvent.click(resizeButton());
    expect(await screen.findByText('Resize failed.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Download/ })).not.toBeInTheDocument();
  });
});
