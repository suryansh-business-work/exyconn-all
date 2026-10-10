import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCanvasRenderer } from '../../tools/logo-set/hooks/useCanvasRenderer';
import { DEFAULT_SETTINGS, LogoSettings } from '../../tools/logo-set/types';
import { mockCanvasContext } from '../canvasMock';
import { installFakeImage } from '../helpers/imageMock';

type Ctx = Record<string, ReturnType<typeof vi.fn>> & Record<string, unknown>;

let ctx: Ctx;

const makeCtx = (): Ctx =>
  ({
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    clip: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    drawImage: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    closePath: vi.fn(),
    fillStyle: '',
    filter: 'none',
    shadowColor: '',
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
  }) as unknown as Ctx;

const settings = (patch: Partial<LogoSettings> = {}): LogoSettings => ({ ...DEFAULT_SETTINGS, ...patch });

const freshCtx = () => {
  ctx = makeCtx();
  mockCanvasContext(() => ctx);
};

beforeEach(freshCtx);

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('renderCanvas', () => {
  it('does nothing when the canvas has no 2d context', () => {
    mockCanvasContext(() => null);
    const Fake = installFakeImage();
    const { result } = renderHook(() => useCanvasRenderer());
    result.current.renderCanvas(document.createElement('canvas'), {
      image: 'a',
      width: 64,
      height: 64,
      settings: settings(),
    });
    expect(Fake.instances).toHaveLength(0);
  });

  it('sizes the canvas and, once the image loads, paints a checkerboard for transparency and fits the image', () => {
    const Fake = installFakeImage({ width: 200, height: 100 });
    const { result } = renderHook(() => useCanvasRenderer());
    const canvas = document.createElement('canvas');
    result.current.renderCanvas(canvas, {
      image: 'data:logo',
      width: 512,
      height: 512,
      settings: settings({ padding: 0, scale: 1, x: 10, y: -20, rotation: 90 }),
    });
    expect(canvas.width).toBe(512);
    expect(canvas.height).toBe(512);
    expect(Fake.instances[0].src).toBe('data:logo');

    Fake.instances[0].onload?.();
    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 512, 512);
    expect(ctx.fillRect.mock.calls[0]).toEqual([0, 0, 512, 512]);
    expect(ctx.fillRect.mock.calls.length).toBeGreaterThan(2);
    expect(ctx.translate).toHaveBeenCalledWith(256 + 10, 256 - 20);
    expect(ctx.rotate).toHaveBeenCalledWith(Math.PI / 2);
    expect(ctx.drawImage).toHaveBeenCalledWith(expect.anything(), -256, -128, 512, 256);
    expect(ctx.restore).toHaveBeenCalled();
  });

  it('fits tall images by height, honours padding and scale, and fills a solid background', () => {
    const Fake = installFakeImage({ width: 50, height: 100 });
    const { result } = renderHook(() => useCanvasRenderer());
    result.current.renderCanvas(document.createElement('canvas'), {
      image: 'tall',
      width: 100,
      height: 100,
      settings: settings({ transparent: false, backgroundColor: '#123456', padding: 20, scale: 0.5 }),
    });
    Fake.instances[0].onload?.();
    expect(ctx.fillStyle).toBe('#123456');
    expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 100, 100);
    expect(ctx.drawImage).toHaveBeenCalledWith(expect.anything(), -10, -20, 20, 40);
  });

  it('clips to a rounded rectangle when a border radius is set', () => {
    const Fake = installFakeImage();
    const { result } = renderHook(() => useCanvasRenderer());
    result.current.renderCanvas(document.createElement('canvas'), {
      image: 'a',
      width: 100,
      height: 100,
      settings: settings({ borderRadius: 20 }),
    });
    Fake.instances[0].onload?.();
    expect(ctx.moveTo).toHaveBeenCalledWith(20, 0);
    expect(ctx.quadraticCurveTo).toHaveBeenCalledTimes(4);
    expect(ctx.clip).toHaveBeenCalled();
  });

  it('applies brightness, contrast and grayscale filters, and box shadow only for icons', () => {
    const Fake = installFakeImage();
    const { result } = renderHook(() => useCanvasRenderer());
    const s = settings({ brightness: 120, contrast: 80, grayscale: 50, boxShadow: 10 });
    result.current.renderCanvas(document.createElement('canvas'), {
      image: 'a',
      width: 200,
      height: 200,
      settings: s,
      category: 'icon',
    });
    Fake.instances[0].onload?.();
    expect(ctx.filter).toBe('brightness(120%) contrast(80%) grayscale(50%)');
    expect(ctx.shadowColor).toBe('rgba(0, 0, 0, 0.3)');
    expect(ctx.shadowBlur).toBe(20);
    expect(ctx.shadowOffsetX).toBeCloseTo(4);
    expect(ctx.shadowOffsetY).toBeCloseTo(6);

    freshCtx();
    result.current.renderCanvas(document.createElement('canvas'), {
      image: 'a',
      width: 200,
      height: 200,
      settings: s,
      category: 'logo',
    });
    Fake.instances[1].onload?.();
    expect(ctx.shadowBlur).toBe(0);
  });

  it('leaves the filter untouched when nothing is adjusted', () => {
    const Fake = installFakeImage();
    const { result } = renderHook(() => useCanvasRenderer());
    result.current.renderCanvas(document.createElement('canvas'), {
      image: 'a',
      width: 64,
      height: 64,
      settings: settings(),
    });
    Fake.instances[0].onload?.();
    expect(ctx.filter).toBe('none');
  });

  it('draws an already-cropped image stretched to the box, with settings applied', () => {
    const Fake = installFakeImage({ width: 30, height: 10 });
    const { result } = renderHook(() => useCanvasRenderer());
    result.current.renderCanvas(document.createElement('canvas'), {
      image: 'crop',
      width: 100,
      height: 60,
      isCropped: true,
      category: 'icon',
      settings: settings({ padding: 0, scale: 0.5, rotation: 180, boxShadow: 5 }),
    });
    Fake.instances[0].onload?.();
    expect(ctx.drawImage).toHaveBeenCalledWith(expect.anything(), -25, -15, 50, 30);
    expect(ctx.rotate).toHaveBeenCalledWith(Math.PI);
    expect(ctx.shadowBlur).toBe(5);
  });

  it('draws a cropped image without a shadow when it is not an icon', () => {
    const Fake = installFakeImage();
    const { result } = renderHook(() => useCanvasRenderer());
    result.current.renderCanvas(document.createElement('canvas'), {
      image: 'crop',
      width: 100,
      height: 100,
      isCropped: true,
      category: 'logo',
      settings: settings({ boxShadow: 5, transparent: false }),
    });
    Fake.instances[0].onload?.();
    expect(ctx.shadowBlur).toBe(0);
    expect(ctx.drawImage).toHaveBeenCalledTimes(1);
  });
});

