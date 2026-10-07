import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { formatWith } from '@exyconn/shell/utils/date';
import { IncidentImpact, IncidentUpdateStatus } from '@exyconn/shell/graphql/generated';
import { IncidentList } from '../../../../src/pages/status/IncidentList';
import { TIME_FORMAT } from '../../../../src/status.constants';
import { renderWithProviders } from '../../test-utils';
import { incident, incidentUpdate } from './status.fixtures';

describe('IncidentList', () => {
  it('says so when nothing has gone wrong', () => {
    renderWithProviders(<IncidentList incidents={[]} />);
    expect(
      screen.getByText('No incidents recorded. Every service has answered every check.'),
    ).toBeInTheDocument();
  });

  it('describes a resolved incident: service, start, duration, impact and outcome', () => {
    const resolved = incident();
    renderWithProviders(<IncidentList incidents={[resolved]} />);
    expect(screen.getByText('HR Portal is down')).toBeInTheDocument();
    expect(screen.getByText(/20 min/)).toHaveTextContent(
      `HR Portal · ${formatWith(resolved.startedAt, TIME_FORMAT)} · 20 min`,
    );
    expect(screen.getByText('major impact')).toBeInTheDocument();
    expect(screen.getByText('Resolved')).toBeInTheDocument();
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
  });

  it('says hours and minutes for a long, still-ongoing incident', () => {
    renderWithProviders(
      <IncidentList
        incidents={[
          incident({
            id: 'a',
            impact: IncidentImpact.Critical,
            resolvedAt: null,
            durationMinutes: 125,
            updates: [],
          }),
          incident({
            id: 'b',
            title: 'Slow API',
            impact: IncidentImpact.Minor,
            durationMinutes: 60,
          }),
        ]}
      />,
    );
    expect(screen.getByText(/2h 5m/)).toBeInTheDocument();
    expect(screen.getByText(/1h 0m/)).toBeInTheDocument();
    expect(screen.getByText('critical impact')).toBeInTheDocument();
    expect(screen.getByText('minor impact')).toBeInTheDocument();
    expect(screen.getByText('Ongoing')).toBeInTheDocument();
    expect(screen.getAllByRole('separator')).toHaveLength(1);
  });

  it('lays out each incident’s timeline with every update status', () => {
    const updates = [
      incidentUpdate({ id: 'u4', status: IncidentUpdateStatus.Resolved, body: 'All clear' }),
      incidentUpdate({ id: 'u3', status: IncidentUpdateStatus.Monitoring, body: 'Watching it' }),
      incidentUpdate({ id: 'u2', status: IncidentUpdateStatus.Identified, body: 'Bad deploy' }),
      incidentUpdate({
        id: 'u1',
        status: IncidentUpdateStatus.Investigating,
        body: 'Looking into it',
        createdAt: '2026-09-02T04:05:00.000Z',
      }),
    ];
    renderWithProviders(<IncidentList incidents={[incident({ resolvedAt: null, updates })]} />);
    for (const label of ['resolved', 'monitoring', 'identified', 'investigating']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getByText('Looking into it')).toBeInTheDocument();
    expect(screen.getByText('Bad deploy')).toBeInTheDocument();
    expect(
      screen.getByText(formatWith('2026-09-02T04:05:00.000Z', TIME_FORMAT)),
    ).toBeInTheDocument();
  });
});
