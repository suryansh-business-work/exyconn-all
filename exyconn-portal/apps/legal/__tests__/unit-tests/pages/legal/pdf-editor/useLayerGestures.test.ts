import { describe, expect, it, vi } from 'vitest';
import type { PointerEvent } from 'react';
import { act, renderHook } from '@testing-library/react';
import { usePdfAnnotations } from '../../../../../src/pages/legal/pdf-editor/usePdfAnnotations';
import { useLayerGestures } from '../../../../../src/pages/legal/pdf-editor/useLayerGestures';
import type {
  PdfAnnotation,
  PdfTool,
} from '../../../../../src/pages/legal/pdf-editor/pdf-editor.types';

/** A page layer 200 × 400 px at the viewport's origin, so 20 px is 0.1 across. */
function makeLayer(capture = true) {
  const layer = document.createElement('div');
  layer.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 400 }) as DOMRect;
  if (capture) {
    layer.setPointerCapture = vi.fn();
  }
  const child = document.createElement('div');
  layer.appendChild(child);
  return { layer, child };
}

/** A pointer event at (x, y) px on the given element. */
const pointer = (target: HTMLElement, x: number, y: number) =>
  ({
    clientX: x,
    clientY: y,
    pointerId: 7,
    currentTarget: target,
    stopPropagation: vi.fn(),
  }) as unknown as PointerEvent<HTMLElement>;

/** The real annotation state with the gestures for page 1 (aspect 0.5) on top. */
function setup(tool: PdfTool = 'select') {
  const { result } = renderHook(() => {
    const api = usePdfAnnotations();
    return { api, gestures: useLayerGestures(api, 1, 0.5) };
  });
  act(() => result.current.api.setTool(tool));
  return result;
}

type Result = ReturnType<typeof setup>;

/** Presses at one point, moves through the others and lets go at the last. */
function drag(result: Result, layer: HTMLElement, points: Array<[number, number]>) {
  const [first, ...rest] = points;
  act(() => result.current.gestures.onPointerDown(pointer(layer, ...first)));
  for (const point of rest) {
    act(() => result.current.gestures.onPointerMove(pointer(layer, ...point)));
  }
  const last = points.at(-1) ?? first;
  act(() => result.current.gestures.onPointerUp(pointer(layer, ...last)));
}