describe('renderToCanvas', () => {
  it('returns an empty canvas when there is no context', () => {
    mockCanvasContext(() => null);
    const Fake = installFakeImage();
    const { result } = renderHook(() => useCanvasRenderer());
    const canvas = result.current.renderToCanvas('a', 40, 30, settings(), 'png');
    expect([canvas.width, canvas.height]).toEqual([40, 30]);
    expect(Fake.instances).toHaveLength(0);
  });

  it('keeps a PNG transparent and draws immediately when the image is already decoded', () => {
    installFakeImage({ complete: true, width: 100, height: 100 });
    const { result } = renderHook(() => useCanvasRenderer());
    result.current.renderToCanvas('a', 64, 64, settings({ padding: 0 }), 'png');
    expect(ctx.clearRect).toHaveBeenCalledTimes(2);
    expect(ctx.fillRect).not.toHaveBeenCalled();
    expect(ctx.drawImage).toHaveBeenCalledWith(expect.anything(), -32, -32, 64, 64);
  });

  it('fills the background for a JPG even when transparency is on, and clips rounded corners', () => {
    installFakeImage({ complete: true });
    const { result } = renderHook(() => useCanvasRenderer());
    result.current.renderToCanvas(
      'a',
      64,
      64,
      settings({ backgroundColor: '#ff0000', borderRadius: 50, transparent: true }),
      'jpg'
    );
    expect(ctx.clip).toHaveBeenCalled();
    expect(ctx.fillStyle).toBe('#ff0000');
    expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 64, 64);
  });

  it('draws once the image loads when it was not decoded yet, in the plain and cropped modes', () => {
    const Fake = installFakeImage({ complete: false, width: 40, height: 80 });
    const { result } = renderHook(() => useCanvasRenderer());

    result.current.renderToCanvas('a', 100, 100, settings({ padding: 0, brightness: 150 }), 'png');
    expect(ctx.drawImage).not.toHaveBeenCalled();
    Fake.instances[0].onload?.();
    expect(ctx.drawImage).toHaveBeenCalledWith(expect.anything(), -25, -50, 50, 100);
    expect(ctx.filter).toBe('brightness(150%)');

    freshCtx();
    result.current.renderToCanvas('b', 100, 100, settings({ padding: 10, scale: 1 }), 'png', true, 'icon');
    Fake.instances[1].onload?.();
    expect(ctx.drawImage).toHaveBeenCalledWith(expect.anything(), -45, -45, 90, 90);
  });

  it('applies filters and the icon shadow in both draw modes, and a cropped image honours them too', () => {
    installFakeImage({ complete: true });
    const { result } = renderHook(() => useCanvasRenderer());
    const s = settings({ contrast: 90, grayscale: 10, boxShadow: 10 });

    result.current.renderToCanvas('a', 100, 100, s, 'png', false, 'icon');
    expect(ctx.filter).toBe('contrast(90%) grayscale(10%)');
    expect(ctx.shadowBlur).toBe(10);

    freshCtx();
    result.current.renderToCanvas('a', 100, 100, s, 'png', true, 'icon');
    expect(ctx.filter).toBe('contrast(90%) grayscale(10%)');
    expect(ctx.shadowBlur).toBe(10);

    freshCtx();
    result.current.renderToCanvas('a', 100, 100, s, 'png', true, 'logo');
    expect(ctx.shadowBlur).toBe(0);

    freshCtx();
    result.current.renderToCanvas('a', 100, 100, settings(), 'png', true, 'icon');
    expect(ctx.filter).toBe('none');
  });

  it('draws a plain image without a shadow for non-icons and with no filters', () => {
    installFakeImage({ complete: true });
    const { result } = renderHook(() => useCanvasRenderer());
    result.current.renderToCanvas('a', 100, 100, settings({ boxShadow: 10 }), 'png', false, 'logo');
    expect(ctx.shadowBlur).toBe(0);
    expect(ctx.filter).toBe('none');
  });
});

