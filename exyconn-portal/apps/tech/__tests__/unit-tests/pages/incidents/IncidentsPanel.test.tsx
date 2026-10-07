import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import {
  IncidentUpdateStatus,
  ListStatusIncidentsPagedDocument,
} from '@exyconn/shell/graphql/generated';
import { IncidentsPanel } from '../../../../src/pages/incidents/IncidentsPanel';
import { IncidentForm } from '../../../../src/pages/incidents/forms/incident';
import { INCIDENT_COLUMNS } from '../../../../src/pages/incidents/incidents-grid';
import { renderWithProviders } from '../../test-utils';
import { fill, press } from '../environment-variables/forms/form.helpers';
import {
  crud,
  dashboardProps,
  fetchRows,
  fetcherCall,
  formatDate,
  resetPage,
  resourceOptions,
  statPairs,
  statsOf,
} from './crud-page.mocks';
import { incidentRow } from './incidents.fixtures';

const gql = vi.hoisted(() => ({
  stats: vi.fn(),
  remove: vi.fn(),
  add: vi.fn(),
  refetch: vi.fn(),
}));

vi.mock('@exyconn/crud', async () => (await import('./crud-page.mocks')).crudModuleMock());
vi.mock('@exyconn/shell/hooks/useSettings', async () =>
  (await import('./crud-page.mocks')).settingsModuleMock(),
);
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListStatusIncidentsStatsQuery: gql.stats,
  useDeleteStatusIncidentMutation: () => [gql.remove],
  useAddStatusIncidentUpdateMutation: () => [gql.add],
}));

const answer = (data: object | undefined, loading: boolean) =>
  gql.stats.mockReturnValue({ data, loading, refetch: gql.refetch });

const row = incidentRow();
const DIALOG_TITLE = 'Post an update';

function openUpdate() {
  act(() => {
    dashboardProps().context.actions.update(row);
  });
}

describe('IncidentsPanel', () => {
  beforeEach(() => {
    resetPage();
    gql.remove.mockReset();
    gql.add.mockReset().mockResolvedValue({ data: {} });
    answer(undefined, true);
  });

  it('frames the incident log with its columns, search and row actions', () => {
    renderWithProviders(<IncidentsPanel />);
    expect(dashboardProps()).toMatchObject({
      title: 'Incidents',
      subtitle: 'What the public status page reports, and the updates posted on it',
      entityLabel: 'incident',
      columnDefs: INCIDENT_COLUMNS,
      fetchRows,
      crud,
      searchPlaceholder: 'Search by title or service…',
    });
    expect(dashboardProps().context.actions.delete).toBe(crud.remove);
    expect(dashboardProps().context.formatDate).toBe(formatDate);
  });

  it('reads incidents from the paged query and opens a blank incident form', () => {
    renderWithProviders(<IncidentsPanel />);
    const paged = { rows: [row], totalCount: 1 };
    expect(fetcherCall().document).toBe(ListStatusIncidentsPagedDocument);
    expect(fetcherCall().select({ listStatusIncidentsPaged: paged })).toBe(paged);
    const form = dashboardProps().renderForm(null);
    expect(form.type).toBe(IncidentForm);
    expect(form.props).toEqual({ onCancel: crud.close, onDone: crud.onDone });
  });

  it('counts incidents by impact and by who posted them, once the stats arrive', () => {
    const { rerender } = renderWithProviders(<IncidentsPanel />);
    expect(dashboardProps().statsLoading).toBe(true);
    expect(statPairs()).toEqual([
      ['Incidents', '0'],
      ['Critical', '0'],
      ['Major', '0'],
      ['Posted by hand', '0'],
    ]);

    answer(
      {
        listStatusIncidentsStats: statsOf(9, {
          impact: { CRITICAL: 2, MAJOR: 3, MINOR: 4 },
          source: { MANUAL: 4, MONITOR: 5 },
        }),
      },
      false,
    );
    rerender(<IncidentsPanel />);
    expect(dashboardProps().statsLoading).toBe(false);
    expect(statPairs()).toEqual([
      ['Incidents', '9'],
      ['Critical', '2'],
      ['Major', '3'],
      ['Posted by hand', '4'],
    ]);
  });

  it('keeps showing the last stats while they refresh', () => {
    answer({ listStatusIncidentsStats: statsOf(1) }, true);
    renderWithProviders(<IncidentsPanel />);
    expect(dashboardProps().statsLoading).toBe(false);
  });

  it('deletes by id after confirming by title, then reloads its stats', async () => {
    gql.remove.mockResolvedValue({ data: {} });
    renderWithProviders(<IncidentsPanel />);
    const options = resourceOptions();
    expect(options.label).toBe('Incident');
    expect(options.refetch).toBe(gql.refetch);
    expect(options.confirmMessage(row)).toEqual({
      message: 'Delete incident "{title}" from the public history?',
      values: { title: 'Portal API is slow' },
    });
    await options.onDelete(row);
    expect(gql.remove).toHaveBeenCalledWith({ variables: { id: 'inc-1' } });
  });

  it('posts an update from the row, then closes the drawer and reloads the grid', async () => {
    renderWithProviders(<IncidentsPanel />);
    expect(screen.queryByRole('heading', { name: DIALOG_TITLE })).not.toBeInTheDocument();
    openUpdate();
    expect(screen.getByRole('heading', { name: DIALOG_TITLE })).toBeInTheDocument();
    expect(screen.getByText('Portal API is slow')).toBeInTheDocument();

    fill('Update', 'Root cause found in the cache layer');
    await press('Post');
    await waitFor(() => expect(crud.reload).toHaveBeenCalledTimes(1));
    expect(gql.add).toHaveBeenCalledWith({
      variables: {
        id: 'inc-1',
        status: IncidentUpdateStatus.Identified,
        body: 'Root cause found in the cache layer',
      },
    });
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: DIALOG_TITLE })).not.toBeInTheDocument(),
    );
  });

  it('closes the drawer from Cancel without posting', async () => {
    renderWithProviders(<IncidentsPanel />);
    openUpdate();
    await press('Cancel');
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: DIALOG_TITLE })).not.toBeInTheDocument(),
    );
    expect(gql.add).not.toHaveBeenCalled();
    expect(crud.reload).not.toHaveBeenCalled();
  });

  it('closes the drawer from its close button', async () => {
    renderWithProviders(<IncidentsPanel />);
    openUpdate();
    await press('Close');
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: DIALOG_TITLE })).not.toBeInTheDocument(),
    );
    expect(gql.add).not.toHaveBeenCalled();
  });
});
