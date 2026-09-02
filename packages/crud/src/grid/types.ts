import type { SvgIconComponent } from '@mui/icons-material';

/** Colour accepted by the design-system IconButton for a row action. */
export type RowActionColor =
  'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';

/**
 * Declarative description of one icon button in a grid's actions column. The
 * handler is not part of the spec: `key` looks it up in the grid context, so the
 * column model stays a module-level constant while handlers stay per-render.
 */
export interface RowActionSpec {
  key: string;
  /** Accessible name of the button, e.g. "edit" or "send contract". */
  label: string;
  icon: SvgIconComponent;
  color?: RowActionColor;
}

/** Shape every CRUD grid puts on ag-grid's `context` so the shared cells can read it. */
export interface CrudGridContext<TRow> {
  /** Row handlers keyed by {@link RowActionSpec.key}. */
  actions: Record<string, (row: TRow) => void>;
}

/** Context for a grid that renders at least one {@link dateColumn}. */
export interface DatedCrudGridContext<TRow> extends CrudGridContext<TRow> {
  /** Formats an ISO date in the signed-in user's timezone and format. */
  formatDate: (value: string) => string;
}