describe('settings saved by an older version', () => {
  const legacy = (patch: Partial<LogoSettings> = {}) => {
    const { brightness, contrast, grayscale, ...rest } = settings(patch);
    expect([brightness, contrast, grayscale]).toEqual([100, 100, 0]);
    return rest as LogoSettings;
  };

  it('draws without any filter when brightness, contrast and grayscale are missing', () => {
    installFakeImage({ complete: true });
    const { result } = renderHook(() => useCanvasRenderer());
    result.current.renderToCanvas('a', 100, 100, legacy(), 'png', false, 'logo');
    expect(ctx.filter).toBe('none');
    expect(ctx.drawImage).toHaveBeenCalledTimes(1);

    freshCtx();
    result.current.renderToCanvas('a', 100, 100, legacy(), 'png', true, 'logo');
    expect(ctx.filter).toBe('none');
    expect(ctx.drawImage).toHaveBeenCalledTimes(1);
  });

  it('applies brightness to a cropped image', () => {
    installFakeImage({ complete: true });
    const { result } = renderHook(() => useCanvasRenderer());
    result.current.renderToCanvas('a', 100, 100, settings({ brightness: 130 }), 'png', true, 'logo');
    expect(ctx.filter).toBe('brightness(130%)');
  });
});

describe('downloadCanvas', () => {
  it('downloads with the right mime type, file name and a single click', () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    const canvas = document.createElement('canvas');
    const toDataURL = vi.spyOn(canvas, 'toDataURL').mockReturnValue('data:image/jpeg;base64,AAA');
    const anchors: HTMLAnchorElement[] = [];
    const create = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation(((tag: string) => {
      const el = create(tag);
      if (tag === 'a') anchors.push(el as HTMLAnchorElement);
      return el;
    }) as typeof document.createElement);
    const { result } = renderHook(() => useCanvasRenderer());
    result.current.downloadCanvas(canvas, 'logo-64x64', 'jpg');
    expect(toDataURL).toHaveBeenCalledWith('image/jpeg', 0.95);
    expect(anchors[0].download).toBe('logo-64x64.jpg');
    expect(anchors[0].href).toContain('data:image/jpeg');
    expect(click).toHaveBeenCalledTimes(1);

    result.current.downloadCanvas(canvas, 'x', 'webp');
    expect(toDataURL).toHaveBeenLastCalledWith('image/webp', 0.95);
  });
});
