import type { ColDef } from 'ag-grid-community';
import {
  actionsColumn,
  dateColumn,
  derivedColumn,
  derivedStatusColumn,
  statusColumn,
  textColumn,
  type DatedCrudGridContext,
} from '@exyconn/crud';
import type { ListRisksPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedRiskRow = ListRisksPagedQuery['listRisksPaged']['rows'][number];

export type RisksGridContext = DatedCrudGridContext<PagedRiskRow>;

/**
 * The register as an auditor reads it: what the risk is, who owns it, what it was rated
 * before the controls and what is left after them — and when that rating is next due a look.
 *
 * Both ratings are shown side by side because the pair is the argument: a high inherent
 * rating beside a low residual one is what says the controls are worth having.
 */
export const RISK_COLUMNS: ColDef<PagedRiskRow>[] = [
  textColumn('reference', 'Ref'),
  textColumn('title', 'Risk'),
  statusColumn('category', 'Category'),
  textColumn('ownerName', 'Owner'),
  derivedColumn<PagedRiskRow>('standards', 'Standards', (row) =>
    row.standards.map((standard) => standard.replace('_', ' ')).join(', '),
  ),
  derivedStatusColumn<PagedRiskRow>(
    'inherent',
    'Inherent',
    (row) => `${row.inherentLevel} (${row.inherentScore})`,
  ),
  statusColumn('treatment', 'Treatment'),
  derivedStatusColumn<PagedRiskRow>(
    'residual',
    'Residual',
    (row) => `${row.residualLevel} (${row.residualScore})`,
  ),
  statusColumn('status', 'Status'),
  dateColumn('reviewDueOn', 'Review due', '—'),
  actionsColumn(),
];
