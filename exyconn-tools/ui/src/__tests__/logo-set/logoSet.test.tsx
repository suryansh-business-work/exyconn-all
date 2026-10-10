import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import LogoSet from '../../tools/logo-set';
import PreviewGrid from '../../tools/logo-set/components/PreviewGrid/PreviewGrid';
import CanvasCard from '../../tools/logo-set/components/CanvasCard/CanvasCard';
import { DEFAULT_SETTINGS, FAVICON_SIZES } from '../../tools/logo-set/types';
import { installFakeImage } from '../helpers/imageMock';

const cropper = vi.hoisted(() => ({ props: null as null | Record<string, any> }));

vi.mock('react-easy-crop', () => ({
  default: (props: Record<string, unknown>) => {
    cropper.props = props;
    return (
      <button
        type="button"
        onClick={() =>
          (props.onCropComplete as (a: unknown, b: unknown) => void)({}, { x: 0, y: 0, width: 10, height: 10 })
        }
      >
        finish-crop
      </button>
    );
  },
}));

vi.mock('../../shared/components/ToolLayout/ToolLayout', () => ({
  default: ({
    children,
    toolName,
    actions,
  }: {
    children?: React.ReactNode;
    toolName?: string;
    actions?: React.ReactNode;
  }) => (
    <div>
      <h1>{toolName}</h1>
      <div data-testid="actions">{actions}</div>
      {children}
    </div>
  ),
}));

/** Rendering 41 canvas cards is slow, especially under coverage on a busy runner. */
const HEAVY = 180_000;
const SLOW = { timeout: 90_000 };

const STATE_KEY = 'logo-set-state';
const IMG_A = 'data:image/png;base64,AAAA';
const IMG_B = 'data:image/png;base64,BBBB';

const saved = () => JSON.parse(localStorage.getItem(STATE_KEY) as string);
const preload = (state: Record<string, unknown>) => localStorage.setItem(STATE_KEY, JSON.stringify(state));

