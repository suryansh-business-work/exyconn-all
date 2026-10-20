import { describe, expect, it, vi } from 'vitest';
import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PdfToolbar } from '../../../../../src/pages/legal/pdf-editor/PdfToolbar';
import {
  usePdfAnnotations,
  type PdfAnnotationsApi,
} from '../../../../../src/pages/legal/pdf-editor/usePdfAnnotations';
import { renderWithProviders } from '../../../test-utils';

/** The toolbar on the real annotation state, which the test can reach through `api.current`. */
function renderToolbar(zoom = 1) {
  const api: { current: PdfAnnotationsApi | null } = { current: null };
  const onZoom = vi.fn();
  const onPickStamp = vi.fn();
  function Harness() {
    api.current = usePdfAnnotations();
    return <PdfToolbar api={api.current} zoom={zoom} onZoom={onZoom} onPickStamp={onPickStamp} />;
  }
  renderWithProviders(<Harness />);
  return { api: () => api.current as PdfAnnotationsApi, onZoom, onPickStamp };
}

const button = (name: string) => screen.getByRole('button', { name });

const box = {
  id: 'a',
  page: 0,
  kind: 'whiteout' as const,
  x: 0.1,
  y: 0.1,
  w: 0.2,
  h: 0.2,
};

describe('PdfToolbar', () => {
  it('switches tools, and pressing the current one keeps it', async () => {
    const { api } = renderToolbar();
    expect(button('Select and move')).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(button('Draw freehand'));
    expect(api().tool).toBe('draw');

    await userEvent.click(button('Draw freehand'));
    expect(api().tool).toBe('draw');
  });

  it.each([
    ['Add image', 'image'],
    ['Add signature', 'signature'],
  ])('asks for a picture before %s can be used', async (name, tool) => {
    const { api, onPickStamp } = renderToolbar();

    await userEvent.click(button(name));

    expect(onPickStamp).toHaveBeenCalledWith(tool);
    expect(api().tool).toBe('select');
  });

  it('changes the ink and the text size', async () => {
    const { api } = renderToolbar();

    await userEvent.click(screen.getByRole('combobox', { name: 'Ink' }));
    await userEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: 'Red' }));
    expect(api().color).toBe('#b91c1c');

    await userEvent.click(screen.getByRole('combobox', { name: 'Text size' }));
    await userEvent.click(
      within(screen.getByRole('listbox')).getByRole('option', { name: '24 pt' }),
    );
    expect(api().fontSize).toBe(24);
  });

  it('undoes and deletes only when there is something to act on', async () => {
    const { api } = renderToolbar();
    expect(button('Undo')).toBeDisabled();
    expect(button('Delete selected')).toBeDisabled();

    act(() => api().add(box));
    expect(button('Delete selected')).toBeEnabled();
    await userEvent.click(button('Delete selected'));
    expect(api().annotations).toEqual([]);

    await userEvent.click(button('Undo'));
    expect(api().annotations).toEqual([box]);
  });

  it('zooms in and out by a quarter', async () => {
    const { onZoom } = renderToolbar(1);
    await userEvent.click(button('Zoom in'));
    await userEvent.click(button('Zoom out'));
    expect(onZoom.mock.calls).toEqual([[1.25], [0.75]]);
  });

  it('stops zooming at half and at double size', () => {
    renderToolbar(0.5);
    expect(button('Zoom out')).toBeDisabled();
    expect(button('Zoom in')).toBeEnabled();
  });

  it('stops zooming in at double size', () => {
    renderToolbar(2);
    expect(button('Zoom in')).toBeDisabled();
  });
});
