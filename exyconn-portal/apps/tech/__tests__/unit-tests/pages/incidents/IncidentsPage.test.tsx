import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IncidentsPage } from '../../../../src/pages/incidents';
import { renderWithProviders, useCurrentUrl } from '../../test-utils';
import { resetPage } from './crud-page.mocks';

const gql = vi.hoisted(() => ({ stats: vi.fn() }));

vi.mock('@exyconn/crud', async () => (await import('./crud-page.mocks')).crudModuleMock());
vi.mock('@exyconn/shell/hooks/useSettings', async () =>
  (await import('./crud-page.mocks')).settingsModuleMock(),
);
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListStatusIncidentsStatsQuery: gql.stats,
  useListStatusMaintenanceWindowsStatsQuery: gql.stats,
  useDeleteStatusIncidentMutation: () => [vi.fn()],
  useDeleteStatusMaintenanceMutation: () => [vi.fn()],
}));

function CurrentUrl() {
  return <output aria-label="url">{useCurrentUrl()}</output>;
}

const renderPage = (route: string) =>
  renderWithProviders(
    <>
      <IncidentsPage />
      <CurrentUrl />
    </>,
    { route },
  );

describe('IncidentsPage', () => {
  beforeEach(() => {
    resetPage();
    gql.stats.mockReturnValue({ data: undefined, loading: true, refetch: vi.fn() });
  });

  it('opens on the incidents tab, writing it into the URL', async () => {
    renderPage('/tech/incidents');
    expect(await screen.findByRole('heading', { name: 'Incidents', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('tablist', { name: 'Incidents' })).toBeInTheDocument();
    expect(await screen.findByText('/tech/incidents/incidents')).toBeInTheDocument();
  });

  it('opens straight on maintenance from its link', () => {
    renderPage('/tech/incidents/maintenance');
    expect(screen.getByRole('heading', { name: 'Maintenance', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Maintenance' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('switches tabs through the URL', async () => {
    renderPage('/tech/incidents/incidents');
    await userEvent.click(screen.getByRole('tab', { name: 'Maintenance' }));
    expect(
      await screen.findByRole('heading', { name: 'Maintenance', level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('url')).toHaveTextContent('/tech/incidents/maintenance');
  });
});