beforeEach(() => {
  localStorage.clear();
  installFakeImage({ complete: true, autoLoad: true });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const cardFor = (label: string, category: string) => {
  const chip = screen.getAllByText(category).find((node) => {
    const root = node.closest('.MuiPaper-root');
    return root?.textContent?.includes(label) ?? false;
  });
  return chip?.closest('.MuiPaper-root') as HTMLElement;
};

describe('LogoSet page', () => {
  it('starts empty, with only the upload card and the empty state', () => {
    render(<LogoSet />);
    expect(screen.getByRole('heading', { name: 'Logo Set' })).toBeInTheDocument();
    expect(screen.getByText('No Image Uploaded')).toBeInTheDocument();
    expect(screen.queryByText('Settings')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Download All/ })).not.toBeInTheDocument();
    expect(within(screen.getByTestId('actions')).queryByRole('button')).not.toBeInTheDocument();
  });

  it('keeps the page usable when the saved session is damaged', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    localStorage.setItem(STATE_KEY, '{oops');
    render(<LogoSet />);
    expect(screen.getByText('No Image Uploaded')).toBeInTheDocument();
  });

  it(
    'builds the gallery after an upload, steps through the image history and clears everything on delete',
    async () => {
      const { container } = render(<LogoSet />);
      const pick = (bytes: number[]) =>
        fireEvent.change(container.querySelector('input[type="file"]') as HTMLInputElement, {
          target: { files: [new File([new Uint8Array(bytes)], 'logo.png', { type: 'image/png' })] },
        });
      const shown = () => (screen.getByAltText('Logo') as HTMLImageElement).src;

      pick([1, 2, 3]);
      await screen.findByAltText('Logo', undefined, SLOW);
      const first = shown();
      expect(screen.queryByText('No Image Uploaded')).not.toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Download All (41)' })).toBeInTheDocument();
      ['Favicons', 'Icons', 'Logos', 'Splash Screens'].forEach((title) => {
        expect(screen.getByText(title)).toBeInTheDocument();
      });
      await waitFor(() => expect(saved().image).toBe(first), SLOW);
      expect(screen.getByLabelText('Nothing to undo')).toBeInTheDocument();
      expect(screen.getByLabelText('Nothing to redo')).toBeInTheDocument();

      pick([9, 8, 7, 6]);
      await waitFor(() => expect(shown()).not.toBe(first), SLOW);
      const second = shown();
      expect(screen.getByLabelText('Undo (1/1)')).toBeInTheDocument();

      const [undo, redo] = within(screen.getByTestId('actions')).getAllByRole('button');
      fireEvent.click(undo);
      await waitFor(() => expect(shown()).toBe(first), SLOW);
      expect(screen.getByLabelText('Redo (2/2)')).toBeInTheDocument();
      fireEvent.click(redo);
      await waitFor(() => expect(shown()).toBe(second), SLOW);

      fireEvent.click(screen.getByRole('button', { name: 'Delete image' }));
      expect(await screen.findByText('No Image Uploaded', undefined, SLOW)).toBeInTheDocument();
      await waitFor(() => expect(saved().image).toBeNull(), SLOW);
    },
    HEAVY
  );

  it(
    'downloads every size, one per 200ms, using cropped images and custom sizes where set',
    async () => {
      preload({
        image: IMG_A,
        croppedImages: { 'custom-x': IMG_B },
        customSizes: [
          { id: 'x', width: 480, height: 800, label: 'Mine' },
          { id: 'y', width: 77, height: 33, label: '' },
        ],
      });
      const anchors: HTMLAnchorElement[] = [];
      const create = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation(((tag: string) => {
        const el = create(tag);
        if (tag === 'a') anchors.push(el as HTMLAnchorElement);
        return el;
      }) as typeof document.createElement);
      const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

      render(<LogoSet />);
      vi.useFakeTimers();
      fireEvent.click(screen.getByRole('button', { name: 'Download All (43)' }));
      expect(click).not.toHaveBeenCalled();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(200 * 43);
      });
      const names = anchors.filter((a) => a.download).map((a) => a.download);
      expect(names).toHaveLength(43);
      expect(names[0]).toBe('logo-16x16.png');
      expect(names).toContain('logo-480x800.png');
      expect(names).toContain('logo-77x33.png');
      expect(click).toHaveBeenCalledTimes(43);
    },
    HEAVY
  );

  it(
    'crops a size, clears the crop and gives the size its own settings',
    async () => {
      preload({ image: IMG_A, customSizes: [{ id: 'c', width: 10, height: 10, label: 'Ten' }] });
      render(<LogoSet />);
      const card = () => cardFor('16×16', 'favicon');
      expect(card()).toBeTruthy();

      fireEvent.click(within(card()).getByRole('button', { name: 'Crop for this size' }));
      expect(await screen.findByText('Crop 16×16', undefined, SLOW)).toBeInTheDocument();
      fireEvent.click(screen.getByText('finish-crop'));
      fireEvent.click(screen.getByRole('button', { name: /Apply Crop/ }));
      await waitFor(() => expect(saved().croppedImages['favicon-16']).toMatch(/^data:image\/png/), SLOW);
      expect(within(card()).getByText('Cropped')).toBeInTheDocument();

      fireEvent.click(card().querySelector('.MuiChip-deleteIcon') as Element);
      await waitFor(() => expect(saved().croppedImages).toEqual({}), SLOW);

      fireEvent.click(within(card()).getByRole('button', { name: 'Settings' }));
      const drawer = await screen.findByRole('dialog', undefined, SLOW);
      const scale = within(drawer).getByText('Scale').closest('div')?.parentElement?.parentElement as HTMLElement;
      fireEvent.change(within(scale).getByRole('slider'), { target: { value: 0.5 } });
      await waitFor(() => expect(saved().sizeSettings['favicon-16'].scale).toBe(0.5), SLOW);
      fireEvent.click(within(drawer).getByRole('button', { name: 'Reset' }));
      await waitFor(() => expect(saved().sizeSettings).toEqual({}), SLOW);
    },
    HEAVY
  );
});

