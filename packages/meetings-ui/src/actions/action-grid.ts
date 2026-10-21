import type { ColDef } from 'ag-grid-community';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {
  DELETE_ACTION,
  EDIT_ACTION,
  actionsColumn,
  boolColumn,
  statusColumn,
  textColumn,
  type RowActionSpec,
} from '@exyconn/crud';
import type { ActionItemRow } from '../forms/action-item';
import { DoneCell, DueCell, OwnerCell, SelectCell } from './action-cells';

const DETAILS_ACTION: RowActionSpec = {
  key: 'details',
  label: 'comments and history',
  icon: InfoOutlinedIcon,
};

const NARROW = { width: 64, flex: 0, sortable: false, filter: false, floatingFilter: false };

const selectColumn: ColDef<ActionItemRow> = {
  colId: 'select',
  headerName: '',
  cellRenderer: SelectCell,
  ...NARROW,
};

const doneColumn: ColDef<ActionItemRow> = {
  colId: 'done',
  headerName: 'Done',
  cellRenderer: DoneCell,
  ...NARROW,
};

const ownerColumn: ColDef<ActionItemRow> = {
  field: 'assignedTo',
  headerName: 'Owner',
  cellRenderer: OwnerCell,
  minWidth: 200,
};

const dueColumn: ColDef<ActionItemRow> = {
  field: 'dueDate',
  headerName: 'Due',
  cellRenderer: DueCell,
  minWidth: 170,
  filter: false,
  floatingFilter: false,
};

const titleColumn: ColDef<ActionItemRow> = {
  ...textColumn<ActionItemRow>('title', 'Action'),
  flex: 1,
  minWidth: 240,
};

const trailing: ColDef<ActionItemRow>[] = [
  ownerColumn,
  dueColumn,
  statusColumn<ActionItemRow>('priority', 'Priority'),
  statusColumn<ActionItemRow>('status', 'Status'),
  boolColumn<ActionItemRow>('aiGenerated', 'AI suggested'),
  actionsColumn<ActionItemRow>([DETAILS_ACTION, EDIT_ACTION, DELETE_ACTION]),
];

/** The company or personal checklist: every meeting's actions, so each row names its meeting. */
export const ACTION_COLUMNS: ColDef<ActionItemRow>[] = [
  selectColumn,
  doneColumn,
  titleColumn,
  textColumn<ActionItemRow>('meetingTitle', 'Meeting'),
  ...trailing,
];

/** One meeting's checklist: the meeting is the page, so the column is left out. */
export const MEETING_ACTION_COLUMNS: ColDef<ActionItemRow>[] = [
  selectColumn,
  doneColumn,
  titleColumn,
  ...trailing,
];
