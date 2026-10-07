import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import { ItIncidentStatus, ListItIncidentsPagedDocument } from '@exyconn/shell/graphql/generated';
import { IncidentsPage } from '../../../../src/pages/incidents';
import { IncidentForm } from '../../../../src/pages/incidents/forms/incident';
import { INCIDENT_COLUMNS } from '../../../../src/pages/incidents/incidents-grid';
import {
  crud,
  dashboardProps,
  fetchRows,
  fetcherCall,
  resetPage,
  resourceOptions,
  statPairs,
  statsOf,
} from '../../core/crud-page.mocks';
import { formatDate } from '../../core/settings.mock';
import { fill, press } from '../../core/form.helpers';
import { incidentRow } from '../../core/rows.fixtures';
import { renderWithProviders } from '../../test-utils';

const gql = vi.hoisted(() => ({
  stats: vi.fn(),
  remove: vi.fn(),
  lazy: vi.fn(),
  reload: vi.fn(),
  addUpdate: vi.fn(),
  refetch: vi.fn(),
}));

vi.mock('@exyconn/crud', async () => (await import('../../core/crud-page.mocks')).crudModuleMock());
vi.mock('@exyconn/shell/hooks/useSettings', async () =>
  (await import('../../core/settings.mock')).settingsModuleMock(),
);
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListItIncidentsStatsQuery: gql.stats,
  useDeleteItIncidentMutation: () => [gql.remove],
  useGetItIncidentLazyQuery: gql.lazy,
  useAddItIncidentUpdateMutation: () => [gql.addUpdate],
}));

const row = incidentRow();
const heading = (name: string) => screen.queryByRole('heading', { name });

function openTimeline() {
  act(() => {
    dashboardProps().onRowClick?.(row);
  });
}

async function postUpdate() {
  fill('What happened', 'Tunnel restarted');
  await press('Post update');
}

describe('IncidentsPage', () => {
  beforeEach(() => {
    resetPage();
    Object.values(gql).forEach((fn) => fn.mockReset());
    gql.stats.mockReturnValue({ data: undefined, loading: true, refetch: gql.refetch });
    gql.lazy.mockReturnValue([gql.reload]);
    gql.addUpdate.mockResolvedValue({ data: {} });
  });

  it('frames the incident register and reads incidents fresh when refreshing one', () => {
    renderWithProviders(<IncidentsPage />);
    expect(dashboardProps()).toMatchObject({
      title: 'Incident Management',
      entityLabel: 'incident',
      exportFileName: 'incidents',
      permissionModule: 'ItIncident',
      columnDefs: INCIDENT_COLUMNS,
      fetchRows,
      crud,
      searchPlaceholder: 'Search by title, impact, commander or root cause…',
    });
    expect(dashboardProps().context.formatDate).toBe(formatDate);
    expect(gql.lazy).toHaveBeenCalledWith({ fetchPolicy: 'network-only' });
    const paged = { rows: [row], totalCount: 1 };
    expect(fetcherCall().document).toBe(ListItIncidentsPagedDocument);
    expect(fetcherCall().select({ listItIncidentsPaged: paged })).toBe(paged);
    const form = dashboardProps().renderForm?.(row);
    expect(form?.type).toBe(IncidentForm);
    expect(form?.props).toEqual({ initial: row, onCancel: crud.close, onDone: crud.onDone });
  });

  it('counts open incidents as everything not resolved or closed', () => {
    gql.stats.mockReturnValue({
      data: {
        listItIncidentsStats: statsOf(10, {
          status: { RESOLVED: 3, CLOSED: 2 },
          severity: { SEV1: 1 },
          category: { OUTAGE: 4 },
        }),
      },
      loading: false,
      refetch: gql.refetch,
    });
    renderWithProviders(<IncidentsPage />);
    expect(dashboardProps().statsLoading).toBe(false);
    expect(statPairs()).toEqual([
      ['Incidents', '10'],
      ['Open', '5'],
      ['SEV1', '1'],
      ['Outages', '4'],
    ]);
  });

  it('deletes by id after confirming by title, then reloads its stats', async () => {
    gql.remove.mockResolvedValue({ data: {} });
    renderWithProviders(<IncidentsPage />);
    const options = resourceOptions();
    expect(options.label).toBe('Incident');
    expect(options.refetch).toBe(gql.refetch);
    expect(options.confirmMessage(row)).toEqual({
      message: 'Delete incident "{title}"?',
      values: { title: 'VPN down' },
    });
    await options.onDelete(row);
    expect(gql.remove).toHaveBeenCalledWith({ variables: { id: 'inc-1' } });
  });

  it('opens the timeline from a row or its action, and closes it', async () => {
    renderWithProviders(<IncidentsPage />);
    expect(heading('VPN down')).not.toBeInTheDocument();
    openTimeline();
    expect(heading('VPN down')).toBeInTheDocument();
    await press('Close');
    await waitFor(() => expect(heading('VPN down')).not.toBeInTheDocument());

    act(() => {
      dashboardProps().context.actions.timeline(row);
    });
    expect(heading('VPN down')).toBeInTheDocument();
  });

  it('shows the fresh timeline after an update and reloads the grid', async () => {
    const fresh = incidentRow({ title: 'VPN restored', status: ItIncidentStatus.Monitoring });
    gql.reload.mockResolvedValue({ data: { getItIncident: fresh } });
    renderWithProviders(<IncidentsPage />);
    openTimeline();
    await postUpdate();

    expect(await screen.findByRole('heading', { name: 'VPN restored' })).toBeInTheDocument();
    expect(gql.reload).toHaveBeenCalledWith({ variables: { id: 'inc-1' } });
    expect(crud.reload).toHaveBeenCalledTimes(1);
  });

  it('closes the timeline when the incident no longer exists', async () => {
    gql.reload.mockResolvedValue({ data: undefined });
    renderWithProviders(<IncidentsPage />);
    openTimeline();
    await postUpdate();

    await waitFor(() => expect(heading('VPN down')).not.toBeInTheDocument());
    expect(crud.reload).toHaveBeenCalledTimes(1);
  });

  it('logs, rather than throws, when the incident cannot be re-read', async () => {
    const failure = new Error('offline');
    gql.reload.mockRejectedValue(failure);
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    renderWithProviders(<IncidentsPage />);
    openTimeline();
    await postUpdate();

    await waitFor(() =>
      expect(logged).toHaveBeenCalledWith('Could not refresh the incident', failure),
    );
    expect(crud.reload).not.toHaveBeenCalled();
    logged.mockRestore();
  });

  it('only reloads the grid when a change arrives with no incident open', () => {
    renderWithProviders(<IncidentsPage />);
    act(() => {
      (dashboardProps().extraDialogs?.props.onChanged as () => void)();
    });
    expect(gql.reload).not.toHaveBeenCalled();
    expect(crud.reload).toHaveBeenCalledTimes(1);
  });
});
