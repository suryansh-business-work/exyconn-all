import type { ComponentType } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BUG_COLUMNS, type PagedBugRow } from '../../../../src/pages/bugs/bugs-grid';
import { bugRow } from '../../fixtures';
import { actionSpecs, columnIds, formatCell, isActionHidden } from '../../helpers/grid-helpers';

/** The ticket column's own cell renderer. */
const TicketKeyCell = BUG_COLUMNS.find((column) => column.field === 'taskKey')
  ?.cellRenderer as ComponentType<{ data?: PagedBugRow }>;

describe('BUG_COLUMNS', () => {
  it('lists the bug register columns, with the actions last', () => {
    expect(columnIds(BUG_COLUMNS)).toEqual([
      'title',
      'projectName',
      'assigneeName',
      'severity',
      'status',
      'taskKey',
      'dueDate',
      'actions',
    ]);
  });

  it('shows the project, or a dash for a bug on no project', () => {
    expect(formatCell(BUG_COLUMNS, 'projectName', bugRow())).toBe('Website');
    expect(formatCell(BUG_COLUMNS, 'projectName', bugRow({ projectName: '' }))).toBe('—');
  });

  it('offers promote, edit and delete, in that order', () => {
    expect(actionSpecs(BUG_COLUMNS).map((spec) => spec.key)).toEqual(['promote', 'edit', 'delete']);
  });

  it('offers promote only until the bug is a ticket', () => {
    expect(isActionHidden(BUG_COLUMNS, 'promote', bugRow({ taskKey: '' }))).toBe(false);
    expect(isActionHidden(BUG_COLUMNS, 'promote', bugRow({ taskKey: 'WEB-7' }))).toBe(true);
  });
});

describe('ticket key cell', () => {
  it('shows the key of the ticket the bug became', () => {
    render(<TicketKeyCell data={bugRow({ taskKey: 'WEB-7' })} />);

    expect(screen.getByText('WEB-7')).toBeInTheDocument();
  });

  it('stays blank for a bug that is not a ticket yet, or a row still loading', () => {
    const { container, rerender } = render(<TicketKeyCell data={bugRow()} />);
    expect(container).toBeEmptyDOMElement();

    rerender(<TicketKeyCell />);
    expect(container).toBeEmptyDOMElement();
  });
});
