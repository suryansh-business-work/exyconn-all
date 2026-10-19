# `@exyconn/crud` — the CRUD kit

Eighteen screens in the portal are the same screen: stat tiles, a server-paged grid with
edit/delete row actions, and a drawer holding a create/edit form. This package is that
screen, minus the parts that differ between modules.

A module supplies three things — a **column model**, a **page fetcher** and a **form** —
and nothing else.

## The four pieces

| Export                                                    | Replaces                                                                                                 |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `usePagedQuery` → **`usePagedFetcher(document, select)`** | the hand-written `useCallback` + `client.query` + `{ rows, totalCount }` unwrap                          |
| **`useCrudResource(options)`**                            | `useCrudDialog` + `useConfirm` + `useNotify` + a `refreshSignal` counter + a `handleDelete` + a `reload` |
| **Column factories**                                      | one `cellRenderer` component per status/date/bool/actions column, per module                             |
| **`CrudDashboard`**                                       | the `ModuleDashboard` → `CrudDialog` → `ServerDataGrid` JSX frame                                        |

---

## Column factories

Import from `@exyconn/crud`. Each returns an ag-grid `ColDef`, so a column model stays a
module-level constant and mixes freely with hand-written `ColDef`s.

| Factory                                        | Sortable | Server-filterable | Renders                                            |
| ---------------------------------------------- | -------- | ----------------- | -------------------------------------------------- |
| `textColumn(field, header, format?)`           | ✅       | ✅                | the field, or `format(row)`                        |
| `valueColumn(field, header, format)`           | ✅       | —                 | `format(row)` — money, counts                      |
| `derivedColumn(colId, header, format)`         | —        | —                 | `format(row)` — joined or computed text            |
| `statusColumn(field, header, toStatus?)`       | ✅       | —                 | `StatusChip` off the field, or off `toStatus(row)` |
| `derivedStatusColumn(colId, header, toStatus)` | —        | —                 | `StatusChip` with no backing field                 |
| `boolColumn(field, header)`                    | ✅       | —                 | `BoolChip` (Yes/No)                                |
| `dateColumn(field, header, emptyText?)`        | ✅       | —                 | the date through the viewer's settings             |
| `actionsColumn(specs?, width?)`                | —        | —                 | the row's icon buttons                             |

Only text columns are wired to the server's `TableQueryInput.filters`, so everything else
opts out of the floating filter row rather than offering a filter that does nothing.

### Row actions

An action is declared without its handler:

```ts
import SendIcon from "@mui/icons-material/Send";
import {
  DELETE_ACTION,
  EDIT_ACTION,
  actionsColumn,
  type RowActionSpec,
} from "@exyconn/crud";

const SEND_ACTION: RowActionSpec = {
  key: "send",
  label: "send contract", // the button's accessible name
  icon: SendIcon,
  color: "primary",
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

An optional third argument, `extraFilters: TableFilterInput[]`, is appended to every page
request — a quick-filter toggle above the grid, or a drawer scoped to one parent record
(the product stock history filters on `productId`). They are read at fetch time, so a
page that changes them bumps its `refreshSignal` to make the grid re-read.

---

## `useCrudResource`

```ts
const crud = useCrudResource<LeadRow, PagedLeadRow>({
  label: "Lead", // "Lead deleted"
  onDelete: (row) => deleteLead({ variables: { id: row.id } }),
  confirmMessage: (row) => `Delete lead "${row.name}"?`,
  refetch: refetchStats, // optional
});
```

Two type parameters because the grid's paged row type and the form's row type are
separate generated types; the second defaults to the first (the `DataTable` pages pass
only one).

Returns the dialog state (`open`, `editing`, `openCreate`, `openEdit`, `close`), the
`refreshSignal` the grid watches, `reload()`, `onDone()` (reload **and** close — hand it
straight to a form) and `remove(row)` (confirm → delete → evict the row from the Apollo
cache → reload → toast). A bumped `refreshSignal` makes `ServerDataGrid` re-read its rows in
place (`refreshInfiniteCache`), so a deleted row just leaves the page; the evicted row leaves
every client-side list holding it at once.

`remove` and `reload` report failures through the shared notifier. That is a deliberate
change from the code this replaced, where a rejected delete or refetch surfaced only as
an unhandled promise rejection in the console.

---

## `CrudDashboard`

```tsx
<CrudDashboard
  title="CRM"
  subtitle="Leads & pipeline"
  entityLabel="lead" // drives "New lead" and the drawer's "Edit lead"
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
`toolbar` renders between the stat tiles and the grid (the support console's quick
filters), `extraDialogs` holds secondary drawers a row action opens (send, details), and
`children` renders under the grid. `initialSearch` is what the search box (grid or phone
card list) holds when it mounts — the CRM lists pass a saved view's search, and give the
dashboard a `key` that changes when a view is opened so the box is seeded again.

