# `@exyconn/crud` — the CRUD kit

Eighteen screens in the portal are the same screen: stat tiles, a server-paged grid with
edit/delete row actions, and a drawer holding a create/edit form. This package is that
screen, minus the parts that differ between modules.

A module supplies three things — a **column model**, a **page fetcher** and a **form** —
and nothing else.

## The four pieces

| Export | Replaces |
| --- | --- |
`usePagedQuery` → **`usePagedFetcher(document, select)`** | the hand-written `useCallback` + `client.query` + `{ rows, totalCount }` unwrap |
**`useCrudResource(options)`** | `useCrudDialog` + `useConfirm` + `useNotify` + a `refreshSignal` counter + a `handleDelete` + a `reload` |
**Column factories** | one `cellRenderer` component per status/date/bool/actions column, per module |
**`CrudDashboard`** | the `ModuleDashboard` → `CrudDialog` → `ServerDataGrid` JSX frame |

---

## Column factories

Import from `@exyconn/crud`. Each returns an ag-grid `ColDef`, so a column model stays a
module-level constant and mixes freely with hand-written `ColDef`s.

| Factory | Sortable | Server-filterable | Renders |
| --- | --- | --- | --- |
| `textColumn(field, header, format?)` | ✅ | ✅ | the field, or `format(row)` |
| `valueColumn(field, header, format)` | ✅ | — | `format(row)` — money, counts |
| `derivedColumn(colId, header, format)` | — | — | `format(row)` — joined or computed text |
| `statusColumn(field, header, toStatus?)` | ✅ | — | `StatusChip` off the field, or off `toStatus(row)` |
| `derivedStatusColumn(colId, header, toStatus)` | — | — | `StatusChip` with no backing field |
| `boolColumn(field, header)` | ✅ | — | `BoolChip` (Yes/No) |
| `dateColumn(field, header, emptyText?)` | ✅ | — | the date through the viewer's settings |
| `actionsColumn(specs?, width?)` | — | — | the row's icon buttons |

Only text columns are wired to the server's `TableQueryInput.filters`, so everything else
opts out of the floating filter row rather than offering a filter that does nothing.

### Row actions

An action is declared without its handler:

```ts
import SendIcon from '@mui/icons-material/Send';
import { DELETE_ACTION, EDIT_ACTION, actionsColumn, type RowActionSpec } from '@exyconn/crud';

const SEND_ACTION: RowActionSpec = {
  key: 'send',
  label: 'send contract', // the button's accessible name
  icon: SendIcon,
  color: 'primary',
};

actionsColumn([EDIT_ACTION, SEND_ACTION, DELETE_ACTION]);
```

`key` looks the handler up in the grid **context** at render time, which is what lets the
column model be a constant while the handlers stay per-render. `actionsColumn()` with no
arguments is edit + delete. The width follows the number of buttons unless you override it.

### The grid context

The page hands ag-grid one object the shared cells read:

```ts
export type LeadsGridContext = CrudGridContext<PagedLeadRow>;
// { actions: Record<string, (row) => void> }

export type InvoicesGridContext = DatedCrudGridContext<PagedInvoiceRow>;
// adds { formatDate: (value: string) => string } — required by dateColumn
```

Use `DatedCrudGridContext` whenever the model has a `dateColumn`; the type is what makes
a forgotten `formatDate` a compile error rather than a blank cell.

---

## `usePagedFetcher`

```ts
const fetchRows = usePagedFetcher(
  ListLeadsPagedDocument,
  (data: ListLeadsPagedQuery) => data.listLeadsPaged,
);
```

One network-only query per page, sort and filter the grid asks for. **Annotate the
`select` parameter** — that annotation is what infers the row type. The returned callback
is referentially stable even though `select` is written inline, so the grid does not
rebuild its datasource on every render.

---

## `useCrudResource`

```ts
const crud = useCrudResource<LeadRow, PagedLeadRow>({
  label: 'Lead',                                            // "Lead deleted"
  onDelete: (row) => deleteLead({ variables: { id: row.id } } ),
  confirmMessage: (row) => `Delete lead "${row.name}"?`,
  refetch: refetchStats,                                    // optional
});
```