describe('CanvasCard', () => {
  const size = FAVICON_SIZES[1];
  const colour = (el: HTMLElement) => getComputedStyle(el).borderColor;

  const renderCard = (props: Partial<React.ComponentProps<typeof CanvasCard>> = {}) =>
    render(<CanvasCard image={IMG_A} size={size} settings={DEFAULT_SETTINGS} format="png" {...props} />);

  it('picks its border colour from cropped, selected, custom, then plain', () => {
    const border = (props: Partial<React.ComponentProps<typeof CanvasCard>>) => {
      const { container, unmount } = renderCard(props);
      const value = colour(container.querySelector('.MuiPaper-root') as HTMLElement);
      unmount();
      return value;
    };
    const plain = border({});
    const custom = border({ hasCustomSettings: true });
    const selected = border({ isSelected: true, hasCustomSettings: true });
    const cropped = border({ croppedImage: IMG_B, isSelected: true, hasCustomSettings: true });
    expect(new Set([plain, custom, selected, cropped]).size).toBe(4);
  });

  it('works without any callbacks: crop and settings changes are simply not reported', async () => {
    const { container } = renderCard({ croppedImage: IMG_B });
    fireEvent.click(container.querySelector('.MuiChip-deleteIcon') as Element);
    fireEvent.click(screen.getByRole('button', { name: 'Crop for this size' }));
    fireEvent.click(await screen.findByText('finish-crop'));
    fireEvent.click(screen.getByRole('button', { name: /Apply Crop/ }));
    await waitFor(() => expect(screen.queryByText('Crop 32×32')).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    const drawer = await screen.findByRole('dialog');
    fireEvent.click(within(drawer).getByRole('button', { name: 'Copy Global' }));
    fireEvent.click(within(drawer).getByRole('button', { name: 'Reset' }));
    expect(drawer).toBeInTheDocument();
  });

  it('closes the crop modal on cancel and previews the rendered canvas on click', async () => {
    const { container } = renderCard({ onCroppedImage: vi.fn() });
    fireEvent.click(screen.getByRole('button', { name: 'Crop for this size' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByText('Crop 32×32')).not.toBeInTheDocument());

    fireEvent.click(container.querySelector('canvas') as HTMLCanvasElement);
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('img', { name: '32×32' })).toHaveAttribute(
      'src',
      expect.stringMatching(/^data:image\/png;base64,/)
    );
  });

  it('closes the crop modal, the settings drawer and the preview with Escape', async () => {
    const { container } = renderCard();
    fireEvent.click(screen.getByRole('button', { name: 'Crop for this size' }));
    fireEvent.keyDown(await screen.findByText('Crop 32×32'), { key: 'Escape' });
    await waitFor(() => expect(screen.queryByText('Crop 32×32')).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    const drawer = await screen.findByRole('dialog');
    fireEvent.keyDown(drawer, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    fireEvent.click(container.querySelector('canvas') as HTMLCanvasElement);
    const preview = await screen.findByRole('dialog');
    fireEvent.keyDown(preview, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('rounds the preview corners by the border radius', () => {
    const { container } = renderCard({ settings: { ...DEFAULT_SETTINGS, borderRadius: 25 } });
    expect((container.querySelector('canvas') as HTMLCanvasElement).style.borderRadius).toBe('25%');
    const { container: plain } = renderCard();
    expect((plain.querySelector('canvas') as HTMLCanvasElement).style.borderRadius).toBe('');
  });

  it('keys cropped images by category and width, and reports settings for the size', async () => {
    const onCroppedImage = vi.fn();
    const onSizeSettings = vi.fn();
    renderCard({ onCroppedImage, onSizeSettings, hasCustomSettings: true, globalSettings: DEFAULT_SETTINGS });
    fireEvent.click(screen.getByRole('button', { name: 'Crop for this size' }));
    fireEvent.click(await screen.findByText('finish-crop'));
    fireEvent.click(screen.getByRole('button', { name: /Apply Crop/ }));
    await waitFor(() => expect(onCroppedImage).toHaveBeenCalledWith('favicon-32', expect.stringMatching(/^data:/)));

    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    const drawer = await screen.findByRole('dialog');
    fireEvent.click(within(drawer).getByRole('button', { name: 'Reset' }));
    expect(onSizeSettings).toHaveBeenLastCalledWith(null);
    fireEvent.click(within(drawer).getByRole('button', { name: 'Copy Global' }));
    expect(onSizeSettings).toHaveBeenLastCalledWith(DEFAULT_SETTINGS);
  });

  it('downloads the card at its size in the chosen format', () => {
    const anchors: HTMLAnchorElement[] = [];
    const create = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation(((tag: string) => {
      const el = create(tag);
      if (tag === 'a') anchors.push(el as HTMLAnchorElement);
      return el;
    }) as typeof document.createElement);
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    renderCard({ format: 'jpg', croppedImage: IMG_B });
    fireEvent.click(screen.getByRole('button', { name: 'Download JPG' }));
    expect(anchors.at(-1)?.download).toBe('logo-32x32.jpg');
    expect(click).toHaveBeenCalledTimes(1);
  });
});

describe('PreviewGrid scope', () => {
  const sizes = [{ id: 'k', width: 10, height: 10, label: 'Ten' }];
  const props = {
    image: IMG_A,
    settings: DEFAULT_SETTINGS,
    format: 'png' as const,
    customSizes: sizes,
    croppedImages: {},
    onCroppedImage: vi.fn(),
    sizeSettings: {},
    onSizeSettings: vi.fn(),
  };
  const borderOf = (label: string, category: string) => getComputedStyle(cardFor(label, category)).borderColor;

  it(
    'selects only the custom sizes for the custom scope, and reports their settings by key',
    async () => {
      const onSizeSettings = vi.fn();
      render(<PreviewGrid {...props} applyScope="custom-all" onSizeSettings={onSizeSettings} />);
      const custom = cardFor('Ten', 'splash');
      const favicon = cardFor('16×16', 'favicon');
      expect(getComputedStyle(custom).borderColor).not.toBe(getComputedStyle(favicon).borderColor);
      expect(borderOf('Ten', 'splash')).not.toBe(borderOf('480×800 (Android mdpi)', 'splash'));

      fireEvent.click(within(custom).getByRole('button', { name: 'Settings' }));
      const drawer = await screen.findByRole('dialog', undefined, SLOW);
      fireEvent.click(within(drawer).getByRole('button', { name: 'Copy Global' }));
      expect(onSizeSettings).toHaveBeenCalledWith('custom-k', DEFAULT_SETTINGS);
    },
    HEAVY
  );

  it(
    'selects a single size by its key',
    () => {
      render(<PreviewGrid {...props} customSizes={[]} applyScope="favicon-32" />);
      expect(borderOf('32×32', 'favicon')).not.toBe(borderOf('16×16', 'favicon'));
    },
    HEAVY
  );
});
