/**
 * `@exyconn/crud` — the building blocks every server-paged CRUD module in the portal
 * shares: an ag-grid column vocabulary, the paged fetcher that drives it, the hook
 * that owns create/edit/delete state and the dashboard that composes all three.
 *
 * A module supplies only what makes it different: its columns, its GraphQL documents
 * and its form.
 */
export {
  EDIT_ACTION,
  DELETE_ACTION,
  actionsColumn,
  boolColumn,
  dateColumn,
  derivedColumn,
  derivedStatusColumn,
  statusColumn,
  textColumn,
  valueColumn,
} from './grid/columns';
export type {
  CrudGridContext,
  DatedCrudGridContext,
  RowActionColor,
  RowActionSpec,
} from './grid/types';
export { usePagedFetcher } from './grid/usePagedFetcher';
export {
  useCrudResource,
  type CrudResource,
  type UseCrudResourceOptions,
} from './page/useCrudResource';
export { CrudDashboard } from './page/CrudDashboard';
export { RecordCardList } from './list/RecordCardList';
export { toRecordCard, cardActionSpecs, type CardField, type RecordCard } from './list/recordCard';
export { cellValue, isDisplayColumn, type DisplayColDef } from './grid/cellValue';
export {
  ExportCsvButton,
  GridExportButton,
  useGridQuery,
  type GridQueryTracker,
} from './page/ExportCsvButton';
export { csvColumnsFromDefs, fetchAllRows, EXPORT_PAGE_SIZE } from './page/export';
export { assertExportAllowed, contextWithoutActions, deniedActionKeys } from './page/permissions';
