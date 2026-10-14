import { act } from '@testing-library/react';
import { mount, props } from './flow-canvas-harness';

vi.mock('@xyflow/react', async (importOriginal) => {
  const { xyflowMock } = await import('./xyflow-mock');
  return xyflowMock(await importOriginal<object>());
});

describe('FlowCanvas wires', () => {
  it('refuses a wire from a node to itself', () => {
    mount();
    const link = { source: 'a', target: 'a', sourceHandle: 'next', targetHandle: null };
    expect(props().isValidConnection(link)).toBe(false);
    expect(props().isValidConnection({ ...link, target: 'b' })).toBe(true);
  });

  it('tracks selected wires and removes deleted ones from the graph', () => {
    const { onChange, edited } = mount();
    act(() => props().onEdgesChange([{ type: 'select', id: 'text-1--next', selected: true }]));
    expect(props().edges[0].selected).toBe(true);
    expect(onChange).not.toHaveBeenCalled();
    act(() => props().onEdgesChange([{ type: 'select', id: 'text-1--next', selected: false }]));
    expect(props().edges[0].selected).toBe(false);
    act(() => props().onEdgesChange([{ type: 'select', id: 'text-1--next', selected: true }]));
    act(() => props().onEdgesChange([{ type: 'remove', id: 'text-1--next' }]));
    expect(edited().edges).toEqual([]);
    expect(props().edges[0].selected).toBe(false);
  });

  it('ignores wire changes that are neither a selection nor a removal', () => {
    const { onChange } = mount();
    act(() =>
      props().onEdgesChange([{ type: 'add', item: { id: 'x', source: 'ai-1', target: 'text-1' } }]),
    );
    expect(onChange).not.toHaveBeenCalled();
    expect(props().edges.map((e) => e.selected)).toEqual([false]);
  });

  it('wires an output to a node, and ignores a link without an output', () => {
    const { onChange, edited } = mount();
    act(() =>
      props().onConnect({
        source: 'ai-1',
        sourceHandle: null,
        target: 'text-1',
        targetHandle: null,
      }),
    );
    expect(onChange).not.toHaveBeenCalled();
    act(() =>
      props().onConnect({
        source: 'ai-1',
        sourceHandle: 'help',
        target: 'text-1',
        targetHandle: null,
      }),
    );
    expect(edited().edges).toContainEqual({
      id: 'ai-1--help',
      source: 'ai-1',
      sourceHandle: 'help',
      target: 'text-1',
    });
  });
});
