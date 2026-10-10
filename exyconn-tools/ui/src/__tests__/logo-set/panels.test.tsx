import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import GlobalSettings from '../../tools/logo-set/components/GlobalSettings';
import ScopeSelector from '../../tools/logo-set/components/GlobalSettings/ScopeSelector';
import SizeSettingsDrawer from '../../tools/logo-set/components/SizeSettingsDrawer/SizeSettingsDrawer';
import CanvasToolbar from '../../tools/logo-set/components/CanvasCard/CanvasToolbar';
import { CroppedBadge, CustomSettingsBadge } from '../../tools/logo-set/components/CanvasCard/CanvasBadges';
import ImagePreviewDialog from '../../tools/logo-set/components/ImagePreviewDialog/ImagePreviewDialog';
import EmptyState from '../../tools/logo-set/components/EmptyState/EmptyState';
import CustomSizesSection from '../../tools/logo-set/components/GlobalSettings/CustomSizesSection';
import BackgroundColorPicker from '../../tools/logo-set/components/GlobalSettings/BackgroundColorPicker';
import { CanvasSize, DEFAULT_SETTINGS, LogoSettings } from '../../tools/logo-set/types';

const RESET_HEADER = /^Reset( \(Custom changes exist\)| to defaults)$/;

const size: CanvasSize = { width: 64, height: 64, label: '64×64', category: 'icon' };

const sliderFor = (label: string) => {
  const row = screen.getByText(label).closest('div')?.parentElement?.parentElement as HTMLElement;
  return within(row).getByRole('slider');
};

describe('GlobalSettings', () => {
  const baseProps = () => ({
    settings: DEFAULT_SETTINGS,
    onChange: vi.fn(),
    format: 'png' as const,
    onFormatChange: vi.fn(),
    applyScope: 'all',
    onApplyScopeChange: vi.fn(),
    customSizes: [],
    onCustomSizesChange: vi.fn(),
    onOpenCustomSizesDialog: vi.fn(),
    onReset: vi.fn(),
    hasCustomChanges: false,
  });

  it('emits a full settings object for every slider that changes', () => {
    const props = baseProps();
    render(<GlobalSettings {...props} />);
    const expectations: Array<[string, keyof LogoSettings, number]> = [
      ['Scale', 'scale', 2],
      ['Rotation', 'rotation', 45],
      ['X Offset', 'x', 30],
      ['Y Offset', 'y', -30],
      ['Border Radius', 'borderRadius', 12],
      ['Padding', 'padding', 25],
    ];
    expectations.forEach(([label, key, value]) => {
      fireEvent.change(sliderFor(label), { target: { value } });
      expect(props.onChange).toHaveBeenLastCalledWith({ ...DEFAULT_SETTINGS, [key]: value });
    });
  });

  it('reveals the image adjustments and resets all three of them in one update', () => {
    const props = baseProps();
    const settings = { ...DEFAULT_SETTINGS, brightness: 150, contrast: 60, grayscale: 40 };
    render(<GlobalSettings {...props} settings={settings} />);
    fireEvent.click(screen.getByRole('button', { name: /Image Adjustments/ }));
    expect(screen.getByRole('button', { name: /Show Less/ })).toBeInTheDocument();

    fireEvent.change(sliderFor('Brightness'), { target: { value: 120 } });
    expect(props.onChange).toHaveBeenLastCalledWith({ ...settings, brightness: 120 });
    fireEvent.change(sliderFor('Contrast'), { target: { value: 70 } });
    expect(props.onChange).toHaveBeenLastCalledWith({ ...settings, contrast: 70 });
    fireEvent.change(sliderFor('Grayscale'), { target: { value: 5 } });
    expect(props.onChange).toHaveBeenLastCalledWith({ ...settings, grayscale: 5 });

    fireEvent.click(screen.getByRole('button', { name: 'Reset Adjustments' }));
    expect(props.onChange).toHaveBeenLastCalledWith({
      ...settings,
      brightness: 100,
      contrast: 100,
      grayscale: 0,
    });
  });

  it('offers no adjustment reset while the adjustments are at their defaults', () => {
    render(<GlobalSettings {...baseProps()} />);
    fireEvent.click(screen.getByRole('button', { name: /Image Adjustments/ }));
    expect(screen.queryByRole('button', { name: 'Reset Adjustments' })).not.toBeInTheDocument();
  });

  it('resets straight away when nothing is customised', () => {
    const props = baseProps();
    render(<GlobalSettings {...props} />);
    fireEvent.click(screen.getByRole('button', { name: RESET_HEADER }));
    expect(props.onReset).toHaveBeenCalledTimes(1);
  });

  it('asks before resetting custom changes, and cancel keeps them', async () => {
    const props = baseProps();
    render(<GlobalSettings {...props} hasCustomChanges />);
    fireEvent.click(screen.getByRole('button', { name: RESET_HEADER }));
    expect(props.onReset).not.toHaveBeenCalled();
    expect(await screen.findByText(/Reset Settings\?/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(props.onReset).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: RESET_HEADER }));
    fireEvent.click(await screen.findByRole('button', { name: 'Reset Anyway' }));
    expect(props.onReset).toHaveBeenCalledTimes(1);
  });

  it('toggles transparency, shows the colour picker and updates the background', () => {
    const props = baseProps();
    const { rerender } = render(<GlobalSettings {...props} />);
    expect(screen.queryByText(/Contrast:/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('switch'));
    expect(props.onChange).toHaveBeenLastCalledWith({ ...DEFAULT_SETTINGS, transparent: false });

    const opaque = { ...DEFAULT_SETTINGS, transparent: false, backgroundColor: '#ffffff' };
    rerender(<GlobalSettings {...props} settings={opaque} />);
    expect(screen.getByText(/Contrast: 21\.0:1/)).toBeInTheDocument();
    const colour = document.querySelector('input[type="color"]') as HTMLInputElement;
    fireEvent.change(colour, { target: { value: '#112233' } });
    expect(props.onChange).toHaveBeenLastCalledWith({ ...opaque, backgroundColor: '#112233' });
  });

  it('switches the export format and ignores a click on the active format', () => {
    const props = baseProps();
    render(<GlobalSettings {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'WEBP' }));
    expect(props.onFormatChange).toHaveBeenCalledWith('webp');
    props.onFormatChange.mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'PNG' }));
    expect(props.onFormatChange).not.toHaveBeenCalled();
  });

  it('lists custom sizes with an overflow chip and opens the manager', () => {
    const props = baseProps();
    const customSizes = Array.from({ length: 6 }, (_, i) => ({
      id: `c${i}`,
      width: 10 + i,
      height: 20,
      label: `S${i}`,
    }));
    render(<GlobalSettings {...props} customSizes={customSizes} />);
    expect(screen.getByText('10×20')).toBeInTheDocument();
    expect(screen.getByText('+2 more')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Manage Custom Sizes/ }));
    expect(props.onOpenCustomSizesDialog).toHaveBeenCalled();
  });
});