Two type parameters because the grid's paged row type and the form's row type are
separate generated types; the second defaults to the first (the `DataTable` pages pass
only one).

Returns the dialog state (`open`, `editing`, `openCreate`, `openEdit`, `close`), the
`refreshSignal` the grid watches, `reload()`, `onDone()` (reload **and** close — hand it
straight to a form) and `remove(row)` (confirm → delete → reload → toast).

`remove` and `reload` report failures through the shared notifier. That is a deliberate
change from the code this replaced, where a rejected delete or refetch surfaced only as
an unhandled promise rejection in the console.

---

## `CrudDashboard`

```tsx
<CrudDashboard
  title="CRM"
  subtitle="Leads & pipeline"
  entityLabel="lead"        // drives "New lead" and the drawer's "Edit lead"
  stats={statItems}
  crud={crud}
  renderForm={(initial) => (
    <LeadForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
  )}
  columnDefs={LEAD_COLUMNS}
  fetchRows={fetchRows}
  context={gridContext}
  searchPlaceholder="Search leads…"
/>
```

Optional props: `actionLabel` overrides the `New {entityLabel}` button (Blog uses
`"New post"` with an `"Edit blog post"` drawer), `onRowClick` navigates from a row,
`extraDialogs` holds secondary drawers a row action opens (send, details), and
`children` renders under the grid.

---

## A module end to end

`leads-grid.tsx` — the column model:

```tsx
import type { ColDef } from 'ag-grid-community';
import { actionsColumn, statusColumn, textColumn, valueColumn, type CrudGridContext } from '@exyconn/crud';
import type { ListLeadsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedLeadRow = ListLeadsPagedQuery['listLeadsPaged']['rows'][number];
export type LeadsGridContext = CrudGridContext<PagedLeadRow>;

export const LEAD_COLUMNS: ColDef<PagedLeadRow>[] = [
  textColumn('name', 'Name'),
  textColumn('email', 'Email'),
  statusColumn('source', 'Source'),
  valueColumn('value', 'Value', (row) => row.value.toLocaleString()),
  statusColumn('stage', 'Stage'),
  actionsColumn(),
];
```

`CrmPage.tsx` — the page:

```tsx
export function CrmPage() {
  const { data: statsData, refetch: refetchStats } = useListLeadsStatsQuery();
  const [deleteLead] = useDeleteLeadMutation();

  const crud = useCrudResource<LeadRow, PagedLeadRow>({
    label: 'Lead',
    onDelete: (row) => deleteLead({ variables: { id: row.id } }),
    confirmMessage: (row) => `Delete lead "${row.name}"?`,
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListLeadsPagedDocument,
    (data: ListLeadsPagedQuery) => data.listLeadsPaged,
  );

  const stats = statsData?.listLeadsStats;
  const statItems: StatItem[] = [
    { label: 'Leads', value: String(statTotal(stats)), accent: '#4f8cff' },
    { label: 'Won', value: String(statCount(stats, 'stage', 'WON')), accent: '#7be37b' },
  ];

  const gridContext: LeadsGridContext = {
    actions: { edit: crud.openEdit, delete: crud.remove },
  };

  return (
    <CrudDashboard
      title="CRM"
      subtitle="Leads & pipeline"
      entityLabel="lead"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <LeadForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={LEAD_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search leads…"
    />
  );
}
```

## Client-side lists

`useCrudResource` also fits the `DataTable` screens that read a whole list rather than a
page — Departments, Positions, Nav links, the Tech panels. Pass the list query's
`refetch`, ignore `refreshSignal`, and wire `onEdit={crud.openEdit}` /
`onDelete={crud.remove}` on `DataTable`.

## Tests

`packages/crud/__tests__/unit-tests/columns.test.ts` covers the column factories: which
columns stay filterable, what a formatter returns for a not-yet-loaded row, how
`dateColumn` reaches `formatDate` through the context, and how `actionsColumn` sizes
itself. Add a case there when you add a factory.
