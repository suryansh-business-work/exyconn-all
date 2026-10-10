import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import CropTool from '../../tools/logo-set/components/CropTool/CropTool';
import EraseTool from '../../tools/logo-set/components/EraseTool/EraseTool';
import { mockCanvasContext } from '../canvasMock';
import { FakeImage, installFakeImage } from '../helpers/imageMock';

const cropper = vi.hoisted(() => ({ props: null as null | Record<string, any> }));

vi.mock('react-easy-crop', () => ({
  default: (props: Record<string, unknown>) => {
    cropper.props = props;
    return (
      <button
        type="button"
        onClick={() =>
          (props.onCropComplete as (a: unknown, b: unknown) => void)({}, { x: 1, y: 2, width: 30, height: 40 })
        }
      >
        finish-crop
      </button>
    );
  },
}));

type Fn = ReturnType<typeof vi.fn>;
interface Ctx {
  [key: string]: unknown;
  canvas: HTMLCanvasElement;
  translate: Fn;
  rotate: Fn;
  scale: Fn;
  drawImage: Fn;
  getImageData: Fn;
  putImageData: Fn;
  clearRect: Fn;
  beginPath: Fn;
  arc: Fn;
  rect: Fn;
  fill: Fn;
}

let ctx: Ctx;

function useCtx() {
  const contexts = new WeakMap<HTMLCanvasElement, Ctx>();
  mockCanvasContext(function (this: HTMLCanvasElement) {
    let existing = contexts.get(this);
    if (!existing) {
      existing = {
        canvas: this,
        globalCompositeOperation: 'source-over',
        imageSmoothingEnabled: false,
        imageSmoothingQuality: 'low',
        translate: vi.fn(),
        rotate: vi.fn(),
        scale: vi.fn(),
        drawImage: vi.fn(),
        getImageData: vi.fn(() => ({ tag: 'frame' })),
        putImageData: vi.fn(),
        clearRect: vi.fn(),
        beginPath: vi.fn(),
        arc: vi.fn(),
        rect: vi.fn(),
        fill: vi.fn(),
      };
      contexts.set(this, existing);
    }
    ctx = existing;
    return existing;
  });
}

