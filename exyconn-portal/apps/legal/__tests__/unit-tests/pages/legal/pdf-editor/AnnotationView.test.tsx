import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { AnnotationView } from '../../../../../src/pages/legal/pdf-editor/AnnotationView';
import type { PdfAnnotation } from '../../../../../src/pages/legal/pdf-editor/pdf-editor.types';
import { renderWithProviders } from '../../../test-utils';

const at = { id: 'a', page: 0, x: 0.1, y: 0.2, w: 0.3, h: 0.1 };

function renderView(
  annotation: PdfAnnotation,
  extra: { selected?: boolean; editing?: boolean } = {},
) {
  const handlers = { onPointerDown: vi.fn(), onTextChange: vi.fn(), onTextDone: vi.fn() };
  const view = renderWithProviders(
    <AnnotationView
      annotation={annotation}
      selected={extra.selected ?? false}
      editing={extra.editing ?? false}
      pointScale={2}
      {...handlers}
    />,
  );
  return { ...handlers, ...view };
}

const boxOf = (container: HTMLElement, kind: string) =>
  container.querySelector<HTMLElement>(`[data-annotation="${kind}"]`);

describe('AnnotationView', () => {
  it('draws a stroke as one polyline over the page, out of the pointer’s way', () => {
    const { container } = renderView({
      ...at,
      kind: 'draw',
      color: '#1d4ed8',
      points: [
        [0, 0],
        [0.5, 0.25],
      ],
    });
    const line = container.querySelector('polyline');
    expect(line).toHaveAttribute('points', '0,0 0.5,0.25');
    expect(line).toHaveAttribute('stroke', '#1d4ed8');
    expect(container.querySelector('[data-annotation]')).toBeNull();
  });

  it('shows text at its printed size, and hands a press back with the annotation', () => {
    const text: PdfAnnotation = {
      ...at,
      kind: 'text',
      text: 'Agreed',
      fontSize: 12,
      color: '#000',
    };
    const { container, onPointerDown } = renderView(text);

    expect(screen.getByText('Agreed')).toHaveStyle({ fontSize: '24px' });
    const box = boxOf(container, 'text');
    expect(box).toHaveStyle({ left: '10%', top: '20%', width: '30%', height: 'auto' });

    fireEvent.pointerDown(box as HTMLElement);
    expect(onPointerDown).toHaveBeenCalledWith(expect.anything(), text);
  });

  it('types into a text box being edited and lets go of it on blur', () => {
    const text: PdfAnnotation = { ...at, kind: 'text', text: 'Ag', fontSize: 12, color: '#000' };
    const { onTextChange, onTextDone } = renderView(text, { editing: true, selected: true });
    const field = screen.getByRole('textbox', { name: 'Text on the page' });
    expect(field).toHaveFocus();

    fireEvent.change(field, { target: { value: 'Agreed' } });
    expect(onTextChange).toHaveBeenCalledWith('a', 'Agreed');

    fireEvent.blur(field);
    expect(onTextDone).toHaveBeenCalledWith(text);
  });

  it('places a picture filling its box', () => {
    const { container } = renderView({ ...at, kind: 'image', src: 'data:image/png;base64,AA==' });
    const image = container.querySelector('img');
    expect(image).toHaveAttribute('src', 'data:image/png;base64,AA==');
    expect(boxOf(container, 'image')).toHaveStyle({ height: '10%' });
  });

  it('outlines a box in its colour, highlights see-through and whites out solid', () => {
    const rect = renderView({ ...at, kind: 'rect', color: '#b91c1c' }, { selected: true });
    expect(boxOf(rect.container, 'rect')).toHaveStyle({ border: '2px solid #b91c1c' });
    rect.unmount();

    const highlight = renderView({ ...at, kind: 'highlight' });
    expect(boxOf(highlight.container, 'highlight')).toHaveStyle({ opacity: '0.35' });
    highlight.unmount();

    const whiteout = renderView({ ...at, kind: 'whiteout' });
    expect(boxOf(whiteout.container, 'whiteout')).toBeEmptyDOMElement();
  });
});