`permissionModule` names the module this screen is restricted under in
Admin › Roles & Permissions. Set it and the "New …" button, the edit/delete row actions
and the "Export CSV" button each disappear for a role that has that action switched off —
the handler keys come out of the grid context, so the buttons stop rendering without the
column model changing. The export also asks the server `canExport(module)` once before it
starts paging, because an export is served by the module's own list resolver and would
otherwise have no request of its own to guard. The server enforces all of this
independently; the prop only stops a screen offering what would be refused.

`crud` and `renderForm` may be omitted for a grid whose rows are made elsewhere — the
support console lists tickets employees raise. There is then no "New …" button and no
create drawer, and the page passes its own `refreshSignal`.

---

## A module end to end

`leads-grid.tsx` — the column model:

```tsx
import type { ColDef } from "ag-grid-community";
import {
  actionsColumn,
  statusColumn,
  textColumn,
  valueColumn,
  type CrudGridContext,
} from "@exyconn/crud";
import type { ListLeadsPagedQuery } from "@exyconn/shell/graphql/generated";

export type PagedLeadRow =
  ListLeadsPagedQuery["listLeadsPaged"]["rows"][number];
export type LeadsGridContext = CrudGridContext<PagedLeadRow>;

export const LEAD_COLUMNS: ColDef<PagedLeadRow>[] = [
  textColumn("name", "Name"),
  textColumn("email", "Email"),
  statusColumn("source", "Source"),
  valueColumn("value", "Value", (row) => row.value.toLocaleString()),
  statusColumn("stage", "Stage"),
  actionsColumn(),
];
```

`CrmPage.tsx` — the page:

```tsx
export function CrmPage() {
  const { data: statsData, refetch: refetchStats } = useListLeadsStatsQuery();
  const [deleteLead] = useDeleteLeadMutation();

  const crud = useCrudResource<LeadRow, PagedLeadRow>({
    label: "Lead",
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
    { label: "Leads", value: String(statTotal(stats)), accent: "#4f8cff" },
    {
      label: "Won",
      value: String(statCount(stats, "stage", "WON")),
      accent: "#7be37b",
    },
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
        <LeadForm
          initial={initial}
          onCancel={crud.close}
          onDone={crud.onDone}
        />
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

A `DataTable` with a row delete also takes `bulkEntity`, the GraphQL record type its rows are
(`bulkEntity="Holiday"` beside `deleteHoliday(id)`). Rows then get checkboxes (a header box
ticks them all) and the toolbar "{count} selected", "Delete selected" and "Clear selection".
The delete is confirmed, then queued as a server-side job by entity — the server resolves
`delete<Entity>(id)` through the schema and runs it per row, guards and audit included — and
once it ends the rows that went are evicted from the Apollo cache, so nothing is refetched.
The page needs no code of its own beyond the prop.

Every `DataTable` also takes the list query's `loading` and `refetch`:
`loading={loading} onRefresh={refetch}`. `loading` draws skeleton rows until the first rows
arrive; rows already on screen stay while a refetch runs (after a delete, say), so nothing
flashes. `onRefresh` adds a Refresh button that is disabled while loading. Leave "Loading…" out of `emptyMessage` — the skeleton says it. A
query that polls passes `loading && networkStatus !== NetworkStatus.poll`, so a background
poll does not blank the table every interval.

## Loading, refresh and locking in `ServerDataGrid`

Every server-paged grid gets these without any module code:

- **Skeleton rows.** The default column's `cellRendererSelector` draws a skeleton in every
  cell of a row whose page has not arrived; it wins over the column's own renderer, so
  column factories never see a row without `data`.
- **Locked while loading.** While any page request is in flight the grid is `inert`: the
  search box, Refresh, sort headers, column filters, pager and row actions all ignore
  input, so nothing queues behind the running request. Whatever held focus gets it back
  when the rows arrive.
- **Refresh button** beside the search box, re-reading the current page from the server.
- **Debounced input.** The search box and text filters wait `SEARCH_DEBOUNCE_MS` (300 ms)
  of quiet before querying, and a search that trims to what was already loaded — the
  empty box on mount, say — does not query at all.
- **Load failures** show an error above the grid until a later request succeeds.
- **Bulk actions.** When `tableBulkInfo(list)` says the list (`fetchRows.list`, or the
  `bulkList` prop) is deletable or archivable, rows get checkboxes and the toolbar a
  "Select page" button (ag-grid's header checkbox needs a client-side model). While rows
  are selected a bar announces "{count} selected" and offers "Delete selected" (destructive
  confirm), "Archive selected" — or "Restore selected" with the **Archived** switch on, which
  reloads the grid with `archived: true` — and "Clear selection". Selection is by position,
  so any reload, search, sort or filter clears it.
- **Bulk jobs, never a lock.** The action is one `startTableBulkJob` call that answers at once
  with a job; the selection clears and the grid stays fully usable (search, paging, rows).
  The toolbar shows the job's progress ("Deleting 340 of 1,240…", polled from
  `tableBulkJob(id)` every second) with a button to hide it; only the bulk buttons wait for
  the job. When it ends the toast names the counts (and the first failure's reason), the
  rows are re-read in place, and `onBulkDone` lets the host re-read its stats
  (`CrudDashboard` wires it to the resource's `reload`).
- **Select all matching.** ag-grid cannot select across the infinite model, so while rows
  are ticked and the server's `totalCount` for the current query (search, column filters,
  sorts, Archived switch — exactly what the last page loaded with) is larger, the bar offers
  "Select all {total} matching". Chosen, it reads "All {total} matching rows are selected"
  and the confirm names the full count ("Delete 1,240 rows matching the current filters?").
  The browser never collects the ids: the job carries the variables the fetcher sends its
  own list query (`fetchRows.variablesFor` — `usePagedFetcher` sets it, extra filters
  included; the CRM's record fetcher sets its own), and the server pages through that query
  as the person, reading only ids. Up to 50,000 rows per job; more is refused at once with
  a request to narrow the search or filters. A fetcher without `variablesFor` is not offered
  the mode. Ticking or unticking a row, or anything that clears the selection, leaves it.

### The job on the server (`modules/table-transfer`)

`startTableBulkJob(input: { list | entity, action, ids | variables })` checks everything up
front (the action exists for the list or entity, the matching query runs for this person,
the row cap) and writes a `TableBulkJob` (tenant-scoped, kept seven days after it ends).
The worker (`startTableBulkJobs`, a registered background job) claims the company's oldest
job no live pass holds with a lease, works in chunks of 25 for a slice of a few seconds and
saves its cursor after every chunk; a pass that dies lets its lease lapse and the next one
resumes there. Each record goes through the module's own `delete<Entity>(id)` (or the list's
registered archiver) as the person who started the job — re-read every pass, so a blocked
account stops its jobs — with every guard and audit entry a single delete has. A record
already gone counts as deleted, so a resumed chunk is safe to re-run; a FORBIDDEN stops the
whole job. Failures keep their reason (the first 100) and are counted in full.

## Tests

`packages/crud/__tests__/unit-tests/columns.test.ts` covers the column factories: which
columns stay filterable, what a formatter returns for a not-yet-loaded row, how
`dateColumn` reaches `formatDate` through the context, and how `actionsColumn` sizes
itself. Add a case there when you add a factory.
