import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ICellRendererParams } from 'ag-grid-community';
import type { ComponentType } from 'react';
import { MaActionStatus } from '@exyconn/shell/graphql/generated';
import { ACTION_COLUMNS, MEETING_ACTION_COLUMNS } from '../../../src/actions/action-grid';
import { ActionSelectionContext } from '../../../src/actions/selection';
import type { ActionItemRow } from '../../../src/forms/action-item';
import { columnOf } from '../grid-helpers';
import { makeAction } from '../fixtures';

type Cell = ComponentType<ICellRendererParams<ActionItemRow>>;
const cellOf = (key: string) => columnOf(ACTION_COLUMNS, key).cellRenderer as Cell;
const params = (data: ActionItemRow | undefined, context: object = {}) =>
  ({ data, context }) as ICellRendererParams<ActionItemRow>;

describe('action grid columns', () => {
  it('names the meeting only on the checklist that spans meetings', () => {
    expect(ACTION_COLUMNS.some((column) => column.field === 'meetingTitle')).toBe(true);
    expect(MEETING_ACTION_COLUMNS.some((column) => column.field === 'meetingTitle')).toBe(false);
  });

  it('renders nothing in any cell while its row is still loading', () => {
    for (const key of ['select', 'done', 'assignedTo', 'dueDate']) {
      const Cell = cellOf(key);
      const { container, unmount } = render(<Cell {...params(undefined)} />);
      expect(container).toBeEmptyDOMElement();
      unmount();
    }
  });
});

describe('SelectCell', () => {
  it('ticks the row in the shared selection', async () => {
    const toggle = vi.fn();
    const Cell = cellOf('select');
    render(
      <ActionSelectionContext.Provider value={{ selected: new Set(['action-1']), toggle }}>
        <Cell {...params(makeAction())} />
      </ActionSelectionContext.Provider>,
    );
    const box = screen.getByRole('checkbox', { name: 'Select Send the proposal' });
    expect(box).toBeChecked();
    await userEvent.click(box);
    expect(toggle).toHaveBeenCalledWith('action-1');
  });

  it('is unticked, and stays so, outside a checklist', async () => {
    const Cell = cellOf('select');
    render(<Cell {...params(makeAction())} />);
    const box = screen.getByRole('checkbox');
    await userEvent.click(box);
    expect(box).not.toBeChecked();
  });
});

describe('DoneCell', () => {
  it('completes an open item and reopens a completed one', async () => {
    const toggleDone = vi.fn();
    const Cell = cellOf('done');
    const open = makeAction();
    const { rerender } = render(<Cell {...params(open, { actions: { toggleDone } })} />);
    await userEvent.click(
      screen.getByRole('checkbox', { name: 'Mark Send the proposal complete' }),
    );
    expect(toggleDone).toHaveBeenCalledWith(open);

    rerender(
      <Cell
        {...params(makeAction({ status: MaActionStatus.Completed }), { actions: { toggleDone } })}
      />,
    );
    expect(screen.getByRole('checkbox', { name: 'Reopen Send the proposal' })).toBeChecked();
  });
});

describe('OwnerCell and DueCell', () => {
  it('flags an unconfirmed AI suggestion and an overdue item', () => {
    const Owner = cellOf('assignedTo');
    const Due = cellOf('dueDate');
    const row = makeAction({ needsConfirmation: true, overdue: true });
    render(
      <>
        <Owner {...params(row)} />
        <Due {...params(row)} />
      </>,
    );
    expect(screen.getByText('Ravi')).toBeInTheDocument();
    expect(screen.getByText('Needs confirmation')).toBeInTheDocument();
    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });

  it('says unassigned, and falls back to the words said in the call or a dash for the date', () => {
    const Owner = cellOf('assignedTo');
    const Due = cellOf('dueDate');
    const { rerender } = render(
      <>
        <Owner {...params(makeAction({ assignedTo: null }))} />
        <Due {...params(makeAction({ dueDate: null, dueText: 'next Friday' }))} />
      </>,
    );
    expect(screen.getByText('Unassigned')).toBeInTheDocument();
    expect(screen.getByText('next Friday')).toBeInTheDocument();
    expect(screen.queryByText('Needs confirmation')).not.toBeInTheDocument();
    rerender(<Due {...params(makeAction({ dueDate: null, dueText: null }))} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
