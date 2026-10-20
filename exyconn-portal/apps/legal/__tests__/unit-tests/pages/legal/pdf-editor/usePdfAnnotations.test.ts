import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import {
  newAnnotationId,
  usePdfAnnotations,
} from '../../../../../src/pages/legal/pdf-editor/usePdfAnnotations';
import type { PdfAnnotation } from '../../../../../src/pages/legal/pdf-editor/pdf-editor.types';

const box = (id: string): PdfAnnotation => ({
  id,
  page: 0,
  kind: 'rect',
  x: 0.1,
  y: 0.1,
  w: 0.2,
  h: 0.2,
  color: '#111827',
});

const setup = () => renderHook(() => usePdfAnnotations()).result;

describe('newAnnotationId', () => {
  it('hands out a different id every time', () => {
    expect(newAnnotationId()).not.toBe(newAnnotationId());
  });
});

describe('usePdfAnnotations', () => {
  it('starts empty, on Select, in black at 12 pt, with nothing to undo', () => {
    const api = setup().current;
    expect(api).toMatchObject({
      annotations: [],
      selectedId: null,
      tool: 'select',
      color: '#111827',
      fontSize: 12,
      stamp: null,
      editingId: null,
      canUndo: false,
    });
  });

  it('adds an annotation and selects it', () => {
    const result = setup();
    act(() => result.current.add(box('a')));

    expect(result.current.annotations).toEqual([box('a')]);
    expect(result.current.selectedId).toBe('a');
    expect(result.current.canUndo).toBe(true);
  });

  it('changes only the annotation it is asked to', () => {
    const result = setup();
    act(() => result.current.add(box('a')));
    act(() => result.current.add(box('b')));
    act(() => result.current.update('b', { x: 0.5 }));

    expect(result.current.annotations).toEqual([box('a'), { ...box('b'), x: 0.5 }]);
  });

  it('removes an annotation and clears the selection', () => {
    const result = setup();
    act(() => result.current.add(box('a')));
    act(() => result.current.add(box('b')));
    act(() => result.current.remove('a'));

    expect(result.current.annotations).toEqual([box('b')]);
    expect(result.current.selectedId).toBeNull();
  });

  it('undoes one step at a time, back to the empty page, and then does nothing', () => {
    const result = setup();
    act(() => result.current.add(box('a')));
    act(() => result.current.update('a', { y: 0.9 }));
    act(() => result.current.remove('a'));

    act(() => result.current.undo());
    expect(result.current.annotations).toEqual([{ ...box('a'), y: 0.9 }]);
    expect(result.current.selectedId).toBeNull();

    act(() => result.current.undo());
    expect(result.current.annotations).toEqual([box('a')]);

    act(() => result.current.undo());
    expect(result.current.annotations).toEqual([]);
    expect(result.current.canUndo).toBe(false);

    act(() => result.current.undo());
    expect(result.current.annotations).toEqual([]);
  });

  it('keeps the tool, pen, stamp and the box being typed in', () => {
    const result = setup();
    act(() => {
      result.current.setTool('draw');
      result.current.setColor('#b91c1c');
      result.current.setFontSize(24);
      result.current.setStamp({ src: 'data:image/png;base64,AA==', aspect: 0.5 });
      result.current.setEditingId('a');
      result.current.setSelectedId('a');
    });

    expect(result.current).toMatchObject({
      tool: 'draw',
      color: '#b91c1c',
      fontSize: 24,
      stamp: { src: 'data:image/png;base64,AA==', aspect: 0.5 },
      editingId: 'a',
      selectedId: 'a',
    });
  });
});
