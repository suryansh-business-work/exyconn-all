/**
 * The page's own wiring (state, persistence, settings panel, custom-sizes dialog). The
 * gallery of 40+ canvas cards is replaced by a probe that reports the props it was given,
 * since the gallery and its cards are covered in logoSet.test.tsx.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import LogoSet from '../../tools/logo-set';
import { DEFAULT_SETTINGS } from '../../tools/logo-set/types';

vi.mock('../../shared/components/ToolLayout/ToolLayout', () => ({
  default: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../../tools/logo-set/components/PreviewGrid/PreviewGrid', () => ({
  default: (props: Record<string, unknown>) => (
    <pre data-testid="grid">
      {JSON.stringify({
        image: props.image,
        format: props.format,
        applyScope: props.applyScope,
        customSizes: props.customSizes,
        croppedImages: props.croppedImages,
        sizeSettings: props.sizeSettings,
        scale: (props.settings as { scale: number }).scale,
      })}
    </pre>
  ),
}));

const STATE_KEY = 'logo-set-state';
const saved = () => JSON.parse(localStorage.getItem(STATE_KEY) as string);
const gridProps = () => JSON.parse(screen.getByTestId('grid').textContent as string);
const IMG = 'data:image/png;base64,AAAA';

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe('LogoSet wiring', () => {
  it('restores the saved session into the panel and the gallery', () => {
    localStorage.setItem(
      STATE_KEY,
      JSON.stringify({
        image: IMG,
        globalSettings: { ...DEFAULT_SETTINGS, scale: 1.2 },
        sizeSettings: { 'favicon-16': { ...DEFAULT_SETTINGS, scale: 0.5 } },
        croppedImages: { 'favicon-32': IMG },
        format: 'jpg',
        customSizes: [{ id: 'x', width: 300, height: 100, label: 'Wide' }],
      })
    );
    render(<LogoSet />);
    expect(screen.getByRole('button', { name: 'JPG' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('300×100')).toBeInTheDocument();
    expect(gridProps()).toMatchObject({
      image: IMG,
      format: 'jpg',
      scale: 1.2,
      croppedImages: { 'favicon-32': IMG },
      customSizes: [{ id: 'x', width: 300, height: 100, label: 'Wide' }],
    });
    expect(Object.keys(gridProps().sizeSettings)).toEqual(['favicon-16']);
  });

  it('changes the format, and applies a settings change only to the chosen scope', async () => {
    localStorage.setItem(STATE_KEY, JSON.stringify({ image: IMG }));
    render(<LogoSet />);
    fireEvent.click(screen.getByRole('button', { name: 'WEBP' }));
    await waitFor(() => expect(saved().format).toBe('webp'));
    expect(gridProps().format).toBe('webp');

    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: /All Favicons/ }));
    expect(gridProps().applyScope).toBe('favicon-all');
    const scale = screen.getByText('Scale').closest('div')?.parentElement?.parentElement as HTMLElement;
    fireEvent.change(within(scale).getByRole('slider'), { target: { value: 2 } });
    await waitFor(() => expect(saved().globalSettings.scale).toBe(2));
    expect(Object.keys(saved().sizeSettings).sort()).toEqual(['favicon-16', 'favicon-32', 'favicon-48']);
  });

  it('edits the custom sizes through the dialog', async () => {
    localStorage.setItem(
      STATE_KEY,
      JSON.stringify({ image: IMG, customSizes: [{ id: 'x', width: 300, height: 100, label: 'Wide' }] })
    );
    render(<LogoSet />);
    fireEvent.click(screen.getByRole('button', { name: /Manage Custom Sizes/ }));
    fireEvent.click(await screen.findByRole('button', { name: '+ 4K' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Save (2)' }));
    await waitFor(() => expect(saved().customSizes).toHaveLength(2));
    expect(gridProps().customSizes.map((size: { label: string }) => size.label)).toEqual(['Wide', '4K']);
  });

  it('closes the custom sizes dialog without saving', async () => {
    localStorage.setItem(STATE_KEY, JSON.stringify({ image: IMG }));
    render(<LogoSet />);
    fireEvent.click(screen.getByRole('button', { name: /Manage Custom Sizes/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByText('Custom Sizes', { selector: 'h2 *' })).not.toBeInTheDocument());
    expect(saved().customSizes).toEqual([]);
  });

  it('resets after confirmation when custom changes exist', async () => {
    localStorage.setItem(
      STATE_KEY,
      JSON.stringify({
        image: IMG,
        globalSettings: { ...DEFAULT_SETTINGS, scale: 2 },
        sizeSettings: { 'favicon-16': { ...DEFAULT_SETTINGS, scale: 0.5 } },
        croppedImages: { 'favicon-32': IMG },
      })
    );
    render(<LogoSet />);
    fireEvent.click(screen.getByRole('button', { name: /^Reset \(Custom changes exist\)$/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Reset Anyway' }));
    await waitFor(() => expect(saved().globalSettings).toEqual(DEFAULT_SETTINGS));
    expect(saved().croppedImages).toEqual({});
    expect(saved().sizeSettings).toEqual({});
    expect(gridProps().scale).toBe(1);
  });
});
