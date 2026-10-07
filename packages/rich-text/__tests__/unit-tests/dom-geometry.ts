import { afterEach, beforeEach } from 'vitest';

/**
 * jsdom does no layout, so `Range` has no client rects. ProseMirror measures the caret to
 * scroll it into view after edits made with `.focus()` on a mounted editor; give it an empty
 * box for the duration of each test.
 */
export function stubRangeGeometry(): void {
  const proto = Range.prototype as Partial<Pick<Range, 'getClientRects' | 'getBoundingClientRect'>>;
  beforeEach(() => {
    proto.getClientRects = () => [] as unknown as DOMRectList;
    proto.getBoundingClientRect = () => new DOMRect();
  });
  afterEach(() => {
    delete proto.getClientRects;
    delete proto.getBoundingClientRect;
  });
}
