# `@exyconn/crud`

The server-paged CRUD kit: ag-grid column factories, the paged fetcher, the hook that
owns create/edit/delete state, and the dashboard that composes all three. A module
supplies only its column model, its GraphQL documents and its form.

```tsx
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
```

`CrudDashboard` (and `RecordCardList`) take an optional `initialSearch` that seeds the
search box when they mount — the CRM lists use it for a saved view's search.

Bulk actions come for free: when the server's `tableBulkInfo` says the grid's list
(`fetchRows.list`, or the optional `bulkList` prop for a fetcher that names none — the CRM's
`searchCompanies`, say) is deletable or archivable, `ServerDataGrid` adds row checkboxes, a
"Select page" button, an Archived switch and a bar with "Delete / Archive / Restore selected"
(confirmed first). The action is queued as one server-side job (`startTableBulkJob`) and the
grid stays usable while it runs: the toolbar shows "Deleting 340 of 1,240…" (dismissable),
the toast reports the counts when it ends, and the rows are re-read in place. With rows
ticked the bar also offers "Select all {total} matching" — every row the current search,
filters, sort and Archived switch match. The grid then sends the fetcher's own query
variables (`fetchRows.variablesFor`, set by `usePagedFetcher`; the CRM's fetcher sets its own)
and the server pages through the matching ids itself, up to 50,000. The dashboard's stat
tiles re-read afterwards through the resource's `reload`. Phones keep the card list, without
bulk actions.

`useCrudResource.remove` drops the deleted row from the Apollo cache and bumps the
`refreshSignal`, which the grid answers by re-reading its rows in place
(`refreshInfiniteCache`) — no skeleton flash, no jump back to the first page. Each row action
in `actionsColumn` shows its label as a tooltip.

Depends on `@exyconn/shell`; nothing depends on it but the apps.

Full reference, including a module end to end:
[docs/portal/crud-kit.md](../../docs/portal/crud-kit.md).
