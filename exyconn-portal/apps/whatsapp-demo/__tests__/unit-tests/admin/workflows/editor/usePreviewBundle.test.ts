import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { WaGraph } from '@exyconn/wa-flow';
import { usePreviewBundle } from '../../../../../src/admin/workflows/editor/usePreviewBundle';
import { SAMPLE_GRAPH, demoRow, workflowRow } from '../../admin.fixtures';

const PUBLISHED: WaGraph = { start: 'p', nodes: [], edges: [] };
const DRAFT: WaGraph = { start: 'd', nodes: [], edges: [] };

describe('usePreviewBundle', () => {
  it('has nothing to preview until the demo is known', () => {
    const { result } = renderHook(() =>
      usePreviewBundle(undefined, workflowRow(), [], SAMPLE_GRAPH, null),
    );
    expect(result.current).toBeNull();
  });

  it("runs this workflow's draft beside the demo's other published workflows, in menu order", () => {
    const own = workflowRow({ id: 'wf-1', key: 'book-visit', order: 2 });
    const siblings = [
      own,
      workflowRow({ id: 'wf-2', key: 'faq', name: 'FAQ', order: 1, published: PUBLISHED }),
      workflowRow({ id: 'wf-3', key: 'never-published', order: 0, published: null }),
      workflowRow({ id: 'wf-4', key: 'offers', name: 'Offers', order: 5, published: PUBLISHED }),
    ];
    const { result } = renderHook(() => usePreviewBundle(demoRow(), own, siblings, DRAFT, null));
    expect(result.current?.demo).toEqual({
      key: 'clinic',
      industry: 'Healthcare',
      business: { name: 'City Clinic' },
      greeting: 'Welcome',
      menuText: 'Pick one',
      menuButton: 'Menu',
      order: 1,
      active: true,
    });
    const workflows = result.current?.workflows ?? [];
    expect(workflows.map((def) => def.key)).toEqual(['faq', 'book-visit', 'offers']);
    expect(workflows[0].graph).toBe(PUBLISHED);
    expect(workflows[1].graph).toBe(DRAFT);
  });

  it('previews the unsaved details in place of the stored ones', () => {
    const own = workflowRow({ order: 2 });
    const sibling = workflowRow({ id: 'wf-2', key: 'faq', order: 1, published: PUBLISHED });
    const meta = { name: 'Renamed', description: 'New', keywords: ['hi'], order: 0 };
    const { result } = renderHook(() =>
      usePreviewBundle(demoRow(), own, [own, sibling], DRAFT, meta),
    );
    const workflows = result.current?.workflows ?? [];
    expect(workflows.map((def) => def.key)).toEqual(['book-visit', 'faq']);
    expect(workflows[0]).toEqual({ key: 'book-visit', ...meta, graph: DRAFT });
  });

  it('keeps the same bundle while nothing it is made of changes', () => {
    const own = workflowRow();
    const demo = demoRow();
    const siblings = [own];
    const { result, rerender } = renderHook(() =>
      usePreviewBundle(demo, own, siblings, DRAFT, null),
    );
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});
