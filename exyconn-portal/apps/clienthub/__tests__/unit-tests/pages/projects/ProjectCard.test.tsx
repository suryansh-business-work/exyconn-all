import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { MilestoneState, ProjectStatus } from '@exyconn/shell/graphql/generated';
import { ProjectCard, type ClientProject } from '../../../../src/pages/projects/ProjectCard';
import { renderWithProviders } from '../../test-utils';

const PROJECT: ClientProject = {
  id: 'p1',
  name: 'Billing revamp',
  status: ProjectStatus.Active,
  startDate: '2026-01-05T00:00:00.000Z',
  endDate: '2026-06-30T00:00:00.000Z',
  budgetHours: 40,
  trackedHours: 12.4,
  milestones: [
    { name: 'Design sign-off', dueOn: '2026-02-10T00:00:00.000Z', state: MilestoneState.Hit },
    { name: 'Go live', dueOn: null, state: MilestoneState.Planned },
  ],
  ticketCounts: [
    { status: 'To do', count: 3 },
    { status: 'Done', count: 9 },
  ],
};

const progress = () => screen.queryByRole('progressbar', { name: 'Hours used against budget' });

describe('ProjectCard', () => {
  it('shows the name, status and the dates the project runs between', () => {
    renderWithProviders(<ProjectCard project={PROJECT} />);
    expect(screen.getByText('Billing revamp')).toBeInTheDocument();
    expect(screen.getByText('ACTIVE').closest('.MuiChip-root')).toHaveClass('MuiChip-colorSuccess');
    expect(screen.getByText('05 Jan 2026 – 30 Jun 2026')).toBeInTheDocument();
  });

  it('marks a date that is not set yet', () => {
    renderWithProviders(<ProjectCard project={{ ...PROJECT, startDate: null, endDate: null }} />);
    expect(screen.getByText('… – …')).toBeInTheDocument();
  });

  it('measures the rounded hours used against the budget', () => {
    renderWithProviders(<ProjectCard project={PROJECT} />);
    expect(screen.getByText('12 of 40 hours used')).toBeInTheDocument();
    expect(Number(progress()?.getAttribute('aria-valuenow'))).toBeCloseTo(31);
  });

  it('caps the bar at full once the budget is spent', () => {
    renderWithProviders(<ProjectCard project={{ ...PROJECT, trackedHours: 52 }} />);
    expect(screen.getByText('52 of 40 hours used')).toBeInTheDocument();
    expect(progress()).toHaveAttribute('aria-valuenow', '100');
  });

  it('only logs hours, with no bar, when there is no budget', () => {
    renderWithProviders(
      <ProjectCard project={{ ...PROJECT, budgetHours: null, trackedHours: 7.6 }} />,
    );
    expect(screen.getByText('8 hours logged')).toBeInTheDocument();
    expect(progress()).not.toBeInTheDocument();
  });

  it('counts the work in each column', () => {
    renderWithProviders(<ProjectCard project={PROJECT} />);
    expect(screen.getByText('To do: 3')).toBeInTheDocument();
    expect(screen.getByText('Done: 9')).toBeInTheDocument();
  });

  it('lists milestones with their due date, or their state when undated', () => {
    renderWithProviders(<ProjectCard project={PROJECT} />);
    expect(screen.getByText('Milestones')).toBeInTheDocument();
    expect(screen.getByText('Design sign-off')).toBeInTheDocument();
    expect(screen.getByText('10 Feb 2026')).toBeInTheDocument();
    expect(screen.getByText('Go live')).toBeInTheDocument();
    expect(screen.getByText('PLANNED')).toBeInTheDocument();
  });

  it('leaves out the work counts and milestones when there are none', () => {
    renderWithProviders(<ProjectCard project={{ ...PROJECT, milestones: [], ticketCounts: [] }} />);
    expect(screen.queryByText('Milestones')).not.toBeInTheDocument();
    expect(screen.queryByText('To do: 3')).not.toBeInTheDocument();
  });
});
