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

Depends on `@exyconn/shell`; nothing depends on it but the apps.

Full reference, including a module end to end:
[docs/portal/crud-kit.md](../../docs/portal/crud-kit.md).
