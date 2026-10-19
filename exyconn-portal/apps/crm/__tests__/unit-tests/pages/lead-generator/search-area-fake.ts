import { vi } from 'vitest';
import type { SearchArea } from '../../../../src/pages/lead-generator/useSearchArea';

interface Point {
  lat: number;
  lng: number;
}

/** `count` distinct corners, one degree apart. */
export const corners = (count: number): Point[] =>
  Array.from({ length: count }, (_, i) => ({ lat: 12 + i, lng: 77 + i }));

/** A drawn search area with spy actions; `finished`/`area` follow the points as the hook does. */
export function fakeArea(overrides: Partial<SearchArea> = {}): SearchArea {
  const points = overrides.points ?? [];
  const drawing = overrides.drawing ?? false;
  const finished = !drawing && points.length >= 3;
  return {
    points,
    drawing,
    finished,
    area: finished ? points : [],
    start: vi.fn(),
    addPoint: vi.fn(),
    undo: vi.fn(),
    finish: vi.fn(),
    clear: vi.fn(),
    edit: vi.fn(),
    ...overrides,
  };
}