describe('CustomSizesSection', () => {
  it('shows no chips and no badge without sizes, and no overflow chip for four or fewer', () => {
    const { rerender } = render(<CustomSizesSection customSizes={[]} onOpenCustomSizesDialog={vi.fn()} />);
    expect(screen.queryByText(/more$/)).not.toBeInTheDocument();
    expect(screen.queryByText('1')).not.toBeInTheDocument();
    rerender(
      <CustomSizesSection
        customSizes={[{ id: 'a', width: 1, height: 2, label: 'A' }]}
        onOpenCustomSizesDialog={vi.fn()}
      />
    );
    expect(screen.getByText('1×2')).toBeInTheDocument();
    expect(screen.queryByText(/more$/)).not.toBeInTheDocument();
  });
});

describe('ScopeSelector', () => {
  it('reports the chosen scope', () => {
    const onChange = vi.fn();
    render(<ScopeSelector applyScope="all" onApplyScopeChange={onChange} />);
    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: /All Favicons/ }));
    expect(onChange).toHaveBeenCalledWith('favicon-all');
  });
});

describe('BackgroundColorPicker', () => {
  const noop = vi.fn();

  it('rates the contrast of the background and offers colours from the image', () => {
    const onUpdate = vi.fn();
    const { rerender } = render(
      <BackgroundColorPicker
        backgroundColor="#000000"
        extractedColors={['#ff0000', '#00ff00']}
        isExtractingColors
        onUpdate={onUpdate}
      />
    );
    expect(screen.getByText(/Contrast: 21\.0:1 - Excellent \(AAA\)/)).toBeInTheDocument();
    expect(screen.getByText('From Image:')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    const swatches = screen.getAllByRole('button');
    fireEvent.click(swatches[0]);
    expect(onUpdate).toHaveBeenCalledWith('backgroundColor', '#ff0000');

    rerender(
      <BackgroundColorPicker
        backgroundColor="#808080"
        extractedColors={[]}
        isExtractingColors={false}
        onUpdate={noop}
      />
    );
    // Mid-grey is the worst case for a white-or-black label: still above 4.5:1, so always a pass.
    expect(screen.getByText(/Contrast: 5\.3:1 - Good \(AA\)/)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('MuiAlert-colorSuccess');
    expect(screen.queryByText('From Image:')).not.toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});

describe('BackgroundColorPicker swatches', () => {
  it('marks the swatch that matches the background and switches to another on click', () => {
    const onUpdate = vi.fn();
    render(
      <BackgroundColorPicker
        backgroundColor="#00ff00"
        extractedColors={['#00ff00', '#ff0000']}
        isExtractingColors={false}
        onUpdate={onUpdate}
      />
    );
    const [current, other] = screen.getAllByRole('button');
    expect(getComputedStyle(current).borderWidth).not.toBe(getComputedStyle(other).borderWidth);
    fireEvent.click(other);
    expect(onUpdate).toHaveBeenCalledWith('backgroundColor', '#ff0000');
  });
});

describe('SizeSettingsDrawer', () => {
  const props = () => ({
    open: true,
    onClose: vi.fn(),
    sizeLabel: '64×64',
    settings: DEFAULT_SETTINGS,
    onChange: vi.fn(),
    onReset: vi.fn(),
  });

  it('updates each transform slider and shows the shadow slider only for icons', () => {
    const p = props();
    const { rerender } = render(<SizeSettingsDrawer {...p} />);
    expect(screen.queryByText('Box Shadow')).not.toBeInTheDocument();
    const cases: Array<[string, keyof LogoSettings, number]> = [
      ['Scale', 'scale', 1.5],
      ['Rotation', 'rotation', 90],
      ['X Offset', 'x', 5],
      ['Y Offset', 'y', 6],
      ['Border Radius', 'borderRadius', 10],
      ['Padding', 'padding', 15],
    ];
    cases.forEach(([label, key, value]) => {
      fireEvent.change(sliderFor(label), { target: { value } });
      expect(p.onChange).toHaveBeenLastCalledWith({ ...DEFAULT_SETTINGS, [key]: value });
    });

    rerender(<SizeSettingsDrawer {...p} isIcon />);
    expect(screen.getByText('Off')).toBeInTheDocument();
    fireEvent.change(sliderFor('Box Shadow'), { target: { value: 8 } });
    expect(p.onChange).toHaveBeenLastCalledWith({ ...DEFAULT_SETTINGS, boxShadow: 8 });
    rerender(<SizeSettingsDrawer {...p} isIcon settings={{ ...DEFAULT_SETTINGS, boxShadow: 8 }} />);
    expect(screen.getByText('8px')).toBeInTheDocument();
  });

  it('edits the background only while it is not transparent', () => {
    const p = props();
    const { rerender } = render(<SizeSettingsDrawer {...p} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(p.onChange).toHaveBeenLastCalledWith({ ...DEFAULT_SETTINGS, transparent: false });
    expect(document.querySelector('input[type="color"]')).toBeNull();

    const opaque = { ...DEFAULT_SETTINGS, transparent: false, backgroundColor: '#abcdef' };
    rerender(<SizeSettingsDrawer {...p} settings={opaque} />);
    expect(screen.getByText('#abcdef')).toBeInTheDocument();
    fireEvent.change(document.querySelector('input[type="color"]') as HTMLInputElement, {
      target: { value: '#000001' },
    });
    expect(p.onChange).toHaveBeenLastCalledWith({ ...opaque, backgroundColor: '#000001' });
  });

  it('resets to the global settings (or the defaults) and copies the global settings', () => {
    const p = props();
    const global = { ...DEFAULT_SETTINGS, scale: 2 };
    const { rerender } = render(<SizeSettingsDrawer {...p} globalSettings={global} hasCustomSettings />);
    expect(screen.getByText('Custom')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Copy Global' }));
    expect(p.onChange).toHaveBeenLastCalledWith(global);
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(p.onChange).toHaveBeenLastCalledWith(global);
    expect(p.onReset).toHaveBeenCalledTimes(1);

    rerender(<SizeSettingsDrawer {...p} />);
    expect(screen.queryByText('Custom')).not.toBeInTheDocument();
    p.onChange.mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'Copy Global' }));
    expect(p.onChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(p.onChange).toHaveBeenLastCalledWith(DEFAULT_SETTINGS);
  });

  it('closes from the header button', () => {
    const p = props();
    render(<SizeSettingsDrawer {...p} />);
    const header = screen.getByText(/64×64/).parentElement?.parentElement as HTMLElement;
    fireEvent.click(within(header).getByRole('button'));
    expect(p.onClose).toHaveBeenCalled();
  });
});

describe('CanvasToolbar', () => {
  it('names the size and colours the category chip per category', () => {
    const noop = vi.fn();
    const { rerender } = render(
      <CanvasToolbar size={size} format="png" onSettingsClick={noop} onCropClick={noop} onDownloadClick={noop} />
    );
    expect(screen.getByText('64×64')).toBeInTheDocument();
    expect(screen.getByText('icon')).toHaveClass('MuiChip-label');
    const chipOf = (text: string) => screen.getByText(text).parentElement as HTMLElement;
    expect(chipOf('icon')).toHaveClass('MuiChip-colorInfo');
    rerender(
      <CanvasToolbar
        size={{ ...size, category: 'favicon' }}
        format="png"
        onSettingsClick={noop}
        onCropClick={noop}
        onDownloadClick={noop}
      />
    );
    expect(chipOf('favicon')).toHaveClass('MuiChip-colorWarning');
    rerender(
      <CanvasToolbar
        size={{ ...size, category: 'logo' }}
        format="png"
        onSettingsClick={noop}
        onCropClick={noop}
        onDownloadClick={noop}
      />
    );
    expect(chipOf('logo')).toHaveClass('MuiChip-colorSuccess');
    rerender(
      <CanvasToolbar
        size={{ ...size, category: 'splash' }}
        format="png"
        onSettingsClick={noop}
        onCropClick={noop}
        onDownloadClick={noop}
      />
    );
    expect(chipOf('splash')).toHaveClass('MuiChip-colorDefault');
  });

  it('fires each of its three actions and names the download format', () => {
    const onSettingsClick = vi.fn();
    const onCropClick = vi.fn();
    const onDownloadClick = vi.fn();
    render(
      <CanvasToolbar
        size={size}
        format="webp"
        hasCustomSettings
        hasCroppedImage
        onSettingsClick={onSettingsClick}
        onCropClick={onCropClick}
        onDownloadClick={onDownloadClick}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    fireEvent.click(screen.getByRole('button', { name: 'Crop for this size' }));
    fireEvent.click(screen.getByRole('button', { name: 'Download WEBP' }));
    expect(onSettingsClick).toHaveBeenCalledTimes(1);
    expect(onCropClick).toHaveBeenCalledTimes(1);
    expect(onDownloadClick).toHaveBeenCalledTimes(1);
  });
});

describe('badges, preview dialog and empty state', () => {
  it('clears a crop from the Cropped badge', () => {
    const onClearCrop = vi.fn();
    render(<CroppedBadge onClearCrop={onClearCrop} />);
    fireEvent.click(document.querySelector('.MuiChip-deleteIcon') as Element);
    expect(onClearCrop).toHaveBeenCalledTimes(1);
  });

  it('labels custom settings', () => {
    render(<CustomSettingsBadge />);
    expect(screen.getByText('Custom')).toBeInTheDocument();
  });

  it('previews an image, downloads it under a file-safe name and closes', () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    const anchors: HTMLAnchorElement[] = [];
    const create = document.createElement.bind(document);
    const spy = vi.spyOn(document, 'createElement').mockImplementation(((tag: string) => {
      const el = create(tag);
      if (tag === 'a') anchors.push(el as HTMLAnchorElement);
      return el;
    }) as typeof document.createElement);
    const onClose = vi.fn();
    render(<ImagePreviewDialog open onClose={onClose} imageUrl="data:image/png;base64,AAA" label="64×64" />);
    expect(screen.getByRole('img', { name: '64×64' })).toHaveAttribute('src', 'data:image/png;base64,AAA');

    const buttons = within(screen.getByRole('dialog')).getAllByRole('button');
    fireEvent.click(buttons[0]);
    expect(anchors[0].download).toBe('64x64.png');
    expect(anchors[0].href).toBe('data:image/png;base64,AAA');
    expect(click).toHaveBeenCalledTimes(1);
    fireEvent.click(buttons[1]);
    expect(onClose).toHaveBeenCalled();
    spy.mockRestore();
    click.mockRestore();
  });

  it('tells the user to upload a logo', () => {
    render(<EmptyState />);
    expect(screen.getByText('No Image Uploaded')).toBeInTheDocument();
  });
});
