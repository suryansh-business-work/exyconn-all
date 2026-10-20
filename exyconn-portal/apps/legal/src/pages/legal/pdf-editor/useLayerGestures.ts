import { useState, type PointerEvent } from 'react';
import { newAnnotationId, type PdfAnnotationsApi } from './usePdfAnnotations';
import type { PdfAnnotation } from './pdf-editor.types';

type Point = [number, number];

interface Draft {
  kind: 'rect' | 'highlight' | 'whiteout' | 'draw';
  start: Point;
  end: Point;
  points: Point[];
}

interface Move {
  id: string;
  start: Point;
  origin: Point;
}

/** Below this, a drag was a click: nothing is drawn. */
const MIN_SIZE = 0.005;

const clamp = (value: number) => Math.min(1, Math.max(0, value));

/** Where the pointer is on the page, as fractions of it. */
function pointOf(event: PointerEvent<HTMLElement>, layer: HTMLElement): Point {
  const box = layer.getBoundingClientRect();
  return [
    clamp((event.clientX - box.left) / box.width),
    clamp((event.clientY - box.top) / box.height),
  ];
}

function boxOf([x1, y1]: Point, [x2, y2]: Point) {
  return { x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1) };
}

/**
 * The pointer on one page: a click places text or a picture, a drag draws a box or a stroke,
 * and with Select a drag moves whatever it started on.
 */
export function useLayerGestures(api: PdfAnnotationsApi, page: number, pageAspect: number) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [move, setMove] = useState<Move | null>(null);

  const place = (point: Point) => {
    const [x, y] = point;
    if (api.tool === 'text') {
      const id = newAnnotationId();
      api.add({
        id,
        page,
        kind: 'text',
        x,
        y,
        w: 0.4,
        h: 0.04,
        text: '',
        fontSize: api.fontSize,
        color: api.color,
      });
      api.setEditingId(id);
      return;
    }
    if (api.stamp) {
      const w = 0.25;
      api.add({
        id: newAnnotationId(),
        page,
        kind: 'image',
        x,
        y,
        w,
        h: w * api.stamp.aspect * pageAspect,
        src: api.stamp.src,
      });
      api.setTool('select');
    }
  };

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    const point = pointOf(event, event.currentTarget);
    const { tool } = api;
    if (tool === 'rect' || tool === 'highlight' || tool === 'whiteout' || tool === 'draw') {
      event.currentTarget.setPointerCapture?.(event.pointerId);
      setDraft({ kind: tool, start: point, end: point, points: [point] });
      return;
    }
    if (tool === 'select') {
      api.setSelectedId(null);
      return;
    }
    place(point);
  };

  /** Pressing on an annotation with Select picks it up to move. */
  const onAnnotationDown = (event: PointerEvent<HTMLElement>, annotation: PdfAnnotation) => {
    if (api.tool !== 'select' || api.editingId === annotation.id) {
      return;
    }
    event.stopPropagation();
    const layer = event.currentTarget.parentElement as HTMLElement;
    layer.setPointerCapture?.(event.pointerId);
    api.setSelectedId(annotation.id);
    setMove({
      id: annotation.id,
      start: pointOf(event, layer),
      origin: [annotation.x, annotation.y],
    });
  };

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    if (draft) {
      const point = pointOf(event, event.currentTarget);
      setDraft({ ...draft, end: point, points: [...draft.points, point] });
    }
  };

  const onPointerUp = (event: PointerEvent<HTMLElement>) => {
    if (move) {
      const [px, py] = pointOf(event, event.currentTarget);
      const [dx, dy] = [px - move.start[0], py - move.start[1]];
      if (Math.abs(dx) + Math.abs(dy) > MIN_SIZE) {
        api.update(move.id, { x: clamp(move.origin[0] + dx), y: clamp(move.origin[1] + dy) });
      }
      setMove(null);
      return;
    }
    if (!draft) {
      return;
    }
    const box = boxOf(draft.start, draft.end);
    setDraft(null);
    if (box.w < MIN_SIZE && box.h < MIN_SIZE) {
      return;
    }
    const base = { id: newAnnotationId(), page, ...box };
    if (draft.kind === 'draw') {
      api.add({ ...base, kind: 'draw', points: draft.points, color: api.color });
    } else if (draft.kind === 'rect') {
      api.add({ ...base, kind: 'rect', color: api.color });
    } else {
      api.add({ ...base, kind: draft.kind });
    }
  };

  const preview = draft
    ? { kind: draft.kind, ...boxOf(draft.start, draft.end), points: draft.points }
    : null;
  return { onPointerDown, onPointerMove, onPointerUp, onAnnotationDown, preview };
}
