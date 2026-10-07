import { describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImagePreview } from '@/components/ui';
import { DeviceUploadTab } from '@/components/ui/ImageUploadDialog/DeviceUploadTab';
import { MediaReview } from '@/components/ui/ImageUploadDialog/MediaReview';
import { PexelsGrid } from '@/components/ui/ImageUploadDialog/PexelsGrid';
import type { MediaSelection } from '@/components/ui/ImageUploadDialog/useMediaUpload';
import { pexelsItem } from './fixtures';

vi.mock('react-easy-crop', () => ({
  default: ({ image }: Readonly<{ image: string }>) => (
    <div data-testid="cropper" data-image={image} />
  ),
}));

describe('ImagePreview', () => {
  it('shows the image when there is one, else an empty frame', () => {
    const { rerender } = render(<ImagePreview url="https://cdn.example.com/logo.png" />);
    expect(screen.getByRole('img', { name: 'Selected preview' })).toHaveAttribute(
      'src',
      'https://cdn.example.com/logo.png',
    );

    rerender(<ImagePreview url={null} />);
    expect(screen.queryByRole('img', { name: 'Selected preview' })).not.toBeInTheDocument();
    expect(screen.getByTestId('ImageIcon')).toBeInTheDocument();
  });
});

describe('DeviceUploadTab', () => {
  it('opens the file picker from the button and hands the pick on', async () => {
    const inputRef = createRef<HTMLInputElement>();
    const onPick = vi.fn();
    render(<DeviceUploadTab currentUrl={null} inputRef={inputRef} onPick={onPick} />);
    const input = screen.getByTestId('image-upload-input');
    const click = vi.spyOn(input, 'click');

    await userEvent.click(screen.getByRole('button', { name: 'Choose image' }));
    expect(click).toHaveBeenCalledTimes(1);
    expect(input).toHaveAttribute('accept', 'image/*');
    expect(screen.getByText(/up to 5 MB/)).toBeInTheDocument();

    fireEvent.change(input, {
      target: { files: [new File(['x'], 'a.png', { type: 'image/png' })] },
    });
    expect(onPick).toHaveBeenCalledTimes(1);
  });

  it('does nothing on the button before the input has mounted', async () => {
    const inputRef = { current: null };
    render(
      <DeviceUploadTab
        currentUrl="https://cdn.example.com/a.png"
        inputRef={inputRef}
        onPick={vi.fn()}
      />,
    );
    const click = vi.spyOn(screen.getByTestId('image-upload-input'), 'click');
    inputRef.current = null;

    await userEvent.click(screen.getByRole('button', { name: 'Choose image' }));

    expect(click).not.toHaveBeenCalled();
    expect(screen.getByRole('img', { name: 'Selected preview' })).toBeInTheDocument();
  });
});

const selection = (patch: Partial<MediaSelection>): MediaSelection => ({
  previewUrl: 'data:image/png;base64,AAA',
  fileName: 'logo.png',
  mimeType: 'image/png',
  isVideo: false,
  isVector: false,
  ...patch,
});

describe('MediaReview', () => {
  it('puts a raster image on the crop canvas', () => {
    render(<MediaReview selection={selection({})} uploading={false} onCropChange={vi.fn()} />);

    expect(screen.getByTestId('cropper')).toHaveAttribute(
      'data-image',
      'data:image/png;base64,AAA',
    );
    expect(screen.getByText('logo.png')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('previews a clip muted with its poster, and shows progress while uploading', () => {
    const { container } = render(
      <MediaReview
        selection={selection({
          isVideo: true,
          previewUrl: 'poster.jpg',
          stockUrl: 'clip.mp4',
          fileName: 'pexels-1.mp4',
        })}
        uploading
        onCropChange={vi.fn()}
      />,
    );

    const video = container.querySelector('video');
    expect(video).toHaveAttribute('src', 'clip.mp4');
    expect(video).toHaveAttribute('poster', 'poster.jpg');
    expect(screen.queryByTestId('cropper')).not.toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows a vector as it is, never on the crop canvas', () => {
    render(
      <MediaReview
        selection={selection({ isVector: true, fileName: 'logo.svg' })}
        uploading={false}
        onCropChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('img', { name: 'logo.svg' })).toBeInTheDocument();
    expect(screen.queryByTestId('cropper')).not.toBeInTheDocument();
  });
});

describe('PexelsGrid', () => {
  it('credits each result and picks the one clicked', async () => {
    const onPick = vi.fn();
    const photo = pexelsItem();
    render(
      <PexelsGrid
        items={[photo, pexelsItem({ id: '102', alt: '', credit: 'Ana' })]}
        onPick={onPick}
      />,
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'Use A lighthouse at dusk by Mira Sol' }),
    );
    expect(onPick).toHaveBeenCalledWith(photo);
    expect(
      screen.getByRole('button', { name: 'Use this Pexels result by Ana' }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('PlayCircleIcon')).not.toBeInTheDocument();
  });

  it('marks a clip with its length as m:ss', () => {
    render(
      <PexelsGrid
        items={[pexelsItem({ id: '1', duration: 95 }), pexelsItem({ id: '2', duration: 7 })]}
        onPick={vi.fn()}
      />,
    );

    expect(screen.getByText('1:35')).toBeInTheDocument();
    expect(screen.getByText('0:07')).toBeInTheDocument();
    expect(screen.getAllByTestId('PlayCircleIcon')).toHaveLength(2);
    expect(within(screen.getAllByRole('button')[0]).getByText('Mira Sol')).toBeInTheDocument();
  });
});
