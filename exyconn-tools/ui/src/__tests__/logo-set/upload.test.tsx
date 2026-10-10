import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import ImageUpload from '../../tools/logo-set/components/ImageUpload/ImageUpload';
import BackgroundRemovalDialog from '../../tools/logo-set/components/BackgroundRemovalDialog/BackgroundRemovalDialog';
import { useColorExtraction } from '../../tools/logo-set/components/GlobalSettings/useColorExtraction';
import { readSecret } from '../../shared/services/secrets';
import { mockCanvasContext } from '../canvasMock';
import { installFakeImage } from '../helpers/imageMock';
import { jsonReply, stubFetch } from '../helpers/toolHarness';

beforeEach(() => localStorage.clear());

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

const pngFile = (name = 'logo.png') => new File([new Uint8Array([137, 80, 78, 71])], name, { type: 'image/png' });

describe('ImageUpload', () => {
  const setup = (currentImage: string | null = null) => {
    const onImageUpload = vi.fn();
    const onDelete = vi.fn();
    const view = render(<ImageUpload onImageUpload={onImageUpload} onDelete={onDelete} currentImage={currentImage} />);
    return { onImageUpload, onDelete, ...view };
  };

  it('reads a chosen image file as a data URL', async () => {
    const { onImageUpload, container } = setup();
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [pngFile()] } });
    await waitFor(() => expect(onImageUpload).toHaveBeenCalledTimes(1));
    expect(onImageUpload.mock.calls[0][0]).toMatch(/^data:image\/png;base64,/);
  });

  it('ignores non-image files and an empty selection', () => {
    const { onImageUpload, container } = setup();
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(['x'], 'notes.txt', { type: 'text/plain' })] } });
    fireEvent.change(input, { target: { files: [] } });
    expect(onImageUpload).not.toHaveBeenCalled();
  });

  it('ignores a read that produces no string result', () => {
    class EmptyReader {
      onload: ((e: { target: { result: unknown } }) => void) | null = null;

      readAsDataURL() {
        this.onload?.({ target: { result: null } });
      }
    }
    vi.stubGlobal('FileReader', EmptyReader);
    const { onImageUpload, container } = setup();
    fireEvent.change(container.querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [pngFile()] },
    });
    expect(onImageUpload).not.toHaveBeenCalled();
  });

  it('opens the file picker when the drop zone is clicked', () => {
    const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => undefined);
    setup();
    fireEvent.click(screen.getByText('Drag & drop or click'));
    expect(click).toHaveBeenCalledTimes(1);
  });

  it('accepts a dropped image and ignores a drop without files', async () => {
    const { onImageUpload } = setup();
    const zone = screen.getByText('Drag & drop or click').parentElement?.parentElement as HTMLElement;
    fireEvent.dragOver(zone);
    fireEvent.dragLeave(zone);
    fireEvent.dragOver(zone);
    fireEvent.drop(zone, { dataTransfer: { files: [pngFile('dropped.png')] } });
    await waitFor(() => expect(onImageUpload).toHaveBeenCalledTimes(1));

    fireEvent.drop(zone, { dataTransfer: { files: [] } });
    await act(async () => undefined);
    expect(onImageUpload).toHaveBeenCalledTimes(1);
  });

  it('shows the current image with replace hint and deletes it', () => {
    const { onDelete } = setup('data:image/png;base64,AAA');
    expect(screen.getByAltText('Logo')).toHaveAttribute('src', 'data:image/png;base64,AAA');
    expect(screen.getByText('Click or drag to replace')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Delete image' }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('offers no editing buttons without an image', () => {
    setup();
    expect(screen.queryByRole('button', { name: 'Erase parts' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remove Background (AI)' })).not.toBeInTheDocument();
  });

  it('applies an erase edit as the new image and closes the editor', async () => {
    const Fake = installFakeImage({ width: 100, height: 100 });
    const { onImageUpload } = setup('data:image/png;base64,AAA');
    fireEvent.click(screen.getByRole('button', { name: 'Erase parts' }));
    expect(await screen.findByText('Erase Tool')).toBeInTheDocument();
    await act(async () => {
      Fake.instances.at(-1)?.onload?.();
    });
    fireEvent.click(screen.getByRole('button', { name: /Apply Changes/ }));
    expect(onImageUpload).toHaveBeenCalledWith(expect.stringMatching(/^data:image\/png/));
    await waitFor(() => expect(screen.queryByText('Erase Tool')).not.toBeInTheDocument());
  });

  it('closes the editor with cancel, and renders nothing in it once the image is gone', async () => {
    installFakeImage();
    const { rerender, onImageUpload, onDelete } = setup('data:image/png;base64,AAA');
    fireEvent.click(screen.getByRole('button', { name: 'Erase parts' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByText('Erase Tool')).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Erase parts' }));
    await screen.findByText('Erase Tool');
    rerender(<ImageUpload onImageUpload={onImageUpload} onDelete={onDelete} currentImage={null} />);
    await waitFor(() => expect(screen.queryByText('Erase Tool')).not.toBeInTheDocument());
  });

  it('closes the editor with Escape', async () => {
    installFakeImage();
    setup('data:image/png;base64,AAA');
    fireEvent.click(screen.getByRole('button', { name: 'Erase parts' }));
    const title = await screen.findByText('Erase Tool');
    fireEvent.keyDown(title, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByText('Erase Tool')).not.toBeInTheDocument());
  });

  it('opens the background removal dialog and passes the processed image on', async () => {
    const fetchMock = stubFetch(jsonReply({ success: true, image: 'data:processed' }));
    const { onImageUpload } = setup('data:image/png;base64,AAA');
    fireEvent.click(screen.getByRole('button', { name: 'Remove Background (AI)' }));
    expect(await screen.findByText(/Choose a background removal service/)).toBeInTheDocument();
    fireEvent.click(screen.getByText('IMG.LY (Local)'));
    fireEvent.click(screen.getByRole('button', { name: /Remove Background$/ }));
    await waitFor(() => expect(onImageUpload).toHaveBeenCalledWith('data:processed'));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByText(/Choose a background removal service/)).not.toBeInTheDocument());
  });
});

describe('BackgroundRemovalDialog', () => {
  const API = 'http://localhost:4002/api/tools/logo-set';

  const setup = (currentImage = 'data:image/png;base64,SRC') => {
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    render(<BackgroundRemovalDialog open onClose={onClose} currentImage={currentImage} onSuccess={onSuccess} />);
    return { onClose, onSuccess };
  };

  const run = () => fireEvent.click(screen.getByRole('button', { name: /Remove Background$/ }));

  it('needs an API key for Remove.bg, stores it, and sends it with the image', async () => {
    const fetchMock = stubFetch(jsonReply({ success: true, image: 'data:done' }));
    const { onSuccess, onClose } = setup();
    expect(screen.getByRole('button', { name: /Remove Background$/ })).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Remove.bg API Key'), { target: { value: ' key-123 ' } });
    expect(readSecret('removebg_api_key')).toBe(' key-123 ');
    run();
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith('data:done'));
    expect(onClose).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API}/remove-background-removebg`);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ image: 'data:image/png;base64,SRC', apiKey: ' key-123 ' });
  });

  it('starts with a key saved earlier', () => {
    localStorage.setItem('removebg_api_key', 'saved-key');
    setup();
    expect(screen.getByLabelText('Remove.bg API Key')).toHaveValue('saved-key');
    expect(screen.getByRole('button', { name: /Remove Background$/ })).toBeEnabled();
  });

  it('uses the local IMG.LY endpoint without a key', async () => {
    const fetchMock = stubFetch(jsonReply({ success: true, image: 'data:local' }));
    const { onSuccess } = setup();
    fireEvent.click(screen.getByText('IMG.LY (Local)'));
    expect(screen.queryByLabelText('Remove.bg API Key')).not.toBeInTheDocument();
    run();
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith('data:local'));
    expect(fetchMock.mock.calls[0][0]).toBe(`${API}/remove-background-base64`);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ image: 'data:image/png;base64,SRC' });
  });

  it('switches provider through the radio group and clears an earlier error', async () => {
    stubFetch(jsonReply({ error: 'bad key' }, { ok: false, status: 403 }));
    localStorage.setItem('removebg_api_key', 'k');
    setup();
    run();
    expect(await screen.findByText('bad key')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: /IMG\.LY/ }));
    expect(screen.queryByText('bad key')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: /Remove\.bg/ }));
    expect(screen.getByLabelText('Remove.bg API Key')).toBeInTheDocument();
  });

  it('shows the server message, preferring message over error', async () => {
    localStorage.setItem('removebg_api_key', 'k');
    stubFetch(jsonReply({ message: 'Quota used up', error: 'other' }, { ok: false, status: 402 }));
    setup();
    run();
    expect(await screen.findByText('Quota used up')).toBeInTheDocument();
  });

  it('falls back to the status code when the error body has no message', async () => {
    localStorage.setItem('removebg_api_key', 'k');
    stubFetch(jsonReply({}, { ok: false, status: 500 }));
    setup();
    run();
    expect(await screen.findByText('Server error: 500')).toBeInTheDocument();
  });

  it('falls back to the status text when the error body is not JSON', async () => {
    localStorage.setItem('removebg_api_key', 'k');
    stubFetch({
      ok: false,
      status: 502,
      statusText: 'Bad Gateway',
      json: async () => {
        throw new SyntaxError('no json');
      },
    });
    setup();
    run();
    expect(await screen.findByText('Bad Gateway')).toBeInTheDocument();
  });

  it('falls back to the status code when there is neither a body nor a status text', async () => {
    localStorage.setItem('removebg_api_key', 'k');
    stubFetch({
      ok: false,
      status: 504,
      statusText: '',
      json: async () => {
        throw new SyntaxError('no json');
      },
    });
    setup();
    run();
    expect(await screen.findByText('Server error: 504')).toBeInTheDocument();
  });

  it('reports an unsuccessful result with its error, or a default message', async () => {
    localStorage.setItem('removebg_api_key', 'k');
    stubFetch(jsonReply({ success: false, error: 'No subject found' }), jsonReply({ success: true }));
    const { onSuccess } = setup();
    run();
    expect(await screen.findByText('No subject found')).toBeInTheDocument();
    run();
    await waitFor(() => expect(screen.getAllByText('Failed to remove background').length).toBeGreaterThan(0));
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('reports a network failure, and a non-Error rejection with the default message', async () => {
    localStorage.setItem('removebg_api_key', 'k');
    const fetchMock = stubFetch();
    fetchMock.mockRejectedValueOnce(new Error('offline')).mockRejectedValueOnce('boom');
    setup();
    run();
    expect(await screen.findByText('offline')).toBeInTheDocument();
    run();
    expect(await screen.findByText('Failed to remove background')).toBeInTheDocument();
  });

  it('shows progress and blocks cancel while the request is running', async () => {
    localStorage.setItem('removebg_api_key', 'k');
    let release: (value: unknown) => void = () => undefined;
    const fetchMock = stubFetch();
    fetchMock.mockReturnValueOnce(new Promise((resolve) => (release = resolve)));
    setup();
    run();
    expect(await screen.findByRole('button', { name: /Processing/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    release(jsonReply({ success: true, image: 'x' }));
    await waitFor(() => expect(screen.queryByRole('button', { name: /Processing/ })).not.toBeInTheDocument());
  });

  it('sends nothing when there is no image', () => {
    localStorage.setItem('removebg_api_key', 'k');
    const fetchMock = stubFetch();
    setup('');
    run();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('cancels', () => {
    const { onClose } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls the configured API host outside local development', async () => {
    vi.resetModules();
    vi.stubEnv('DEV', false);
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.test');
    const rtl = await import('@testing-library/react');
    const { default: Dialog } =
      await import('../../tools/logo-set/components/BackgroundRemovalDialog/BackgroundRemovalDialog');
    const fetchMock = vi.fn().mockResolvedValue(jsonReply({ success: true, image: 'x' }));
    vi.stubGlobal('fetch', fetchMock);
    localStorage.setItem('removebg_api_key', 'k');
    rtl.render(<Dialog open onClose={vi.fn()} currentImage="img" onSuccess={vi.fn()} />);
    rtl.fireEvent.click(rtl.screen.getByRole('button', { name: /Remove Background$/ }));
    await rtl.waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.example.test/api/tools/logo-set/remove-background-removebg');
  });

  it('calls the production API when no host is configured', async () => {
    vi.resetModules();
    vi.stubEnv('DEV', false);
    vi.stubEnv('VITE_API_BASE_URL', '');
    const rtl = await import('@testing-library/react');
    const { default: Dialog } =
      await import('../../tools/logo-set/components/BackgroundRemovalDialog/BackgroundRemovalDialog');
    const fetchMock = vi.fn().mockResolvedValue(jsonReply({ success: true, image: 'x' }));
    vi.stubGlobal('fetch', fetchMock);
    localStorage.setItem('removebg_api_key', 'k');
    rtl.render(<Dialog open onClose={vi.fn()} currentImage="img" onSuccess={vi.fn()} />);
    rtl.fireEvent.click(rtl.screen.getByRole('button', { name: /Remove Background$/ }));
    await rtl.waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://tools-api.exyconn.com/api/tools/logo-set/remove-background-removebg'
    );
  });
});

describe('useColorExtraction', () => {
  const SIZE = 150;

  /** An RGBA buffer of the sampled canvas: `pixels` first, then transparent filler. */
  const frame = (pixels: Array<[number, number, number, number]>) => {
    const data = new Uint8ClampedArray(SIZE * SIZE * 4);
    pixels.forEach(([r, g, b, a], index) => data.set([r, g, b, a], index * 4));
    return data;
  };

  const repeat = (colour: [number, number, number, number], times: number) =>
    Array.from({ length: times }, () => colour);

  const withFrame = (data: Uint8ClampedArray) => {
    mockCanvasContext(() => ({ drawImage: vi.fn(), getImageData: vi.fn(() => ({ data })) }));
  };

  it('returns the most common colours, merged when close, ignoring white, black and transparency', async () => {
    installFakeImage({ autoLoad: true });
    withFrame(
      frame([
        ...repeat([200, 30, 30, 255], 12),
        ...repeat([210, 35, 30, 255], 5),
        ...repeat([15, 200, 16, 255], 20),
        ...repeat([30, 30, 200, 255], 11),
        ...repeat([100, 100, 100, 255], 4),
        ...repeat([255, 255, 255, 255], 50),
        ...repeat([5, 5, 5, 255], 50),
        ...repeat([40, 40, 40, 100], 50),
      ])
    );
    const { result } = renderHook(() => useColorExtraction('data:logo'));
    await waitFor(() => expect(result.current.extractedColors.length).toBeGreaterThan(0));
    // Red absorbed its neighbour (17 px); green 20; blue 11; the 4-px grey is too rare.
    expect(result.current.extractedColors).toEqual(['#0fc810', '#cb1e1e', '#1e1ec8']);
    expect(result.current.isExtractingColors).toBe(false);
  });

  it('keeps at most eight colours, and stops opening new clusters after fifty', async () => {
    installFakeImage({ autoLoad: true });
    const distinct: Array<[number, number, number]> = [];
    for (let r = 0; r < 256 && distinct.length < 60; r += 70) {
      for (let g = 0; g < 256 && distinct.length < 60; g += 70) {
        for (let b = 0; b < 256 && distinct.length < 60; b += 70) {
          if (r + g + b > 60 && !(r > 240 && g > 240 && b > 240)) distinct.push([r, g, b]);
        }
      }
    }
    expect(distinct.length).toBeGreaterThan(50);
    const pixels = distinct.flatMap(([r, g, b], index) => repeat([r, g, b, 255], 11 + (index % 3)));
    withFrame(frame(pixels));
    const { result } = renderHook(() => useColorExtraction('data:many'));
    await waitFor(() => expect(result.current.extractedColors.length).toBe(8));
    result.current.extractedColors.forEach((hex) => expect(hex).toMatch(/^#[0-9a-f]{6}$/));
  });

  it('has no colours without an image, and clears them when the image goes away', async () => {
    installFakeImage({ autoLoad: true });
    withFrame(frame(repeat([200, 30, 30, 255], 20)));
    const { result, rerender } = renderHook(({ src }: { src?: string }) => useColorExtraction(src), {
      initialProps: { src: undefined as string | undefined },
    });
    expect(result.current.extractedColors).toEqual([]);
    rerender({ src: 'data:logo' });
    await waitFor(() => expect(result.current.extractedColors).toEqual(['#c81e1e']));
    rerender({ src: undefined });
    await waitFor(() => expect(result.current.extractedColors).toEqual([]));
  });

  it('finds nothing and stops loading when the canvas has no context', async () => {
    installFakeImage({ autoLoad: true });
    mockCanvasContext(() => null);
    const { result } = renderHook(() => useColorExtraction('data:logo'));
    await waitFor(() => expect(result.current.isExtractingColors).toBe(false));
    expect(result.current.extractedColors).toEqual([]);
  });

  it('logs and returns no colours when the image fails to load', async () => {
    installFakeImage({ failFor: () => true });
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { result } = renderHook(() => useColorExtraction('data:broken'));
    await waitFor(() => expect(error).toHaveBeenCalledWith('Error extracting colors:', expect.anything()));
    expect(result.current.extractedColors).toEqual([]);
    expect(result.current.isExtractingColors).toBe(false);
  });
});
