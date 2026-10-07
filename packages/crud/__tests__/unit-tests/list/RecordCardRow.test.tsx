import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SendIcon from '@mui/icons-material/Send';
import { DELETE_ACTION, EDIT_ACTION, statusColumn, textColumn } from '../../../src/grid/columns';
import type { RowActionSpec } from '../../../src/grid/types';
import { RecordCardRow } from '../../../src/list/RecordCardRow';
import { renderWithProviders } from '../test-utils';

interface Row {
  id: string;
  reference: string;
  owner: string;
  status: string;
  sent: boolean;
}

const row: Row = { id: 'r1', reference: 'NC-0001', owner: 'Asha', status: 'OPEN', sent: true };

const columns = [
  textColumn<Row>('reference', 'Ref'),
  textColumn<Row>('owner', 'Owner'),
  statusColumn<Row>('status', 'Status'),
];

const t = (source: string) => source;

const SEND: RowActionSpec = {
  key: 'send',
  label: 'send contract',
  icon: SendIcon,
  hidden: (target: never) => (target as Row).sent,
};

describe('RecordCardRow', () => {
  it('shows the heading and the facts, a status column as a chip', () => {
    renderWithProviders(
      <RecordCardRow row={row} columnDefs={columns} context={{ t }} actionSpecs={[EDIT_ACTION]} />,
    );
    // Without a click handler the heading is plain text, and without handlers no actions show.
    expect(screen.getByText('NC-0001')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('Owner')).toBeInTheDocument();
    expect(screen.getByText('Asha')).toBeInTheDocument();
    expect(screen.getByText('OPEN').closest('.MuiChip-root')).not.toBeNull();
    expect(screen.getByText('Asha').closest('.MuiChip-root')).toBeNull();
  });

  it('makes the heading the button that opens the record', async () => {
    const onClick = vi.fn();
    renderWithProviders(
      <RecordCardRow
        row={row}
        index={3}
        columnDefs={columns}
        context={{ t }}
        actionSpecs={[]}
        onClick={onClick}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'NC-0001' }));
    expect(onClick).toHaveBeenCalledWith(row);
  });

  it('runs a row action without also opening the record', async () => {
    const onClick = vi.fn();
    const edit = vi.fn();
    const remove = vi.fn();
    renderWithProviders(
      <RecordCardRow
        row={row}
        columnDefs={columns}
        context={{ t, actions: { edit, delete: remove } }}
        actionSpecs={[EDIT_ACTION, DELETE_ACTION]}
        onClick={onClick}
      />,
    );
    const editButton = screen.getByRole('button', { name: 'edit' });
    expect(editButton.querySelector('[data-testid="EditIcon"]')).not.toBeNull();
    await userEvent.click(editButton);
    await userEvent.click(screen.getByRole('button', { name: 'delete' }));
    expect(edit).toHaveBeenCalledWith(row);
    expect(remove).toHaveBeenCalledWith(row);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('leaves out actions with no handler, or hidden for this row', () => {
    renderWithProviders(
      <RecordCardRow
        row={row}
        columnDefs={columns}
        context={{ t, actions: { edit: vi.fn(), send: vi.fn() } }}
        actionSpecs={[EDIT_ACTION, DELETE_ACTION, SEND]}
      />,
    );
    expect(screen.getByRole('button', { name: 'edit' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'delete' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'send contract' })).not.toBeInTheDocument();
  });

  it('shows an action that is not hidden for this row', () => {
    renderWithProviders(
      <RecordCardRow
        row={{ ...row, sent: false }}
        columnDefs={columns}
        context={{ t, actions: { send: vi.fn() } }}
        actionSpecs={[SEND]}
      />,
    );
    expect(screen.getByRole('button', { name: 'send contract' })).toBeInTheDocument();
  });
});