describe('useLayerGestures', () => {
  it('places an empty text box at the click and starts typing in it', () => {
    const result = setup('text');
    act(() => result.current.api.setFontSize(18));
    const { layer } = makeLayer();

    act(() => result.current.gestures.onPointerDown(pointer(layer, 40, 100)));

    const [text] = result.current.api.annotations;
    expect(text).toMatchObject({
      page: 1,
      kind: 'text',
      x: 0.2,
      y: 0.25,
      w: 0.4,
      h: 0.04,
      text: '',
      fontSize: 18,
      color: '#111827',
    });
    expect(result.current.api.editingId).toBe(text.id);
    expect(result.current.api.selectedId).toBe(text.id);
  });

  it('places the waiting picture sized to its shape and the page’s, then goes back to Select', () => {
    const result = setup('signature');
    act(() => result.current.api.setStamp({ src: 'data:image/png;base64,AA==', aspect: 0.4 }));
    const { layer } = makeLayer();

    act(() => result.current.gestures.onPointerDown(pointer(layer, 20, 40)));

    expect(result.current.api.annotations[0]).toMatchObject({
      page: 1,
      kind: 'image',
      x: 0.1,
      y: 0.1,
      w: 0.25,
      h: 0.25 * 0.4 * 0.5,
      src: 'data:image/png;base64,AA==',
    });
    expect(result.current.api.tool).toBe('select');
  });

  it('places nothing with the Image tool until a picture has been chosen', () => {
    const result = setup('image');
    const { layer } = makeLayer();

    act(() => result.current.gestures.onPointerDown(pointer(layer, 20, 40)));

    expect(result.current.api.annotations).toEqual([]);
    expect(result.current.api.tool).toBe('image');
  });

  it('with Select, a click on the empty page drops the selection', () => {
    const result = setup('select');
    act(() => result.current.api.setSelectedId('something'));
    const { layer } = makeLayer();

    act(() => result.current.gestures.onPointerDown(pointer(layer, 20, 40)));

    expect(result.current.api.selectedId).toBeNull();
  });

  it('drags out a box in the pen colour, the right way round whichever way it was drawn', () => {
    const result = setup('rect');
    act(() => result.current.api.setColor('#1d4ed8'));
    const { layer } = makeLayer();

    act(() => result.current.gestures.onPointerDown(pointer(layer, 100, 200)));
    expect(layer.setPointerCapture).toHaveBeenCalledWith(7);
    act(() => result.current.gestures.onPointerMove(pointer(layer, 20, 40)));
    expect(result.current.gestures.preview).toMatchObject({
      kind: 'rect',
      x: 0.1,
      y: 0.1,
      w: 0.4,
      h: 0.4,
    });
    act(() => result.current.gestures.onPointerUp(pointer(layer, 20, 40)));

    expect(result.current.api.annotations[0]).toMatchObject({
      page: 1,
      kind: 'rect',
      x: 0.1,
      y: 0.1,
      w: 0.4,
      h: 0.4,
      color: '#1d4ed8',
    });
    expect(result.current.gestures.preview).toBeNull();
  });

  it.each(['highlight', 'whiteout'] as const)('drags out a %s', (tool) => {
    const result = setup(tool);
    const { layer } = makeLayer(false);

    drag(result, layer, [
      [0, 0],
      [100, 100],
    ]);

    const [annotation] = result.current.api.annotations;
    expect(annotation).toMatchObject({ kind: tool, x: 0, y: 0, w: 0.5, h: 0.25 });
    expect(annotation).not.toHaveProperty('color');
  });

  it('keeps every point of a stroke, clamped to the page', () => {
    const result = setup('draw');
    const { layer } = makeLayer();

    drag(result, layer, [
      [20, 40],
      [60, 80],
      [400, 800],
    ]);

    const stroke = result.current.api.annotations[0] as Extract<PdfAnnotation, { kind: 'draw' }>;
    expect(stroke.kind).toBe('draw');
    expect(stroke.points).toEqual([
      [0.1, 0.1],
      [0.3, 0.2],
      [1, 1],
    ]);
    expect(stroke).toMatchObject({ x: 0.1, y: 0.1, w: 0.9, h: 0.9, color: '#111827' });
  });

  it('draws nothing when a drag is too small to be one', () => {
    const result = setup('rect');
    const { layer } = makeLayer();

    drag(result, layer, [
      [20, 40],
      [20.5, 40.5],
    ]);

    expect(result.current.api.annotations).toEqual([]);
    expect(result.current.gestures.preview).toBeNull();
  });

  it('ignores moves and releases that are not part of a drag', () => {
    const result = setup('select');
    const { layer } = makeLayer();

    act(() => result.current.gestures.onPointerMove(pointer(layer, 20, 40)));
    act(() => result.current.gestures.onPointerUp(pointer(layer, 20, 40)));

    expect(result.current.gestures.preview).toBeNull();
    expect(result.current.api.annotations).toEqual([]);
  });

  it('with Select, picks up an annotation and moves it by the drag', () => {
    const result = setup('rect');
    const { layer, child } = makeLayer();
    drag(result, layer, [
      [20, 40],
      [60, 80],
    ]);
    act(() => result.current.api.setTool('select'));
    const placed = result.current.api.annotations[0];

    const down = pointer(child, 40, 60);
    act(() => result.current.gestures.onAnnotationDown(down, placed));
    expect(down.stopPropagation).toHaveBeenCalled();
    expect(result.current.api.selectedId).toBe(placed.id);
    act(() => result.current.gestures.onPointerUp(pointer(layer, 80, 100)));

    expect(result.current.api.annotations[0]).toMatchObject({
      x: expect.closeTo(0.3),
      y: expect.closeTo(0.2),
      w: expect.closeTo(0.2),
      h: expect.closeTo(0.1),
    });
  });

  it('keeps a moved annotation on the page', () => {
    const result = setup('rect');
    const { layer, child } = makeLayer(false);
    drag(result, layer, [
      [20, 40],
      [60, 80],
    ]);
    act(() => result.current.api.setTool('select'));
    const placed = result.current.api.annotations[0];

    act(() => result.current.gestures.onAnnotationDown(pointer(child, 20, 40), placed));
    act(() => result.current.gestures.onPointerUp(pointer(layer, 0, 0)));

    expect(result.current.api.annotations[0]).toMatchObject({ x: 0, y: 0 });
  });

  it('treats a press and release on the same spot as a selection, not a move', () => {
    const result = setup('rect');
    const { layer, child } = makeLayer();
    drag(result, layer, [
      [20, 40],
      [60, 80],
    ]);
    act(() => result.current.api.setTool('select'));
    const placed = result.current.api.annotations[0];
    const before = result.current.api.annotations;

    act(() => result.current.gestures.onAnnotationDown(pointer(child, 30, 50), placed));
    act(() => result.current.gestures.onPointerUp(pointer(layer, 30, 50)));

    expect(result.current.api.annotations).toBe(before);
    expect(result.current.api.selectedId).toBe(placed.id);
  });

  it('does not pick up an annotation with a drawing tool, or the text box being typed in', () => {
    const result = setup('rect');
    const { layer, child } = makeLayer();
    drag(result, layer, [
      [20, 40],
      [60, 80],
    ]);
    const placed = result.current.api.annotations[0];
    act(() => result.current.api.setSelectedId(null));

    const withTool = pointer(child, 40, 60);
    act(() => result.current.gestures.onAnnotationDown(withTool, placed));
    expect(withTool.stopPropagation).not.toHaveBeenCalled();

    act(() => {
      result.current.api.setTool('select');
      result.current.api.setEditingId(placed.id);
    });
    const whileTyping = pointer(child, 40, 60);
    act(() => result.current.gestures.onAnnotationDown(whileTyping, placed));
    expect(whileTyping.stopPropagation).not.toHaveBeenCalled();
    expect(result.current.api.selectedId).toBeNull();
  });
});
