import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { ProjectRisk, ProjectTimeline } from '@exyconn/shell/graphql/generated';
import {
  HoursCell,
  ProgressCell,
  ProjectCell,
  RiskCell,
  TimelineCell,
} from '../../../../../src/pages/overview/portfolio/portfolio-cells';
import { renderWithProviders } from '../../../test-utils';
import { portfolioRow } from '../../../fixtures';

describe('ProjectCell', () => {
  it('names the project, its key with the client, and the size of the team', () => {
    renderWithProviders(<ProjectCell row={portfolioRow()} />);

    expect(screen.getByText('Website Redesign')).toBeInTheDocument();
    expect(screen.getByText('WEB · Northwind')).toBeInTheDocument();
    expect(screen.getByText('4 on the team')).toBeInTheDocument();
  });

  it('shows just the key for internal work, and no team line for nobody', () => {
    renderWithProviders(<ProjectCell row={portfolioRow({ clientName: '', teamSize: 0 })} />);

    expect(screen.getByText('WEB')).toBeInTheDocument();
    expect(screen.queryByText(/on the team/)).not.toBeInTheDocument();
  });
});

describe('RiskCell', () => {
  it('shows the rating with every reason the server gave for it', () => {
    renderWithProviders(
      <RiskCell row={portfolioRow({ riskReasons: ['Past its end date', 'Over its hours'] })} />,
    );

    expect(screen.getByText('At risk')).toBeInTheDocument();
    expect(screen.getByText('Past its end date')).toBeInTheDocument();
    expect(screen.getByText('Over its hours')).toBeInTheDocument();
  });

  it('says a project nobody can measure is not measured, with no reasons', () => {
    renderWithProviders(
      <RiskCell row={portfolioRow({ risk: ProjectRisk.Unknown, riskReasons: [] })} />,
    );

    expect(screen.getByText('Not measured')).toBeInTheDocument();
  });
});

describe('TimelineCell', () => {
  it('reads the timeline in words', () => {
    renderWithProviders(<TimelineCell row={portfolioRow({ timeline: ProjectTimeline.DueSoon })} />);

    expect(screen.getByText('Due soon')).toBeInTheDocument();
  });
});

describe('ProgressCell', () => {
  it('shows the share of the board finished and the counts behind it', () => {
    renderWithProviders(<ProgressCell row={portfolioRow()} />);

    expect(screen.getByText('40%')).toBeInTheDocument();
    expect(screen.getByText('4 of 10 tickets')).toBeInTheDocument();
  });

  it('never invents a percentage for a board nobody tracks', () => {
    renderWithProviders(<ProgressCell row={portfolioRow({ progressPercent: null })} />);

    expect(screen.getByText('Not tracked')).toBeInTheDocument();
  });
});

describe('HoursCell', () => {
  it('shows the hours against the agreed budget', () => {
    renderWithProviders(<HoursCell row={portfolioRow()} />);

    expect(screen.getByText('130%')).toBeInTheDocument();
    expect(screen.getByText('130 of 100 h')).toBeInTheDocument();
  });

  it('shows only what was spent when no budget was agreed', () => {
    renderWithProviders(
      <HoursCell
        row={portfolioRow({ budgetHours: null, budgetUsedPercent: null, loggedHours: 12 })}
      />,
    );

    expect(screen.getByText('No budget')).toBeInTheDocument();
    expect(screen.getByText('12 h logged')).toBeInTheDocument();
  });
});
