import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { WaNode } from '@exyconn/wa-flow';
import { Inspector } from '../../../../../../src/admin/workflows/editor/panels/Inspector';
import { renderWithProviders } from '../../../../test-utils';
import { ENV, makeNode } from '../inspector/node-form-helpers';

function mount(node: WaNode, isStart = false) {
  const handlers = { onApply: vi.fn(), onSetStart: vi.fn(), onDelete: vi.fn(), onClose: vi.fn() };
  const user = userEvent.setup();
  const view = renderWithProviders(
    <Inspector node={node} isStart={isStart} env={ENV} {...handlers} />,
  );
  return { user, view, ...handlers };
}

describe('Inspector', () => {
  it("names the node and shows its type's own form", () => {
    mount(makeNode('text', { text: 'Hello there' }));
    const section = screen.getByRole('region', { name: 'Node inspector' });
    expect(section).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Text' })).toBeInTheDocument();
    expect(screen.getByText('text-1')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Message' })).toHaveValue('Hello there');
  });

  it('sets a node as the start, closes and deletes through its handlers', async () => {
    const { user, onSetStart, onDelete, onClose } = mount(makeNode('notice'));
    await user.click(screen.getByRole('button', { name: 'Set as start' }));
    await user.click(screen.getByRole('button', { name: 'Delete node' }));
    await user.click(screen.getByRole('button', { name: 'Close inspector' }));
    expect(onSetStart).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows the start node as such, with Set as start disabled', () => {
    mount(makeNode('notice'), true);
    expect(screen.getByRole('button', { name: 'Start node' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Set as start' })).toBeNull();
  });

  it('remounts the form when another node is selected', () => {
    const { view } = mount(makeNode('text', { text: 'First' }));
    view.rerender(
      <Inspector
        node={makeNode('text', { text: 'Second' }, 'text-2')}
        isStart={false}
        env={ENV}
        onApply={vi.fn()}
        onSetStart={vi.fn()}
        onDelete={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText('text-2')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Message' })).toHaveValue('Second');
  });
});
