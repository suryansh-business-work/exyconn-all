import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { MilestoneState } from '@exyconn/shell/graphql/generated';
import { SharedProjectFacts, SharedProjectProgress } from '../../../../src/pages/project';
import type { SharedMilestone } from '../../../../src/pages/project';
import { renderWithProviders } from '../../test-utils';

const milestone = (name: string, state: MilestoneState, dueOn: string | null): SharedMilestone => ({
  __typename: 'SharedMilestone',
  name,
  state,
  dueOn,
});

const chipFor = (label: string) => screen.getByText(label).closest('.MuiChip-root');

describe('SharedProjectProgress', () => {
  it('says so when there are no milestones and no tickets', () => {
    renderWithProviders(<SharedProjectProgress milestones={[]} ticketCounts={[]} />);
    expect(screen.getByText('No milestones have been set for this project.')).toBeInTheDocument();
    expect(screen.getByText('Where the work is (0 tickets)')).toBeInTheDocument();
    expect(
      screen.getByText('No tickets have been raised on this project yet.'),
    ).toBeInTheDocument();
  });

  it('colours each milestone by its state, and dates it when it has a date', () => {
    renderWithProviders(
      <SharedProjectProgress
        milestones={[
          milestone('Kick-off', MilestoneState.Hit, '2026-02-01'),
          milestone('Beta', MilestoneState.InProgress, null),
          milestone('Launch', MilestoneState.Missed, '2026-05-01'),
          milestone('Retro', MilestoneState.Planned, null),
          milestone('Handover', 'DEFERRED' as MilestoneState, null),
        ]}
        ticketCounts={[]}
      />,
    );
    expect(chipFor('HIT')).toHaveClass('MuiChip-colorSuccess');
    expect(chipFor('IN PROGRESS')).toHaveClass('MuiChip-colorInfo');
    expect(chipFor('MISSED')).toHaveClass('MuiChip-colorError');
    expect(chipFor('PLANNED')).toHaveClass('MuiChip-colorDefault');
    expect(chipFor('DEFERRED')).toHaveClass('MuiChip-colorDefault');
    expect(screen.getByText('1 Feb 2026')).toBeInTheDocument();
    expect(screen.getAllByText('No date')).toHaveLength(3);
  });

  it('uses the singular heading for exactly one ticket', () => {
    renderWithProviders(
      <SharedProjectProgress milestones={[]} ticketCounts={[{ status: 'OPEN', count: 1 }]} />,
    );
    expect(screen.getByText('Where the work is (1 ticket)')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'OPEN share of tickets' })).toHaveAttribute(
      'aria-valuenow',
      '100',
    );
  });

  it('shows each status as its share of every ticket', () => {
    renderWithProviders(
      <SharedProjectProgress
        milestones={[]}
        ticketCounts={[
          { status: 'OPEN', count: 1 },
          { status: 'DONE', count: 3 },
        ]}
      />,
    );
    expect(screen.getByText('Where the work is (4 tickets)')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'OPEN share of tickets' })).toHaveAttribute(
      'aria-valuenow',
      '25',
    );
    expect(screen.getByRole('progressbar', { name: 'DONE share of tickets' })).toHaveAttribute(
      'aria-valuenow',
      '75',
    );
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});

describe('SharedProjectFacts', () => {
  it('shows each fact under its label', () => {
    renderWithProviders(
      <SharedProjectFacts
        facts={[
          { label: 'Status', value: 'ACTIVE' },
          { label: 'Hours tracked', value: '3 h' },
        ]}
      />,
    );
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    expect(screen.getByText('3 h')).toBeInTheDocument();
  });
});
