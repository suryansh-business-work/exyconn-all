import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImageCropper } from '@/components/ui/ImageUploadDialog/ImageCropper';

interface CropperStubProps {
  image: string;
  aspect?: number;
  zoom: number;
  crop: { x: number; y: number };
  onCropChange: (point: { x: number; y: number }) => void;
  onZoomChange: (zoom: number) => void;
  onCropComplete: (area: object, pixels: object) => void;
  onMediaLoaded: (media: { naturalWidth: number; naturalHeight: number }) => void;
}

// react-easy-crop measures a real layout jsdom does not have; this stand-in reports what the
// cropper was told and lets a test fire the callbacks the library would.
vi.mock('react-easy-crop', () => ({
  default: (props: Readonly<CropperStubProps>) => (
    <div
      data-testid="cropper"
      data-image={props.image}
      data-aspect={String(props.aspect)}
      data-zoom={String(props.zoom)}
      data-crop={`${props.crop.x},${props.crop.y}`}
    >
      <button
        type="button"
        onClick={() => props.onMediaLoaded({ naturalWidth: 400, naturalHeight: 200 })}
      >
        load
      </button>
      <button type="button" onClick={() => props.onCropChange({ x: 5, y: -3 })}>
        pan
      </button>
      <button type="button" onClick={() => props.onZoomChange(2)}>
        pinch
      </button>
      <button
        type="button"
        onClick={() =>
          props.onCropComplete(
            { x: 0, y: 0, width: 50, height: 50 },
            { x: 1, y: 2, width: 30, height: 40 },
          )
        }
      >
        settle
      </button>
    </div>
  ),
}));

const cropper = () => screen.getByTestId('cropper');

describe('ImageCropper', () => {
  it('keeps the image own shape until it loads, then uses its natural ratio', async () => {
    render(<ImageCropper src="data:image/png;base64,x" onCropChange={vi.fn()} />);

    expect(cropper()).toHaveAttribute('data-image', 'data:image/png;base64,x');
    expect(cropper()).toHaveAttribute('data-aspect', 'undefined');
    await userEvent.click(screen.getByRole('button', { name: 'load' }));
    expect(cropper()).toHaveAttribute('data-aspect', '2');
  });

  it('switches to a picked ratio and ignores a click that would unselect it', async () => {
    render(<ImageCropper src="a.png" onCropChange={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: '16:9' }));
    expect(cropper()).toHaveAttribute('data-aspect', String(16 / 9));
    expect(screen.getByRole('button', { name: '16:9' })).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(screen.getByRole('button', { name: '16:9' }));
    expect(screen.getByRole('button', { name: '16:9' })).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(screen.getByRole('button', { name: '1:1' }));
    expect(cropper()).toHaveAttribute('data-aspect', '1');
  });

  it('reports the crop in source pixels', async () => {
    const onCropChange = vi.fn();
    render(<ImageCropper src="a.png" onCropChange={onCropChange} />);

    await userEvent.click(screen.getByRole('button', { name: 'settle' }));

    expect(onCropChange).toHaveBeenCalledWith({ x: 1, y: 2, width: 30, height: 40 });
  });

  it('follows panning and zooming on the canvas and from the slider', async () => {
    render(<ImageCropper src="a.png" onCropChange={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'pan' }));
    expect(cropper()).toHaveAttribute('data-crop', '5,-3');

    await userEvent.click(screen.getByRole('button', { name: 'pinch' }));
    expect(cropper()).toHaveAttribute('data-zoom', '2');
    expect(screen.getByRole('slider', { name: 'Zoom' })).toHaveValue('2');

    fireEvent.change(screen.getByRole('slider', { name: 'Zoom' }), { target: { value: '1.5' } });
    expect(cropper()).toHaveAttribute('data-zoom', '1.5');
  });
});