beforeEach(() => {
  useCtx();
  cropper.props = null;
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('CropTool', () => {
  const setup = (onSave = vi.fn(), onClose = vi.fn()) => {
    installFakeImage({ autoLoad: true });
    render(<CropTool image="data:source" onSave={onSave} onClose={onClose} targetSize={{ width: 128, height: 64 }} />);
    return { onSave, onClose };
  };

  it('starts at the target aspect ratio and cannot apply until the cropper reports an area', () => {
    setup();
    expect(screen.getByText('Crop 128×64')).toBeInTheDocument();
    expect(cropper.props?.aspect).toBe(2);
    expect(screen.getByRole('button', { name: /Apply Crop/ })).toBeDisabled();
  });

  it('switches aspect ratios from the toggle group', () => {
    setup();
    const toggles = document.querySelectorAll('.MuiToggleButtonGroup-root button');
    const expected: Array<number | undefined> = [2, 1, 16 / 9, 4 / 3, undefined];
    expected.forEach((aspect, index) => {
      fireEvent.click(toggles[index]);
      expect(cropper.props?.aspect).toBe(aspect);
    });
  });

  it('rotates in 90 degree steps both ways and flips each axis', () => {
    setup();
    fireEvent.click(screen.getByLabelText('Rotate Left'));
    expect(cropper.props?.rotation).toBe(270);
    expect(screen.getByText('270°')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Rotate Right'));
    expect(cropper.props?.rotation).toBe(0);
    expect(screen.queryByText('0°')).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Rotate Right'));
    expect(cropper.props?.rotation).toBe(90);

    fireEvent.click(screen.getByLabelText('Flip Horizontal'));
    expect(cropper.props?.style.containerStyle.transform).toBe('scaleX(-1) scaleY(1)');
    fireEvent.click(screen.getByLabelText('Flip Vertical'));
    expect(cropper.props?.style.containerStyle.transform).toBe('scaleX(-1) scaleY(-1)');
    fireEvent.click(screen.getByLabelText('Flip Horizontal'));
    expect(cropper.props?.style.containerStyle.transform).toBe('scaleX(1) scaleY(-1)');
  });

  it('zooms with the slider and resets everything', () => {
    setup();
    fireEvent.change(screen.getByRole('slider'), { target: { value: 2.5 } });
    expect(cropper.props?.zoom).toBe(2.5);
    expect(screen.getByText('2.5x')).toBeInTheDocument();
    act(() => cropper.props?.onCropChange({ x: 5, y: 6 }));
    expect(cropper.props?.crop).toEqual({ x: 5, y: 6 });
    fireEvent.click(screen.getByLabelText('Rotate Right'));
    fireEvent.click(screen.getByLabelText('Flip Vertical'));

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(cropper.props?.zoom).toBe(1);
    expect(cropper.props?.crop).toEqual({ x: 0, y: 0 });
    expect(cropper.props?.rotation).toBe(0);
    expect(cropper.props?.style.containerStyle.transform).toBe('scaleX(1) scaleY(1)');
    act(() => cropper.props?.onZoomChange(1.5));
    expect(cropper.props?.zoom).toBe(1.5);
  });

  it('crops to the target size with rotation and flips applied, then hands the image over', async () => {
    const { onSave } = setup();
    fireEvent.click(screen.getByLabelText('Rotate Right'));
    fireEvent.click(screen.getByLabelText('Flip Horizontal'));
    fireEvent.click(screen.getByLabelText('Flip Vertical'));
    fireEvent.click(screen.getByText('finish-crop'));
    fireEvent.click(screen.getByRole('button', { name: /Apply Crop/ }));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));

    expect(onSave.mock.calls[0][0]).toMatch(/^data:image\/png;base64,/);
    expect(ctx.canvas.width).toBe(128);
    expect(ctx.canvas.height).toBe(64);
    expect(ctx.imageSmoothingEnabled).toBe(true);
    expect(ctx.imageSmoothingQuality).toBe('high');
    expect(ctx.translate.mock.calls).toEqual([
      [64, 32],
      [-64, -32],
    ]);
    expect(ctx.rotate).toHaveBeenCalledWith(Math.PI / 2);
    expect(ctx.scale).toHaveBeenCalledWith(-1, -1);
    expect(ctx.drawImage).toHaveBeenCalledWith(expect.any(FakeImage), 1, 2, 30, 40, 0, 0, 128, 64);
    expect(FakeImage.instances[0].crossOrigin).toBeNull();
  });

  it('shows progress while saving, and sets CORS for a remote source image', async () => {
    const Fake = installFakeImage();
    const onSave = vi.fn();
    render(
      <CropTool
        image="https://cdn.example/logo.png"
        onSave={onSave}
        onClose={vi.fn()}
        targetSize={{ width: 8, height: 8 }}
      />
    );
    fireEvent.click(screen.getByText('finish-crop'));
    fireEvent.click(screen.getByRole('button', { name: /Apply Crop/ }));
    expect(await screen.findByRole('button', { name: /Applying/ })).toBeDisabled();
    expect(Fake.instances[0].crossOrigin).toBe('anonymous');

    await act(async () => {
      Fake.instances[0].fire('load');
    });
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(await screen.findByRole('button', { name: /Apply Crop/ })).toBeEnabled();
  });

  it('logs and does not save when the source image cannot be loaded', async () => {
    installFakeImage({ failFor: () => true });
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const onSave = vi.fn();
    render(<CropTool image="data:bad" onSave={onSave} onClose={vi.fn()} targetSize={{ width: 8, height: 8 }} />);
    fireEvent.click(screen.getByText('finish-crop'));
    fireEvent.click(screen.getByRole('button', { name: /Apply Crop/ }));
    await waitFor(() => expect(error).toHaveBeenCalledWith('Error creating cropped image:', expect.any(Error)));
    expect(onSave).not.toHaveBeenCalled();
    await screen.findByRole('button', { name: /Apply Crop/ });
  });

  it('does not save when the canvas has no 2d context', async () => {
    installFakeImage({ autoLoad: true });
    mockCanvasContext(() => null);
    const onSave = vi.fn();
    render(<CropTool image="data:ok" onSave={onSave} onClose={vi.fn()} targetSize={{ width: 8, height: 8 }} />);
    fireEvent.click(screen.getByText('finish-crop'));
    fireEvent.click(screen.getByRole('button', { name: /Apply Crop/ }));
    await waitFor(() => expect(FakeImage.instances).toHaveLength(1));
    await screen.findByRole('button', { name: /Apply Crop/ });
    expect(onSave).not.toHaveBeenCalled();
  });

  it('cancels', () => {
    const { onClose } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('EraseTool', () => {
  const setup = async (onSave = vi.fn(), onClose = vi.fn()) => {
    const Fake = installFakeImage({ width: 1200, height: 600 });
    const view = render(<EraseTool image="data:source" onSave={onSave} onClose={onClose} />);
    const canvas = view.container.querySelector('canvas') as HTMLCanvasElement;
    await act(async () => {
      Fake.instances[0].onload?.();
    });
    return { onSave, onClose, canvas };
  };

  it('draws the image scaled to 600px wide and records it as the first history step', async () => {
    const { canvas } = await setup();
    expect(canvas.width).toBe(600);
    expect(canvas.height).toBe(300);
    expect(ctx.drawImage).toHaveBeenCalledWith(expect.any(FakeImage), 0, 0, 600, 300);
    expect(ctx.getImageData).toHaveBeenCalledWith(0, 0, 600, 300);
    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled();
  });

  it('keeps a small image at its own width', async () => {
    const Fake = installFakeImage({ width: 200, height: 100 });
    const { container } = render(<EraseTool image="data:small" onSave={vi.fn()} onClose={vi.fn()} />);
    await act(async () => {
      Fake.instances[0].onload?.();
    });
    const canvas = container.querySelector('canvas') as HTMLCanvasElement;
    expect([canvas.width, canvas.height]).toEqual([200, 100]);
  });

  it('erases with a round brush while the mouse is down, using the destination-out mode', async () => {
    const { canvas } = await setup();
    const modes: unknown[] = [];
    Object.defineProperty(ctx, 'globalCompositeOperation', {
      configurable: true,
      get: () => 'source-over',
      set: (value) => modes.push(value),
    });
    fireEvent.mouseMove(canvas, { clientX: 5, clientY: 5 });
    expect(ctx.arc).not.toHaveBeenCalled();

    fireEvent.mouseDown(canvas, { clientX: 40, clientY: 50 });
    expect(ctx.arc).toHaveBeenCalledWith(40, 50, 10, 0, Math.PI * 2);
    expect(ctx.fill).toHaveBeenCalled();
    expect(modes).toEqual(['destination-out', 'source-over']);

    fireEvent.mouseMove(canvas, { clientX: 60, clientY: 70 });
    expect(ctx.arc).toHaveBeenLastCalledWith(60, 70, 10, 0, Math.PI * 2);
  });

  it('erases with a square brush of the chosen size', async () => {
    const { canvas } = await setup();
    fireEvent.click(screen.getByRole('button', { name: '□' }));
    fireEvent.change(screen.getByRole('slider'), { target: { value: 40 } });
    expect(screen.getByText('40px')).toBeInTheDocument();
    fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
    expect(ctx.rect).toHaveBeenCalledWith(80, 80, 40, 40);
    expect(ctx.arc).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: '○' }));
    fireEvent.click(screen.getByRole('button', { name: '○' }));
    fireEvent.mouseMove(canvas, { clientX: 10, clientY: 10 });
    expect(ctx.arc).toHaveBeenCalledWith(10, 10, 20, 0, Math.PI * 2);
  });

  it('records a history step when a stroke ends and undoes back to the previous one', async () => {
    const { canvas } = await setup();
    fireEvent.mouseUp(canvas);
    expect(ctx.getImageData).toHaveBeenCalledTimes(1);

    fireEvent.mouseDown(canvas, { clientX: 1, clientY: 1 });
    fireEvent.mouseUp(canvas);
    expect(screen.getByRole('button', { name: 'Undo' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(ctx.putImageData).toHaveBeenCalledWith({ tag: 'frame' }, 0, 0);
    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled();
  });

  it('also ends the stroke when the mouse leaves the canvas', async () => {
    const { canvas } = await setup();
    fireEvent.mouseDown(canvas, { clientX: 1, clientY: 1 });
    fireEvent.mouseLeave(canvas);
    expect(screen.getByRole('button', { name: 'Undo' })).toBeEnabled();
  });

  it('clears the canvas and keeps that as an undoable step', async () => {
    await setup();
    fireEvent.click(screen.getByRole('button', { name: 'Clear All' }));
    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 600, 300);
    expect(screen.getByRole('button', { name: 'Undo' })).toBeEnabled();
  });

  it('applies the edited canvas as a PNG data URL, and cancels', async () => {
    const { onSave, onClose } = await setup();
    fireEvent.click(screen.getByRole('button', { name: /Apply Changes/ }));
    expect(onSave).toHaveBeenCalledWith(expect.stringMatching(/^data:image\/png;base64,/));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('does nothing when the canvas has no 2d context', async () => {
    mockCanvasContext(() => null);
    const Fake = installFakeImage({ width: 10, height: 10 });
    const onSave = vi.fn();
    const { container } = render(<EraseTool image="data:x" onSave={onSave} onClose={vi.fn()} />);
    const canvas = container.querySelector('canvas') as HTMLCanvasElement;
    expect(Fake.instances).toHaveLength(0);

    fireEvent.mouseDown(canvas, { clientX: 1, clientY: 1 });
    fireEvent.mouseUp(canvas);
    fireEvent.click(screen.getByRole('button', { name: 'Clear All' }));
    fireEvent.click(screen.getByRole('button', { name: /Apply Changes/ }));
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled();
  });

  it('ignores undo when the canvas context disappears after history exists', async () => {
    const { canvas } = await setup();
    fireEvent.mouseDown(canvas, { clientX: 1, clientY: 1 });
    fireEvent.mouseUp(canvas);
    mockCanvasContext(() => null);
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(ctx.putImageData).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Undo' })).toBeEnabled();
  });
});
