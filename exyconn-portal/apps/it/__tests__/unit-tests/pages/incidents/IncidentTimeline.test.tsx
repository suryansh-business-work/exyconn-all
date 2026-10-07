import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { IncidentTimeline } from '../../../../src/pages/incidents/IncidentTimeline';
import type { PagedIncidentRow } from '../../../../src/pages/incidents/incidents-grid';
import { incidentRow } from '../../core/rows.fixtures';
import { fill, press } from '../../core/form.helpers';
import { renderWithProviders } from '../../test-utils';

const gql = vi.hoisted(() => ({ addUpdate: vi.fn() }));

vi.mock('@exyconn/shell/hooks/useSettings', async () =>
  (await import('../../core/settings.mock')).settingsModuleMock(),
);
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useAddItIncidentUpdateMutation: () => [gql.addUpdate],
}));

const onClose = vi.fn();
const onChanged = vi.fn();

const renderTimeline = (incident: PagedIncidentRow | null) =>
  renderWithProviders(
    <IncidentTimeline incident={incident} onClose={onClose} onChanged={onChanged} />,
  );

describe('IncidentTimeline', () => {
  beforeEach(() => {
    gql.addUpdate.mockReset().mockResolvedValue({ data: {} });
    onClose.mockReset();
    onChanged.mockReset();
  });

  it('renders nothing while no incident is open', () => {
    renderTimeline(null);
    expect(screen.queryByText('Timeline')).not.toBeInTheDocument();
  });

  it('lays out the facts of an ongoing incident', () => {
    renderTimeline(incidentRow());
    expect(screen.getByRole('heading', { name: 'VPN down' })).toBeInTheDocument();
    expect(screen.getByText('SEV2')).toBeInTheDocument();
    expect(screen.getByText('at 2026-10-05T08:00:00.000Z')).toBeInTheDocument();
    expect(screen.getByText('Meera')).toBeInTheDocument();
    expect(screen.getByText('VPN, Firewall')).toBeInTheDocument();
    expect(screen.getByText('All remote staff')).toBeInTheDocument();
    expect(screen.getAllByText('—')).toHaveLength(1);
  });

  it('dashes what is unknown and falls back to the description for impact', () => {
    renderTimeline(
      incidentRow({
        resolvedAt: '2026-10-05T10:00:00.000Z',
        commanderName: '',
        affectedSystems: [],
        impact: '',
      }),
    );
    expect(screen.getByText('at 2026-10-05T10:00:00.000Z')).toBeInTheDocument();
    expect(screen.getAllByText('—')).toHaveLength(2);
    expect(screen.getByText('Nobody can reach the office network')).toBeInTheDocument();
  });

  it('lists each timeline entry with its status, time, author and note', () => {
    renderTimeline(incidentRow());
    expect(screen.getByText('Timeline')).toBeInTheDocument();
    expect(screen.getByText('INVESTIGATING')).toBeInTheDocument();
    expect(screen.getByText('at 2026-10-05T08:05:00.000Z · Ravi')).toBeInTheDocument();
    expect(screen.getByText('Looking into it')).toBeInTheDocument();
  });

  it('posts the next update against this incident and tells the page', async () => {
    renderTimeline(incidentRow());
    fill('What happened', 'Tunnel restarted');
    await press('Post update');
    await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(1));
    expect(gql.addUpdate).toHaveBeenCalledWith({
      variables: { id: 'inc-1', status: 'IDENTIFIED', note: 'Tunnel restarted' },
    });
  });

  it('closes from its close button and from Cancel', async () => {
    renderTimeline(incidentRow());
    await press('Close');
    await press('Cancel');
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
