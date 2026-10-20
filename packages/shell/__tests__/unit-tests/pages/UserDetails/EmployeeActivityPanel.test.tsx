import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AuditLogRow } from '@/components/audit';
import type { ServerDataGridProps } from '@/components/data/ServerDataGrid.impl';
import { EmployeeActivityPanel } from '@/pages/UserDetails/EmployeeActivityPanel';
import { ACTIVITY_COLUMNS, ACTIVITY_LIST } from '@/pages/UserDetails/employee-activity';
import { renderWithProviders } from '../../test-utils';
import { makeActivity } from './activityFixture';

const grid = vi.hoisted(() => ({ props: null as null | ServerDataGridProps<AuditLogRow> }));

// ag-grid does not lay out under jsdom; the stand-in records what the panel hands it and
// offers one row to click, which is all the panel does with the grid.
vi.mock('@/components/data/ServerDataGrid', () => ({
  ServerDataGrid: (props: ServerDataGridProps<AuditLogRow>) => {
    grid.props = props;
    return (
      <button type="button" onClick={() => props.onRowClick?.(makeActivity())}>
        open row
      </button>
    );
  },
}));

describe('EmployeeActivityPanel', () => {
  it("lists the person's activity through the server-paged grid", () => {
    renderWithProviders(<EmployeeActivityPanel employeeId="emp-1" />);

    expect(screen.getByRole('heading', { name: 'Activity' })).toBeInTheDocument();
    expect(grid.props?.columnDefs).toBe(ACTIVITY_COLUMNS);
    expect(grid.props?.fetchRows.list).toBe(ACTIVITY_LIST);
    expect(grid.props?.fetchRows.variablesFor?.({ page: 0, pageSize: 10 })).toEqual({
      userId: 'emp-1',
      input: { page: 0, pageSize: 10 },
    });
    const context = grid.props?.context as { formatDateTime: (value: string) => string };
    expect(context.formatDateTime('2026-10-20T09:30:00.000Z')).toMatch(/2026/);
  });

  it('opens the details of an entry, and closes them', async () => {
    const user = userEvent.setup();
    renderWithProviders(<EmployeeActivityPanel employeeId="emp-1" />);

    await user.click(screen.getByRole('button', { name: 'open row' }));
    expect(await screen.findByRole('heading', { name: 'Activity details' })).toBeInTheDocument();
    expect(screen.getByText('Edited the notes of Weekly sync')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('heading', { name: 'Activity details' })).not.toBeInTheDocument();
  });
});
