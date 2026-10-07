import { describe, expect, it } from 'vitest';
import type { ValueFormatterParams } from 'ag-grid-community';
import {
  STATUS_MONITOR_COLUMNS,
  type PagedStatusMonitorRow,
} from '../../../../src/pages/status-monitors/status-monitors-grid';
import { STATUS_CATEGORIES } from '../../../../src/pages/status-monitors/status-monitors.constants';
import { StatusCategory } from '@exyconn/shell/graphql/generated';

const column = (field: string) => STATUS_MONITOR_COLUMNS.find((col) => col.field === field);

describe('STATUS_MONITOR_COLUMNS', () => {
  it('lists the monitor fields in grid order, actions last', () => {
    expect(STATUS_MONITOR_COLUMNS.map((col) => col.headerName)).toEqual([
      'Service',
      'Key',
      'Category',
      'URL',
      'State',
      'Response',
      'Last checked',
      'Shown',
      '',
    ]);
    expect(STATUS_MONITOR_COLUMNS[STATUS_MONITOR_COLUMNS.length - 1].colId).toBe('actions');
  });

  it('shows the last response time in milliseconds', () => {
    const format = column('lastResponseMs')?.valueFormatter as (
      params: ValueFormatterParams<PagedStatusMonitorRow>,
    ) => string;
    const row = { lastResponseMs: 182 } as PagedStatusMonitorRow;
    const params = { data: row, context: { t: (source: string) => source } };
    expect(format(params as unknown as ValueFormatterParams<PagedStatusMonitorRow>)).toBe('182 ms');
  });
});

describe('STATUS_CATEGORIES', () => {
  it('offers exactly the categories the server accepts', () => {
    expect(STATUS_CATEGORIES).toEqual(Object.values(StatusCategory));
    expect(STATUS_CATEGORIES).toContain(StatusCategory.Api);
  });
});
