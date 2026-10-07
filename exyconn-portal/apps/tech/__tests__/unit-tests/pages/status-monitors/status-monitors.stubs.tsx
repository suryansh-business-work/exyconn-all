import type { ReactNode } from 'react';
import { vi } from 'vitest';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import type { StatusMonitorRow } from '../../../../src/pages/status-monitors/forms/status-monitor';

/** The CrudDashboard props the page hands over, as far as the tests read them. */
export interface DashboardProps {
  title: string;
  subtitle: string;
  entityLabel: string;
  exportFileName?: string;
  searchPlaceholder: string;
  stats: StatItem[];
  statsLoading?: boolean;
  crud?: unknown;
  renderForm?: (initial: StatusMonitorRow | null) => ReactNode;
  columnDefs: unknown[];
  fetchRows: unknown;
  context: { actions: Record<string, unknown> };
}

export const crudSpies = {
  dashboard: vi.fn<(props: DashboardProps) => void>(),
  resource: vi.fn(),
  fetcher: vi.fn(),
};

/** Stands in for the ag-grid dashboard (ag-grid does not lay out under jsdom). */
export function CrudDashboardStub(props: Readonly<DashboardProps>) {
  crudSpies.dashboard(props);
  return (
    <div>
      <dl>
        {props.stats.map((stat) => (
          <div key={stat.label} data-testid={`stat-${stat.label}`}>
            <dt>{stat.label}</dt>
            <dd>{stat.value}</dd>
          </div>
        ))}
      </dl>
      {props.renderForm?.(null)}
    </div>
  );
}

/** `@exyconn/crud` with the dashboard, resource hook and fetcher replaced; columns stay real. */
export async function crudModule(importOriginal: () => Promise<object>) {
  return {
    ...(await importOriginal()),
    CrudDashboard: CrudDashboardStub,
    useCrudResource: crudSpies.resource,
    usePagedFetcher: crudSpies.fetcher,
  };
}

export const formRenders =
  vi.fn<
    (props: { initial: StatusMonitorRow | null; onDone: () => void; onCancel: () => void }) => void
  >();

/** Stands in for the monitor form, recording the callbacks it is wired to. */
export function StatusMonitorFormStub(
  props: Readonly<{ initial: StatusMonitorRow | null; onDone: () => void; onCancel: () => void }>,
) {
  formRenders(props);
  return <p>Monitor form</p>;
}
