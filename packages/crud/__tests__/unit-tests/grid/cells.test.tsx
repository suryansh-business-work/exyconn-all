import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ICellRendererParams } from 'ag-grid-community';
import SendIcon from '@mui/icons-material/Send';
import { BoolCell, RowActionsCell, StatusCell } from '../../../src/grid/cells';
import { DELETE_ACTION, EDIT_ACTION } from '../../../src/grid/columns';
import type { RowActionSpec } from '../../../src/grid/types';
import { renderWithProviders } from '../test-utils';

interface Row {
  id: string;
  sent: boolean;
}

const row: Row = { id: 'r1', sent: false };

const cellParams = (value: unknown) => ({ value }) as unknown as ICellRendererParams;

type ActionParams = Parameters<typeof RowActionsCell>[0];

const actionParams = (
  data: Row | undefined,
  actions: Record<string, (target: Row) => void>,
  actionSpecs: readonly RowActionSpec[],
) => ({ data, context: { actions }, actionSpecs }) as unknown as ActionParams;

describe('StatusCell', () => {
  it('renders the value as a status chip', () => {
    renderWithProviders(<StatusCell {...cellParams('OPEN')} />);
    expect(screen.getByText('OPEN')).toBeInTheDocument();
  });

  it('stringifies a non-string value', () => {
    renderWithProviders(<StatusCell {...cellParams(42)} />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders nothing for a null or undefined value', () => {
    const { container } = renderWithProviders(<StatusCell {...cellParams(null)} />);
    expect(container).toBeEmptyDOMElement();
    const second = renderWithProviders(<StatusCell {...cellParams(undefined)} />);
    expect(second.container).toBeEmptyDOMElement();
  });
});

describe('BoolCell', () => {
  it('renders Yes and No chips for booleans', () => {
    renderWithProviders(<BoolCell {...cellParams(true)} />);
    expect(screen.getByText('Yes')).toBeInTheDocument();
    renderWithProviders(<BoolCell {...cellParams(false)} />);
    expect(screen.getByText('No')).toBeInTheDocument();
  });

  it('renders nothing for a value that is not a boolean', () => {
    const { container } = renderWithProviders(<BoolCell {...cellParams('true')} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('RowActionsCell', () => {
  it('renders nothing while the row is still loading', () => {
    const { container } = renderWithProviders(
      <RowActionsCell {...actionParams(undefined, { edit: vi.fn() }, [EDIT_ACTION])} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders one labelled icon button per spec that has a handler', () => {
    renderWithProviders(
      <RowActionsCell
        {...actionParams(row, { edit: vi.fn(), delete: vi.fn() }, [EDIT_ACTION, DELETE_ACTION])}
      />,
    );
    const edit = screen.getByRole('button', { name: 'edit' });
    const remove = screen.getByRole('button', { name: 'delete' });
    expect(edit.querySelector('[data-testid="EditIcon"]')).not.toBeNull();
    expect(remove.querySelector('[data-testid="DeleteIcon"]')).not.toBeNull();
  });

  it('drops a button whose handler the page did not supply', () => {
    renderWithProviders(
      <RowActionsCell {...actionParams(row, { edit: vi.fn() }, [EDIT_ACTION, DELETE_ACTION])} />,
    );
    expect(screen.getByRole('button', { name: 'edit' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'delete' })).not.toBeInTheDocument();
  });

  it('hides an action for rows it cannot act on', () => {
    const send: RowActionSpec = {
      key: 'send',
      label: 'send contract',
      icon: SendIcon,
      color: 'primary',
      hidden: (target: never) => (target as Row).sent,
    };
    const handlers = { send: vi.fn() };
    const { unmount } = renderWithProviders(
      <RowActionsCell {...actionParams({ id: 'r2', sent: true }, handlers, [send])} />,
    );
    expect(screen.queryByRole('button', { name: 'send contract' })).not.toBeInTheDocument();
    unmount();
    renderWithProviders(<RowActionsCell {...actionParams(row, handlers, [send])} />);
    expect(screen.getByRole('button', { name: 'send contract' })).toBeInTheDocument();
  });

  it('runs the handler with the row without letting the click reach the grid row', async () => {
    const edit = vi.fn();
    const rowClick = vi.fn();
    renderWithProviders(
      // The wrapper stands in for ag-grid's row, whose click opens the record.
      <div role="presentation" onClick={rowClick}>
        <RowActionsCell {...actionParams(row, { edit }, [EDIT_ACTION])} />
      </div>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'edit' }));
    expect(edit).toHaveBeenCalledWith(row);
    expect(rowClick).not.toHaveBeenCalled();
  });
});
