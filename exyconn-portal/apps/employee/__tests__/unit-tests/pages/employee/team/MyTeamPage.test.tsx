import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import {
  useMyDirectReportsQuery,
  useTeamGoalsQuery,
  useTeamLeaveRequestsQuery,
  useTeamPerformanceReviewsQuery,
  useTeamRequestsQuery,
} from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../../test-utils';
import { queryResult } from '../apolloHookMocks';
import { MyTeamPage } from '../../../../../src/pages/employee/team';
import { leaveRow, report } from './teamFixtures';

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useMyDirectReportsQuery: vi.fn(),
  useTeamLeaveRequestsQuery: vi.fn(),
  useTeamRequestsQuery: vi.fn(),
  useTeamPerformanceReviewsQuery: vi.fn(),
  useTeamGoalsQuery: vi.fn(),
}));

function reports(result: Parameters<typeof queryResult>[0]) {
  vi.mocked(useMyDirectReportsQuery).mockReturnValue(
    queryResult<typeof useMyDirectReportsQuery>(result),
  );
}

beforeEach(() => {
  vi.mocked(useTeamLeaveRequestsQuery).mockReturnValue(
    queryResult<typeof useTeamLeaveRequestsQuery>({
      data: {
        teamLeaveRequests: [leaveRow(), leaveRow({ id: 'leave-2', employeeId: 'emp-left' })],
      },
    }),
  );
  vi.mocked(useTeamRequestsQuery).mockReturnValue(
    queryResult<typeof useTeamRequestsQuery>({ data: { teamRequests: [] } }),
  );
  vi.mocked(useTeamPerformanceReviewsQuery).mockReturnValue(
    queryResult<typeof useTeamPerformanceReviewsQuery>({ data: { teamPerformanceReviews: [] } }),
  );
  vi.mocked(useTeamGoalsQuery).mockReturnValue(
    queryResult<typeof useTeamGoalsQuery>({ data: { teamGoals: [] } }),
  );
});

describe('MyTeamPage', () => {
  it('titles the page and asks for fresh reports', () => {
    reports({ data: { myDirectReports: [] } });
    renderWithProviders(<MyTeamPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'My Team' })).toBeInTheDocument();
    expect(screen.getByText('Your direct reports and what they need from you')).toBeInTheDocument();
    expect(useMyDirectReportsQuery).toHaveBeenCalledWith({ fetchPolicy: 'cache-and-network' });
  });

  it('says it is loading before the reports arrive', () => {
    reports({ loading: true });
    renderWithProviders(<MyTeamPage />);

    expect(screen.getByText('Loading…')).toBeInTheDocument();
    expect(screen.queryByText('Direct reports')).toBeNull();
  });

  it('explains an empty team to someone nobody reports to', () => {
    reports({ data: { myDirectReports: [] } });
    renderWithProviders(<MyTeamPage />);

    expect(
      screen.getByText(
        'Nobody reports to you yet. HR sets reporting lines on the employee record.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText('Leave requests')).toBeNull();
  });

  it('shows the reports and every section, naming rows by report', () => {
    reports({ data: { myDirectReports: [report()] } });
    renderWithProviders(<MyTeamPage />);

    expect(screen.getByText('1 person reports to you.')).toBeInTheDocument();
    expect(screen.getByText('Leave requests')).toBeInTheDocument();
    expect(screen.getByText('Requests')).toBeInTheDocument();
    expect(screen.getByText('Performance reviews')).toBeInTheDocument();
    expect(screen.getByText('Goals')).toBeInTheDocument();
    expect(screen.queryByText('Loading…')).toBeNull();

    const [, mine, theirs] = screen.getAllByRole('row');
    expect(within(mine).getByText('Asha Rao')).toBeInTheDocument();
    // A row for someone who no longer reports here falls back to the id.
    expect(within(theirs).getByText('emp-left')).toBeInTheDocument();
  });
});
