import { describe, expect, it } from 'vitest';
import type { ColDef, ValueFormatterParams } from 'ag-grid-community';
import type { RowActionSpec } from '@exyconn/crud';
import {
  CLAUDE_ACTION,
  LOG_COLUMNS,
  RESOLVE_ACTION,
  VIEW_ACTION,
  type AppLogRow,
} from '../../../../src/pages/logs/logs-grid';
import { logRow } from './log.fixtures';

function column(id: string): ColDef<AppLogRow> {
  const found = LOG_COLUMNS.find((col) => (col.field ?? col.colId) === id);
  if (!found) {
    throw new Error(`No column ${id}`);
  }
  return found;
}

function cell(id: string, row: AppLogRow | undefined): string {
  const format = column(id).valueFormatter;
  if (typeof format !== 'function') {
    throw new TypeError(`Column ${id} has no formatter`);
  }
  return format({ data: row, value: undefined, context: {} } as ValueFormatterParams<AppLogRow>);
}

describe('LOG_COLUMNS', () => {
  it('lists the problem columns newest first, with the row actions last', () => {
    expect(LOG_COLUMNS.map((col) => col.field ?? col.colId)).toEqual([
      'lastSeenAt',
      'level',
      'source',
      'app',
      'message',
      'count',
      'userCount',
      'lastUserName',
      'route',
      'platform',
      'appVersion',
      'status',
      'firstSeenAt',
      'actions',
    ]);
  });

  it('leads the message with the error’s name when it has one', () => {
    expect(cell('message', logRow())).toBe('TypeError: Cannot read properties of undefined');
    expect(cell('message', logRow({ errorName: '' }))).toBe('Cannot read properties of undefined');
  });

  it('writes counts the way the viewer reads numbers', () => {
    expect(cell('count', logRow())).toBe((1200).toLocaleString());
    expect(cell('userCount', logRow({ userCount: 4500 }))).toBe((4500).toLocaleString());
  });

  it('names the last person by name, then email, then a dash', () => {
    expect(cell('lastUserName', logRow())).toBe('Asha Rao');
    expect(cell('lastUserName', logRow({ lastUserName: '' }))).toBe('asha@example.test');
    expect(cell('lastUserName', logRow({ lastUserName: '', lastUserEmail: '' }))).toBe('—');
  });

  it('leaves a row that is still loading blank', () => {
    expect(cell('message', undefined)).toBe('');
  });

  it('offers view, Claude, resolve and delete on every row', () => {
    const params = column('actions').cellRendererParams as { actionSpecs: RowActionSpec[] };

    expect(params.actionSpecs.map((spec) => spec.key)).toEqual([
      'view',
      'claude',
      'resolve',
      'delete',
    ]);
    expect(params.actionSpecs.slice(0, 3)).toEqual([VIEW_ACTION, CLAUDE_ACTION, RESOLVE_ACTION]);
    expect(CLAUDE_ACTION.color).toBe('primary');
    expect(RESOLVE_ACTION.color).toBe('success');
  });
});
