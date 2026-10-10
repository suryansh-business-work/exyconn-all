import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { autoLayout, type WaGraph, type WaNode } from '@exyconn/wa-flow';
import { useEditorCommands } from '../../../../../src/admin/workflows/editor/useEditorCommands';
import type { WorkflowEditor } from '../../../../../src/admin/workflows/editor/useWorkflowEditor';
import { renderHookWithProviders } from '../../../test-utils';
import { SAMPLE_GRAPH } from '../../admin.fixtures';
import { answer, fakeEditor } from './workflow-actions.helpers';

const flow = vi.hoisted(() => ({
  screenToFlowPosition: vi.fn((point: { x: number; y: number }) => ({
    x: point.x - 100,
    y: point.y - 50,
  })),
  fitView: vi.fn(),
}));

vi.mock('@xyflow/react', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useReactFlow: () => flow,
}));

const consoleError = vi.spyOn(console, 'error');

function canvasAt(box: { left: number; top: number; width: number; height: number } | null) {
  if (!box) {
    return { current: null };
  }
  const element = document.createElement('div');
  element.getBoundingClientRect = () => ({ ...box, x: box.left, y: box.top }) as DOMRect;
  return { current: element };
}

function mount(editor: WorkflowEditor, canvas = canvasAt(null)) {
  return renderHookWithProviders(() => useEditorCommands(editor, ['book-visit'], canvas));
}

/** Applies the edit the editor was last handed to a graph. */
function lastEdit(editor: WorkflowEditor, graph: WaGraph = SAMPLE_GRAPH): WaGraph {
  const calls = vi.mocked(editor.update).mock.calls;
  return calls.at(-1)![0](graph);
}

beforeEach(() => {
  flow.fitView.mockReset().mockResolvedValue(true);
  flow.screenToFlowPosition.mockClear();
  consoleError.mockImplementation(() => undefined);
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    callback(0);
    return 1;
  });
});
afterEach(() => {
  consoleError.mockReset();
  vi.unstubAllGlobals();
});

describe('useEditorCommands — add, focus, tidy', () => {
  it('adds a node where the author is looking and selects it', () => {
    const editor = fakeEditor({ graph: SAMPLE_GRAPH });
    const { result } = mount(editor, canvasAt({ left: 100, top: 50, width: 400, height: 300 }));
    act(() => result.current.add('text'));
    expect(flow.screenToFlowPosition).toHaveBeenCalledWith({ x: 300, y: 200 });
    const added = lastEdit(editor).nodes.find((node) => node.id === 'text-3');
    expect(added?.position).toEqual({ x: 200, y: 150 });
    expect(editor.select).toHaveBeenCalledWith('text-3');
  });

  it('adds at the origin before the canvas is on screen', () => {
    const editor = fakeEditor({ graph: { start: '', nodes: [], edges: [] } });
    const { result } = mount(editor);
    act(() => result.current.add('end'));
    expect(flow.screenToFlowPosition).not.toHaveBeenCalled();
    const graph = lastEdit(editor);
    expect(graph.nodes[0]).toMatchObject({ id: 'end-1', position: { x: 0, y: 0 } });
    expect(graph.start).toBe('end-1');
  });

  it('selects a node and brings it into view', () => {
    const editor = fakeEditor();
    const { result } = mount(editor);
    act(() => result.current.focus('end-2'));
    expect(editor.select).toHaveBeenCalledWith('end-2');
    expect(flow.fitView).toHaveBeenCalledWith({
      duration: 300,
      maxZoom: 1.2,
      nodes: [{ id: 'end-2' }],
    });
  });

  it('logs a node that could not be brought into view', async () => {
    const failure = new Error('No viewport');
    flow.fitView.mockRejectedValue(failure);
    const { result } = mount(fakeEditor());
    act(() => result.current.focus('end-2'));
    await waitFor(() =>
      expect(consoleError).toHaveBeenCalledWith('Could not bring the node into view', failure),
    );
  });

  it('tidies the layout, then fits the canvas', async () => {
    const editor = fakeEditor();
    const { result } = mount(editor);
    act(() => result.current.tidy());
    expect(editor.update).toHaveBeenCalledWith(autoLayout);
    expect(flow.fitView).toHaveBeenCalledWith({ duration: 300 });
  });

  it('logs a canvas that could not be fitted', async () => {
    const failure = new Error('Unmounted');
    flow.fitView.mockRejectedValue(failure);
    const { result } = mount(fakeEditor());
    act(() => result.current.tidy());
    await waitFor(() =>
      expect(consoleError).toHaveBeenCalledWith('Could not fit the canvas', failure),
    );
  });
});

describe('useEditorCommands — the inspector', () => {
  it('applies new data to the selected node and makes it the start', () => {
    const editor = fakeEditor({ selectedId: 'end-2' });
    const { result } = mount(editor);
    const data = { text: 'Bye' } as unknown as WaNode['data'];
    act(() => result.current.apply(data));
    expect(lastEdit(editor).nodes[1].data).toBe(data);
    act(() => result.current.makeStart());
    expect(lastEdit(editor).start).toBe('end-2');
  });

  it('does nothing to the graph while no node is selected', async () => {
    const editor = fakeEditor({ selectedId: null });
    const { result } = mount(editor);
    act(() => result.current.apply(SAMPLE_GRAPH.nodes[0].data));
    act(() => result.current.makeStart());
    await act(() => result.current.remove());
    expect(editor.update).not.toHaveBeenCalled();
  });

  it('deletes the selected node and its wires after asking', async () => {
    const user = userEvent.setup();
    const editor = fakeEditor({ selectedId: 'text-1' });
    const { result } = mount(editor);
    let pending: Promise<void> = Promise.resolve();
    act(() => {
      pending = result.current.remove();
    });
    const question = await answer(user, 'Delete');
    await act(() => pending);
    expect(question).toContain('Delete "text-1" and every wire to and from it?');
    const graph = lastEdit(editor);
    expect(graph.nodes.map((node) => node.id)).toEqual(['end-2']);
    expect(graph.edges).toEqual([]);
    expect(editor.select).toHaveBeenCalledWith(null);
  });

  it('keeps the node when the delete is cancelled', async () => {
    const user = userEvent.setup();
    const editor = fakeEditor({ selectedId: 'text-1' });
    const { result } = mount(editor);
    let pending: Promise<void> = Promise.resolve();
    act(() => {
      pending = result.current.remove();
    });
    await answer(user, 'Cancel');
    await act(() => pending);
    expect(editor.update).not.toHaveBeenCalled();
    expect(editor.select).not.toHaveBeenCalled();
  });
});
