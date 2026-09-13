import type { ColDef } from 'ag-grid-community';
import { cellValue, isDisplayColumn, type DisplayColDef } from '../grid/cellValue';
import { BoolCell, StatusCell } from '../grid/cells';
import type { RowActionSpec } from '../grid/types';

/** One line of a record card: what the column is called, and what this row says for it. */
export interface CardField {
  key: string;
  label: string;
  value: string;
  /** Drawn as the shared status chip, as the grid draws it. */
  chip: boolean;
}

/** A row, as a phone reads it: a heading, a few facts, and what can be done to it. */
export interface RecordCard {
  title: string;
  fields: CardField[];
}

/** How many facts fit under a heading before a card stops being glanceable. */
const MAX_FIELDS = 5;

function text(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
}

const isChipColumn = <Row>(column: ColDef<Row>) =>
  column.cellRenderer === StatusCell || column.cellRenderer === BoolCell;

const columnKey = <Row>(column: DisplayColDef<Row>, index: number) =>
  column.colId ?? String(column.field ?? index);

/**
 * Turns the grid's own column model into a card.
 *
 * The columns are the single description of what a record IS, so the phone reads the same
 * ones rather than a second list somebody has to remember to update: the first column is the
 * heading (it is what the table leads with), and the next few are the facts under it. A cell
 * that renders as a chip in the table renders as a chip here.
 */
export function toRecordCard<Row>(
  columnDefs: readonly ColDef<Row>[],
  row: Row,
  context: object,
): RecordCard {
  const columns = columnDefs.filter(isDisplayColumn);
  const [heading, ...rest] = columns;
  const title = heading ? text(cellValue(heading, row, context)) : '';
  const all = rest
    .map((column, index) => ({
      key: columnKey(column, index),
      label: column.headerName,
      value: text(cellValue(column, row, context)),
      chip: isChipColumn(column),
    }))
    .filter((field) => field.value !== '');
  return { title, fields: withStatus(all.slice(0, MAX_FIELDS), all) };
}

/** Every record in the portal carries one, and it is the column that says where it stands. */
const STATUS_KEY = 'status';

/**
 * Makes room for the record's state.
 *
 * Where a record stands — paid, open, overdue — is what somebody scanning a list on a phone
 * is actually looking for, and on a wide register that column can sit past the fifth and fall
 * off the card. When it does, it takes the last slot.
 */
function withStatus(shown: CardField[], all: CardField[]): CardField[] {
  const status = all.find((field) => field.key === STATUS_KEY);
  if (!status || shown.includes(status)) {
    return shown;
  }
  return [...shown.slice(0, MAX_FIELDS - 1), status];
}

/** The row actions the grid pins to its last column, for the card's own buttons. */
export function cardActionSpecs<Row>(columnDefs: readonly ColDef<Row>[]): RowActionSpec[] {
  const actions = columnDefs.find((column) => column.colId === 'actions');
  const specs = (actions?.cellRendererParams as { actionSpecs?: RowActionSpec[] } | undefined)
    ?.actionSpecs;
  return specs ?? [];
}
