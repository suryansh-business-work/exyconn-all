import type { ReactNode } from 'react';
import type { Mock } from 'vitest';
import type { ModuleOverview } from '@exyconn/shell/components/dashboard/ModuleOverview';
import { email, problemStats, status } from './overview.fixtures';

type OverviewProps = Parameters<typeof ModuleOverview>[0];

/** The last props the ModuleOverview stand-in rendered with. */
export const overview: { props: OverviewProps | null } = { props: null };

/** Reads the recorded props, failing the test when the page never rendered the overview. */
export function overviewProps(): OverviewProps {
  if (!overview.props) {
    throw new Error('ModuleOverview was not rendered');
  }
  return overview.props;
}

/** Stands in for ModuleOverview: records its props, shows the recent title and the table. */
function ModuleOverviewStub(props: Readonly<OverviewProps & { children?: ReactNode }>) {
  overview.props = props;
  return (
    <section>
      <h2>{props.recentTitle}</h2>
      {props.children}
    </section>
  );
}

/** `@exyconn/shell/components/dashboard/ModuleOverview` with the stand-in in place. */
export function moduleOverviewModule() {
  return { ModuleOverview: ModuleOverviewStub };
}

/** The three query hooks the overview reads, and the status refetch. */
export interface OverviewQueries {
  status: Mock;
  email: Mock;
  reports: Mock;
  refetch: Mock;
}

/** Makes every query answer at once with the given figures. */
export function answerAll(
  gql: OverviewQueries,
  statusData = status(),
  emailData = email(),
  reportsData = problemStats(),
) {
  gql.status.mockReturnValue({
    data: { statusOverview: statusData },
    loading: false,
    refetch: gql.refetch,
  });
  gql.email.mockReturnValue({ data: { emailDashboard: emailData }, loading: false });
  gql.reports.mockReturnValue({ data: { listProblemReportsStats: reportsData }, loading: false });
}
