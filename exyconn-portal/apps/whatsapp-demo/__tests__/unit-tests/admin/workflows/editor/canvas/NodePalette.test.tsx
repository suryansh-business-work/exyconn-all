import { createEvent, fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NODE_TYPES } from '@exyconn/wa-flow';
import { NodePalette } from '../../../../../../src/admin/workflows/editor/canvas/NodePalette';
import { NODE_GROUPS } from '../../../../../../src/admin/workflows/model/node-meta';
import { PALETTE_MIME } from '../../../../../../src/admin/workflows/editor/canvas/palette-drag';
import { renderWithProviders } from '../../../../test-utils';

describe('NodePalette', () => {
  it('lists every node type under its group heading', () => {
    renderWithProviders(<NodePalette onAdd={vi.fn()} />);
    const palette = screen.getByRole('list', { name: 'Add a node' });
    for (const group of NODE_GROUPS) {
      expect(within(palette).getByText(group)).toBeInTheDocument();
    }
    expect(within(palette).getAllByRole('button')).toHaveLength(NODE_TYPES.length);
    expect(screen.getByText('A plain message')).toBeInTheDocument();
  });

  it('adds a node of the clicked type', async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<NodePalette onAdd={onAdd} />);
    await user.click(screen.getByRole('button', { name: /A plain message/ }));
    expect(onAdd).toHaveBeenCalledWith('text');
  });

  it('carries the node type on a drag, as a copy', () => {
    renderWithProviders(<NodePalette onAdd={vi.fn()} />);
    const item = screen.getByRole('button', { name: /A centred system notice/ });
    expect(item).toHaveAttribute('draggable', 'true');
    const dataTransfer = { setData: vi.fn(), effectAllowed: 'none' };
    const event = createEvent.dragStart(item);
    Object.defineProperty(event, 'dataTransfer', { value: dataTransfer });
    fireEvent(item, event);
    expect(dataTransfer.setData).toHaveBeenCalledWith(PALETTE_MIME, 'notice');
    expect(dataTransfer.effectAllowed).toBe('copy');
  });

  it('translates group names, labels and hints', () => {
    renderWithProviders(<NodePalette onAdd={vi.fn()} />, {
      messages: { Messages: 'Nachrichten', 'A plain message': 'Eine Nachricht' },
    });
    expect(screen.getByText('Nachrichten')).toBeInTheDocument();
    expect(screen.getByText('Eine Nachricht')).toBeInTheDocument();
  });
});
