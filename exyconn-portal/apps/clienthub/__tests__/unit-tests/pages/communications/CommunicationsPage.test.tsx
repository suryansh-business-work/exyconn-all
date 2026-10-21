import { describe, expect, it, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import { CommunicationsPage } from '../../../../src/pages/communications/CommunicationsPage';
import { HUB_COMMUNICATION_COLUMNS } from '../../../../src/pages/communications/communications-grid';
import { renderWithProviders } from '../../test-utils';
import { dashboardProps } from '../../crud-dashboard-stub';
import { hubEntry } from '../hub-records.fixtures';

const crud = vi.hoisted(() => ({
  select: null as null | ((data: unknown) => unknown),
  fetchRows: vi.fn(),
}));

vi.mock('@exyconn/crud', async (importOriginal) => {
  const { CrudDashboardStub } = await import('../../crud-dashboard-stub');
  return {
    ...(await importOriginal<Record<string, unknown>>()),
    CrudDashboard: CrudDashboardStub,
    usePagedFetcher: (_document: unknown, select: (data: unknown) => unknown) => {
      crud.select = select;
      return crud.fetchRows;
    },
  };
});

describe('CommunicationsPage', () => {
  it('reads the hub’s own log and shows each entry with its date and time', () => {
    renderWithProviders(<CommunicationsPage />);
    const props = dashboardProps();
    const page = { rows: [hubEntry()], totalCount: 1 };

    expect(props.title).toBe('Communication log');
    expect(crud.select?.({ clientHubCommunications: page })).toBe(page);
    const when = HUB_COMMUNICATION_COLUMNS[0].valueFormatter as (params: object) => string;
    const context = props.context as unknown as { formatDateTime: (value: string) => string };
    expect(when({ data: hubEntry(), context })).toBe(
      context.formatDateTime('2026-10-02T10:30:00.000Z'),
    );
    expect(when({ data: undefined, context })).toBe('');
  });

  it('opens an entry in full from its row and closes it', () => {
    renderWithProviders(<CommunicationsPage />);
    act(() => dashboardProps().onRowClick?.(hubEntry() as never));

    expect(screen.getByText('Ship phase two in November')).toBeInTheDocument();
    expect(screen.getByText('With Dana, Arjun')).toBeInTheDocument();
    expect(screen.getByText('Logged by Arjun')).toBeInTheDocument();
    act(() => screen.getByRole('button', { name: 'Close' }).click());
  });

  it('leaves out the parts an entry does not have', () => {
    renderWithProviders(<CommunicationsPage />);
    act(() =>
      dashboardProps().context.actions.open(
        hubEntry({ participants: '', summary: '', details: '' }) as never,
      ),
    );

    expect(screen.queryByText(/^With /)).toBeNull();
    expect(screen.getByText('Quarterly review')).toBeInTheDocument();
  });
});
