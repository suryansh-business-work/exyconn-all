import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import { formatMoney } from '@exyconn/shell/utils/money';
import { CrmOverviewPage } from '../../../../src/pages/crm';
import { renderWithProviders } from '../../test-utils';
import { answered, leadRow, pending, tableStats } from '../../fixtures';

interface OverviewProps {
  title: string;
  stats: { label: string; value: string }[];
  statsLoading: boolean;
  breakdowns: { title: string; buckets: unknown[] }[];
  links: { label: string; to: string }[];
  recentTitle: string;
  children: ReactNode;
}

interface TableColumn {
  key: string;
  render?: (row: Record<string, unknown>) => ReactNode;
}

interface TableProps {
  columns: TableColumn[];
  rows: Record<string, unknown>[];
  emptyMessage: string;
  loading: boolean;
  onRefresh: () => unknown;
}

const recorded = vi.hoisted(() => {
  const hooks: Record<string, () => unknown> = {};
  return { overview: null as unknown, table: null as unknown, hooks };
});

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListLeadsStatsQuery: () => recorded.hooks.leadStats(),
  useListDealsStatsQuery: () => recorded.hooks.dealStats(),
  useListCompaniesStatsQuery: () => recorded.hooks.companyStats(),
  useListContactsStatsQuery: () => recorded.hooks.contactStats(),
  useDealForecastQuery: () => recorded.hooks.forecast(),
  useListLeadsQuery: () => recorded.hooks.leads(),
}));

vi.mock('@exyconn/shell/components/dashboard/ModuleOverview', () => ({
  ModuleOverview: (props: Readonly<OverviewProps>) => {
    recorded.overview = props;
    return <section aria-label="overview">{props.children}</section>;
  },
}));

/** Renders each row cell by cell, as the shared table does: a column's render, else the value. */
vi.mock('@exyconn/shell/components/data/DataTable', () => ({
  DataTable: (props: Readonly<TableProps>) => {
    recorded.table = props;
    return (
      <table>
        <tbody>
          {props.rows.map((row) => (
            <tr key={String(row.id)}>
              {props.columns.map((column) => (
                <td key={column.key}>{column.render?.(row) ?? String(row[column.key])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  },
}));

const overview = () => recorded.overview as OverviewProps;
const table = () => recorded.table as TableProps;

const loadedHooks = () => ({
  leadStats: () => answered({ listLeadsStats: tableStats(40, { stage: { WON: 6 } }) }),
  dealStats: () => answered({ listDealsStats: tableStats(12) }),
  companyStats: () => answered({ listCompaniesStats: tableStats(15) }),
  contactStats: () => answered({ listContactsStats: tableStats(33) }),
  forecast: () => answered({ dealForecast: { openCount: 9, openValue: 1, weightedValue: 1 } }),
  leads: () => answered({ listLeads: [leadRow()] }),
});

describe('CrmOverviewPage', () => {
  beforeEach(() => {
    recorded.hooks = loadedHooks();
  });

  it('shows the funnel tiles and breakdowns from the stats queries', () => {
    renderWithProviders(<CrmOverviewPage />);

    expect(overview().title).toBe('CRM');
    expect(overview().statsLoading).toBe(false);
    expect(overview().stats.find((stat) => stat.label === 'Leads')?.value).toBe('40');
    expect(overview().stats.find((stat) => stat.label === 'Leads won')?.value).toBe('6');
    expect(overview().breakdowns.map((breakdown) => breakdown.title)).toEqual([
      'Leads by stage',
      'Deals by stage',
      'Leads by source',
    ]);
  });

  it('links to the leads register and both views of the deals', () => {
    renderWithProviders(<CrmOverviewPage />);

    expect(overview().links.map((link) => link.to)).toEqual([
      '/crm/leads',
      '/crm/deals',
      '/crm/deals/list',
    ]);
    expect(overview().recentTitle).toBe('Newest leads');
  });

  it.each(['leadStats', 'dealStats', 'companyStats', 'contactStats', 'forecast'])(
    'marks the tiles loading while %s has not answered',
    (hook) => {
      recorded.hooks = { ...loadedHooks(), [hook]: pending };
      renderWithProviders(<CrmOverviewPage />);

      expect(overview().statsLoading).toBe(true);
    },
  );

  it('lists the eight newest leads, with the stage chip and the value as money', () => {
    const leads = Array.from({ length: 10 }, (_, index) =>
      leadRow({ id: `lead-${index}`, name: `Lead ${index}`, value: 1000 * (index + 1) }),
    );
    recorded.hooks.leads = () => answered({ listLeads: leads });
    renderWithProviders(<CrmOverviewPage />);

    expect(table().rows).toHaveLength(8);
    expect(table().rows[0]).toMatchObject({ id: 'lead-0' });
    expect(table().emptyMessage).toBe('No leads yet.');
    const firstRow = within(screen.getAllByRole('row')[0]);
    expect(firstRow.getByText('Lead 0')).toBeInTheDocument();
    expect(firstRow.getByText('QUALIFIED')).toBeInTheDocument();
    expect(firstRow.getByText(formatMoney(1000))).toBeInTheDocument();
    expect(screen.queryByText('Lead 8')).not.toBeInTheDocument();
  });

  it('shows an empty, loading register until the leads arrive', () => {
    recorded.hooks.leads = pending;
    renderWithProviders(<CrmOverviewPage />);

    expect(table().rows).toEqual([]);
    expect(table().loading).toBe(true);
  });
});
