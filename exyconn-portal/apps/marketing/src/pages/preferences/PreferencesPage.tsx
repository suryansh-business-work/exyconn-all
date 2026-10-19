import {
  CrudDashboard,
  DELETE_ACTION,
  EDIT_ACTION,
  actionsColumn,
  boolColumn,
  textColumn,
  useCrudResource,
  usePagedFetcher,
  valueColumn,
  type CrudGridContext,
} from '@exyconn/crud';
import { useT } from '@exyconn/i18n';
import type { ColDef } from 'ag-grid-community';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { Alert, Card, CardContent, Heading, Skeleton } from '@exyconn/shell/components/ui';
import {
  ListPreferenceCategoriesPagedDocument,
  useDeletePreferenceCategoryMutation,
  useMarketingFooterQuery,
  type ListPreferenceCategoriesPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { PreferenceCategoryForm, type PreferenceCategoryRow } from './forms/preference-category';
import { MarketingFooterForm } from './forms/marketing-footer';

/** Categories are few; the grid says how many. */
const NO_STATS: StatItem[] = [];

type Row = ListPreferenceCategoriesPagedQuery['listPreferenceCategoriesPaged']['rows'][number];

const COLUMNS: ColDef<Row>[] = [
  textColumn('name', 'Category'),
  textColumn('description', 'Description', (row) => row.description || '—'),
  boolColumn('isActive', 'Offered'),
  valueColumn('sortOrder', 'Order', (row) => String(row.sortOrder)),
  actionsColumn([EDIT_ACTION, DELETE_ACTION]),
];

/** The organization's footer settings, loaded then edited. */
function FooterCard() {
  const t = useT();
  const { data, loading, error, refetch } = useMarketingFooterQuery({
    fetchPolicy: 'network-only',
  });
  return (
    <Card variant="outlined" sx={{ mt: 3 }}>
      <CardContent>
        <Heading level={2} sx={{ fontSize: 'h6.fontSize', mb: 2 }}>
          {t('Email footer')}
        </Heading>
        {loading && !data && <Skeleton variant="rounded" height={240} />}
        {error && <Alert severity="error">{error.message}</Alert>}
        {data && <MarketingFooterForm initial={data.marketingFooter} onSaved={() => refetch()} />}
      </CardContent>
    </Card>
  );
}

/**
 * Marketing → Email preferences: the categories recipients can turn off on their public
 * preference page, and the compliance footer every marketing email carries.
 */
export function PreferencesPage() {
  const [remove] = useDeletePreferenceCategoryMutation();
  const crud = useCrudResource<PreferenceCategoryRow, Row>({
    label: 'Category',
    onDelete: (row) => remove({ variables: { id: row.id } }),
    confirmMessage: (row) => ({
      message: 'Delete “{name}”? Recipients’ choices for it are no longer applied.',
      values: { name: row.name },
    }),
  });
  const fetchRows = usePagedFetcher(
    ListPreferenceCategoriesPagedDocument,
    (data: ListPreferenceCategoriesPagedQuery) => data.listPreferenceCategoriesPaged,
  );
  const context: CrudGridContext<Row> = { actions: { edit: crud.openEdit, delete: crud.remove } };
  return (
    <CrudDashboard
      title="Email preferences"
      subtitle="What recipients can turn off, and the footer every email ends with"
      entityLabel="category"
      stats={NO_STATS}
      crud={crud}
      renderForm={(initial) => (
        <PreferenceCategoryForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={COLUMNS}
      fetchRows={fetchRows}
      context={context}
      searchPlaceholder="Search categories…"
      permissionModule="PreferenceCategory"
    >
      <FooterCard />
    </CrudDashboard>
  );
}
