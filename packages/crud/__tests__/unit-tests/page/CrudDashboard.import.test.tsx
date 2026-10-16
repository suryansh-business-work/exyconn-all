import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CrudDashboard } from '../../../src/page/CrudDashboard';
import { renderWithProviders } from '../test-utils';
import {
  crudResource,
  fetchLeads,
  gridProps,
  leadColumns,
  stats,
  type Lead,
} from './dashboardFixtures';

vi.mock('@exyconn/shell/components/data/ServerDataGrid', async () => ({
  ServerDataGrid: (await import('./dashboardFixtures')).GridStub,
}));
// The transfer bar has its own tests; here it only reports that an import wrote rows.
vi.mock('../../../src/page/CrudTransferBar', () => ({
  CrudTransferBar: ({ onImported }: Readonly<{ onImported: () => void }>) => (
    <button type="button" onClick={onImported}>
      rows imported
    </button>
  ),
}));

type DashboardProps = Parameters<typeof CrudDashboard<Lead, Lead>>[0];

const renderDashboard = (props: Partial<DashboardProps> = {}) =>
  renderWithProviders(
    <CrudDashboard<Lead, Lead>
      title="Leads"
      subtitle="Every lead"
      entityLabel="lead"
      stats={stats}
      columnDefs={leadColumns}
      fetchRows={fetchLeads()}
      context={{}}
      searchPlaceholder="Search leads"
      {...props}
    />,
  );

const imported = () => userEvent.click(screen.getByRole('button', { name: 'rows imported' }));

describe('CrudDashboard after an import', () => {
  it('reloads through the resource when there is one', async () => {
    const crud = crudResource();
    renderDashboard({ crud });
    await imported();

    expect(crud.reload).toHaveBeenCalledTimes(1);
    expect(gridProps.current?.refreshSignal).toBe(5);
  });

  it('re-reads the grid itself when there is no resource', async () => {
    renderDashboard({ refreshSignal: 2 });
    expect(gridProps.current?.refreshSignal).toBe(2);

    await imported();
    expect(gridProps.current?.refreshSignal).toBe(3);
    await imported();
    expect(gridProps.current?.refreshSignal).toBe(4);
  });

  it('counts from zero when the page passes no refresh signal', async () => {
    renderDashboard();
    expect(gridProps.current?.refreshSignal).toBe(0);
    await imported();
    expect(gridProps.current?.refreshSignal).toBe(1);
  });
});
