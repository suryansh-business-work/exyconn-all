import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { WaGraph } from '@exyconn/wa-flow';
import {
  metaOf,
  useWorkflowEditor,
} from '../../../../../src/admin/workflows/editor/useWorkflowEditor';
import type { WorkflowRow } from '../../../../../src/admin/workflows/model/api';
import { SAMPLE_GRAPH, workflowRow } from '../../admin.fixtures';

function mount(workflow: WorkflowRow | null | undefined) {
  return renderHook(
    (props: { workflow: WorkflowRow | null | undefined }) => useWorkflowEditor(props.workflow),
    { initialProps: { workflow } },
  );
}

const EMPTY: WaGraph = { start: '', nodes: [], edges: [] };
const withoutEnd = (graph: WaGraph): WaGraph => ({
  ...graph,
  nodes: graph.nodes.slice(0, 1),
  edges: [],
});

describe('metaOf', () => {
  it("takes a row's details, with its own copy of the keywords", () => {
    const row = workflowRow({ keywords: ['book', 'visit'] });
    const meta = metaOf(row);
    expect(meta).toEqual({
      name: 'Book a visit',
      description: 'Books an appointment',
      keywords: ['book', 'visit'],
      order: 2,
    });
    expect(meta.keywords).not.toBe(row.keywords);
  });
});

describe('useWorkflowEditor', () => {
  it('holds an empty graph until the workflow loads', () => {
    const { result } = mount(undefined);
    expect(result.current).toMatchObject({
      graph: EMPTY,
      meta: null,
      dirty: false,
      selectedId: null,
    });
  });

  it("adopts the server's draft when it first loads", () => {
    const { result, rerender } = mount(null);
    rerender({ workflow: workflowRow() });
    expect(result.current.graph).toEqual(SAMPLE_GRAPH);
    expect(result.current.meta?.name).toBe('Book a visit');
    expect(result.current.dirty).toBe(false);
  });

  it('marks graph and detail edits unsaved', () => {
    const { result } = mount(workflowRow());
    act(() => result.current.update(withoutEnd));
    expect(result.current.graph.nodes.map((node) => node.id)).toEqual(['text-1']);
    expect(result.current.dirty).toBe(true);

    const { result: other } = mount(workflowRow());
    act(() => other.current.setMeta({ name: 'Renamed', description: '', keywords: [], order: 0 }));
    expect(other.current.meta?.name).toBe('Renamed');
    expect(other.current.dirty).toBe(true);
  });

  it('never overwrites unsaved edits with a newer server copy', () => {
    const { result, rerender } = mount(workflowRow());
    act(() => result.current.update(withoutEnd));
    rerender({ workflow: workflowRow({ updatedAt: '2026-10-02T00:00:00.000Z', name: 'Server' }) });
    expect(result.current.graph.nodes).toHaveLength(1);
    expect(result.current.meta?.name).toBe('Book a visit');
  });

  it('takes a newer server copy while nothing is unsaved, and ignores the same one', () => {
    const { result, rerender } = mount(workflowRow());
    rerender({ workflow: workflowRow({ name: 'Same revision' }) });
    expect(result.current.meta?.name).toBe('Book a visit');
    rerender({
      workflow: workflowRow({ updatedAt: '2026-10-03T00:00:00.000Z', name: 'Newer', draft: EMPTY }),
    });
    expect(result.current.meta?.name).toBe('Newer');
    expect(result.current.graph).toEqual(EMPTY);
  });

  it('adopts a saved copy as the new clean baseline', () => {
    const { result, rerender } = mount(workflowRow());
    act(() => result.current.update(withoutEnd));
    // The save's refetch has already brought the saved row by the time it is adopted.
    const saved = workflowRow({ updatedAt: '2026-10-04T00:00:00.000Z', name: 'Saved' });
    rerender({ workflow: saved });
    expect(result.current.dirty).toBe(true);
    act(() => result.current.adopt(saved));
    expect(result.current.dirty).toBe(false);
    expect(result.current.meta?.name).toBe('Saved');
    expect(result.current.graph).toEqual(SAMPLE_GRAPH);
  });

  it('remembers the selected node', () => {
    const { result } = mount(workflowRow());
    act(() => result.current.select('end-2'));
    expect(result.current.selectedId).toBe('end-2');
    act(() => result.current.select(null));
    expect(result.current.selectedId).toBeNull();
  });
});
