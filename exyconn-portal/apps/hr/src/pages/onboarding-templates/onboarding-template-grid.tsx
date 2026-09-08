import type { ColDef } from 'ag-grid-community';
import {
  actionsColumn,
  boolColumn,
  dateColumn,
  derivedColumn,
  textColumn,
  valueColumn,
  type DatedCrudGridContext,
} from '@exyconn/crud';
import type { ListOnboardingTemplatesPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedOnboardingTemplateRow =
  ListOnboardingTemplatesPagedQuery['listOnboardingTemplatesPaged']['rows'][number];

export type OnboardingTemplatesGridContext = DatedCrudGridContext<PagedOnboardingTemplateRow>;

/** Who the template leans on most — the quickest read of what a template actually is. */
function ownersOf(row: PagedOnboardingTemplateRow): string {
  const owners = [...new Set(row.tasks.map((task) => task.owner))];
  return owners.length > 0 ? owners.join(', ') : '—';
}

export const ONBOARDING_TEMPLATE_COLUMNS: ColDef<PagedOnboardingTemplateRow>[] = [
  textColumn('name', 'Template'),
  boolColumn('active', 'Offered'),
  valueColumn('taskCount', 'Tasks', (row) => String(row.taskCount)),
  derivedColumn('owners', 'Owners', ownersOf),
  dateColumn('createdAt', 'Created'),
  actionsColumn(),
];
