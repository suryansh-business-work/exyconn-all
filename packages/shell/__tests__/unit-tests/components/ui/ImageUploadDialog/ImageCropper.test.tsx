import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImageCropper } from '@/components/ui/ImageUploadDialog/ImageCropper';

interface CropperStubProps {
  image: string;
  aspect?: number;
  zoom: number;
  minZoom: number;
  restrictPosition: boolean;
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
      data-min-zoom={String(props.minZoom)}
      data-restrict={String(props.restrictPosition)}
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

/** The "Auto" colour the edge sampler reports; sampling itself is covered in its own spec. */
const edge: { color: string | null } = { color: null };
vi.mock('@/components/ui/ImageUploadDialog/edge-color', () => ({
  useEdgeColor: () => edge.color,
}));

const cropper = () => screen.getByTestId('cropper');
const stage = () => screen.getByTestId('crop-stage');
const button = (name: string) => screen.getByRole('button', { name });
const zoomSlider = () => screen.getByRole('slider', { name: 'Zoom' });
const click = (name: string) => userEvent.click(button(name));

beforeEach(() => {
  edge.color = null;
});

describe('ImageCropper', () => {
  it('keeps the image own shape until it loads, then uses its natural ratio', async () => {
    render(<ImageCropper src="data:image/png;base64,x" onCropChange={vi.fn()} />);

    expect(cropper()).toHaveAttribute('data-image', 'data:image/png;base64,x');
    expect(cropper()).toHaveAttribute('data-aspect', 'undefined');
    await click('load');
    expect(cropper()).toHaveAttribute('data-aspect', '2');
    expect(cropper()).toHaveAttribute('data-zoom', '1');
  });

  it('switches to a picked ratio and ignores a click that would unselect it', async () => {
    render(<ImageCropper src="a.png" onCropChange={vi.fn()} />);

    await click('16:9');
    expect(cropper()).toHaveAttribute('data-aspect', String(16 / 9));
    expect(button('16:9')).toHaveAttribute('aria-pressed', 'true');

    await click('16:9');
    expect(button('16:9')).toHaveAttribute('aria-pressed', 'true');

    await click('Original');
    await click('1:1');
    expect(cropper()).toHaveAttribute('data-aspect', '1');
  });

  it('reports the crop in source pixels with the background around it', async () => {
    const onCropChange = vi.fn();
    render(<ImageCropper src="a.png" onCropChange={onCropChange} />);
    expect(onCropChange).not.toHaveBeenCalled();

    await click('settle');
    expect(onCropChange).toHaveBeenLastCalledWith({
      x: 1,
      y: 2,
      width: 30,
      height: 40,
      fill: { kind: 'blur' },
    });

    // A new background is reported for the same framing straight away.
    await click('Transparent');
    expect(onCropChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ x: 1, fill: { kind: 'none' } }),
    );
  });

  it('follows panning and zooming on the canvas and from the slider', async () => {
    render(<ImageCropper src="a.png" onCropChange={vi.fn()} />);

    await click('pan');
    expect(cropper()).toHaveAttribute('data-crop', '5,-3');

    await click('pinch');
    expect(cropper()).toHaveAttribute('data-zoom', '2');
    expect(zoomSlider()).toHaveValue('2');
    expect(zoomSlider()).toHaveAttribute('aria-valuetext', '200%');
    // A hand-picked zoom is neither Fit nor Fill any more.
    expect(button('Fill')).toHaveAttribute('aria-pressed', 'false');

    fireEvent.change(zoomSlider(), { target: { value: '1.5' } });
    expect(cropper()).toHaveAttribute('data-zoom', '1.5');
    expect(zoomSlider()).toHaveAttribute('aria-valuetext', '150%');
    expect(screen.getAllByText('150%').length).toBeGreaterThan(0);
  });

  it('zooms out below 100%, letting the image move freely inside the frame', async () => {
    render(<ImageCropper src="a.png" onCropChange={vi.fn()} />);
    expect(cropper()).toHaveAttribute('data-restrict', 'true');
    expect(cropper()).toHaveAttribute('data-min-zoom', '0.2');

    await click('Zoom out');
    expect(cropper()).toHaveAttribute('data-zoom', '0.9');
    expect(cropper()).toHaveAttribute('data-restrict', 'false');

    await click('Zoom in');
    expect(Number(cropper().dataset.zoom)).toBeCloseTo(1);

    fireEvent.change(zoomSlider(), { target: { value: '0.2' } });
    expect(button('Zoom out')).toBeDisabled();
    fireEvent.change(zoomSlider(), { target: { value: '3' } });
    expect(button('Zoom in')).toBeDisabled();
  });

  it('fits the whole image in the frame or fills it, and keeps fitting across ratios', async () => {
    render(<ImageCropper src="a.png" onCropChange={vi.fn()} />);
    expect(button('Fill')).toHaveAttribute('aria-pressed', 'true');

    // Before the image has loaded there is nothing to fit yet.
    await click('Fit');
    expect(cropper()).toHaveAttribute('data-zoom', '1');

    await click('load');
    // Original shape: the frame is the image's own, so Fit only leaves the margin.
    expect(Number(cropper().dataset.zoom)).toBeCloseTo(0.9);

    await click('pan');
    await click('1:1');
    // A 2:1 image in a square frame: half the width, less the margin, back in the centre.
    expect(Number(cropper().dataset.zoom)).toBeCloseTo(0.45);
    expect(cropper()).toHaveAttribute('data-crop', '0,0');

    await click('Fill');
    expect(cropper()).toHaveAttribute('data-zoom', '1');

    await click('pinch');
    await click('16:9');
    expect(cropper()).toHaveAttribute('data-zoom', '2');
  });

  it('starts from the caller options: a square, fitted logo on its edge colour', async () => {
    edge.color = '#fefefe';
    const onCropChange = vi.fn();
    render(
      <ImageCropper
        src="logo.png"
        onCropChange={onCropChange}
        options={{ aspect: 'square', fit: 'fit', background: 'auto', allowTransparent: false }}
      />,
    );

    expect(cropper()).toHaveAttribute('data-aspect', '1');
    expect(button('Auto')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByRole('button', { name: 'Transparent' })).not.toBeInTheDocument();
    expect(stage()).toHaveAttribute('data-fill', 'color');

    await click('load');
    expect(Number(cropper().dataset.zoom)).toBeCloseTo(0.45);
    await click('settle');
    expect(onCropChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ fill: { kind: 'color', color: '#fefefe' } }),
    );
  });

  it('previews each background on the stage and reports it', async () => {
    const onCropChange = vi.fn();
    const { container } = render(<ImageCropper src="a.png" onCropChange={onCropChange} />);
    await click('settle');

    expect(stage()).toHaveAttribute('data-fill', 'blur');
    expect(container.querySelector('img[aria-hidden="true"]')).toHaveAttribute('src', 'a.png');

    await click('Colour');
    await click('Black');
    expect(stage()).toHaveAttribute('data-fill', 'color');
    expect(onCropChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ fill: { kind: 'color', color: '#000000' } }),
    );

    await click('Transparent');
    expect(stage()).toHaveAttribute('data-fill', 'none');
    expect(container.querySelector('img[aria-hidden="true"]')).toBeNull();
    expect(screen.queryByRole('textbox', { name: /^Hex colour\s*\*?$/ })).not.toBeInTheDocument();

    // Clicking the chosen background again keeps it.
    await click('Transparent');
    expect(button('Transparent')).toHaveAttribute('aria-pressed', 'true');
  });
});
