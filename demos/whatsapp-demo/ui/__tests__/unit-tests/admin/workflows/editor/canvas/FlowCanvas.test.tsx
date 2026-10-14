import type { DragEvent } from 'react';
import { act, screen } from '@testing-library/react';
import type { Theme } from '@exyconn/shell/components/ui';
import type { WaFlowNode } from '../../../../../../src/admin/workflows/editor/canvas/flow-nodes';
import { PALETTE_MIME } from '../../../../../../src/admin/workflows/editor/canvas/palette-drag';
import { GRAPH, mount, props } from './flow-canvas-harness';
import { flow } from './xyflow-mock';

vi.mock('@xyflow/react', async (importOriginal) => {
  const { xyflowMock } = await import('./xyflow-mock');
  return xyflowMock(await importOriginal<object>());
});

describe('FlowCanvas nodes', () => {
  it('hands React Flow the derived nodes, themed edges and editor settings', () => {
    mount();
    const theme = flow.theme as Theme;
    expect(screen.getByTestId('flow')).toBeInTheDocument();
    expect(props().nodes.map((n) => [n.id, n.selected])).toEqual([
      ['text-1', false],
      ['ai-1', true],
    ]);
    expect(props().edges[0]).toMatchObject({
      id: 'text-1--next',
      selected: false,
      style: { stroke: theme.palette.text.secondary, strokeWidth: 1.5 },
    });
    expect(props().deleteKeyCode).toEqual(['Backspace', 'Delete']);
    expect(props().colorMode).toBe(theme.palette.mode);
    const nodeColor = flow.nodeColor as (node: WaFlowNode) => string;
    expect(nodeColor(props().nodes[0])).toBe(theme.palette.primary.main);
    expect(nodeColor(props().nodes[1])).toBe(theme.palette.info.main);
  });

  it('removes deleted nodes from the graph and clears a removed selection', () => {
    const { onChange, onSelect, edited } = mount();
    act(() => props().onNodesChange([{ type: 'remove', id: 'ai-1' }]));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(edited()).toEqual({ start: 'text-1', nodes: [GRAPH.nodes[0]], edges: [] });
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it('stores a position once a drag ends, not while it runs', () => {
    const { onChange, edited } = mount();
    act(() =>
      props().onNodesChange([
        { type: 'position', id: 'text-1', position: { x: 40, y: 50 }, dragging: true },
      ]),
    );
    expect(onChange).not.toHaveBeenCalled();
    expect(props().nodes[0].position).toEqual({ x: 40, y: 50 });
    act(() =>
      props().onNodesChange([
        { type: 'position', id: 'text-1', position: { x: 80, y: 90 }, dragging: false },
      ]),
    );
    expect(edited().nodes[0].position).toEqual({ x: 80, y: 90 });
  });

  it('ignores a position change without a position', () => {
    const { onChange } = mount();
    act(() => props().onNodesChange([{ type: 'position', id: 'text-1' }]));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('lets a new pick win over the old selection being dropped', () => {
    const { onSelect } = mount();
    act(() =>
      props().onNodesChange([
        { type: 'select', id: 'ai-1', selected: false },
        { type: 'select', id: 'text-1', selected: true },
      ]),
    );
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('text-1');
  });

  it('leaves the selection alone when another node is deselected', () => {
    const { onSelect } = mount();
    act(() => props().onNodesChange([{ type: 'select', id: 'text-1', selected: false }]));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('adds a dropped palette type where it lands', () => {
    const { onChange, edited } = mount();
    const preventDefault = vi.fn();
    const drop = (type: string) =>
      ({
        dataTransfer: { getData: (mime: string) => (mime === PALETTE_MIME ? type : '') },
        clientX: 200,
        clientY: 100,
        preventDefault,
      }) as unknown as DragEvent;
    props().onDrop(drop(''));
    props().onDrop(drop('bogus'));
    expect(onChange).not.toHaveBeenCalled();
    expect(preventDefault).not.toHaveBeenCalled();
    props().onDrop(drop('notice'));
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(flow.toFlow).toHaveBeenCalledWith({ x: 200, y: 100 });
    expect(edited().nodes[2]).toMatchObject({
      id: 'notice-3',
      type: 'notice',
      position: { x: 100, y: 50 },
    });
  });

  it('accepts drags over the canvas', () => {
    mount();
    const preventDefault = vi.fn();
    props().onDragOver({ preventDefault } as unknown as DragEvent);
    expect(preventDefault).toHaveBeenCalled();
  });

  it('redraws when the graph changes', () => {
    const { rerender } = mount();
    rerender({ ...GRAPH, nodes: [GRAPH.nodes[0]], edges: [] });
    expect(props().nodes.map((n) => n.id)).toEqual(['text-1']);
    expect(props().edges).toEqual([]);
  });
});
