import { describe, expect, it } from 'vitest';
import type { ColDef, ValueFormatterParams } from 'ag-grid-community';
import { SLA_POLICY_COLUMNS, asDuration } from '../../../../../src/pages/support/sla';
import type { PagedSlaPolicyRow } from '../../../../../src/pages/support/sla/sla-policies-grid';
import { slaPolicyRow } from '../../../fixtures';

type Formatter = (params: ValueFormatterParams<PagedSlaPolicyRow>) => string;

const shown = (id: string, data: PagedSlaPolicyRow | undefined) => {
  const found = SLA_POLICY_COLUMNS.find((col: ColDef<PagedSlaPolicyRow>) => col.field === id);
  if (!found) {
    throw new Error(`No column ${id}`);
  }
  return (found.valueFormatter as Formatter)({
    data,
    context: { t: (source: string) => source },
  } as ValueFormatterParams<PagedSlaPolicyRow>);
};

describe('asDuration', () => {
  it('keeps anything under an hour in minutes', () => {
    expect(asDuration(1)).toBe('1 min');
    expect(asDuration(59)).toBe('59 min');
  });

  it('reads an hour or more in hours, whole when it divides evenly', () => {
    expect(asDuration(60)).toBe('1 h');
    expect(asDuration(480)).toBe('8 h');
    expect(asDuration(43200)).toBe('720 h');
  });

  it('gives a part hour to one decimal place', () => {
    expect(asDuration(90)).toBe('1.5 h');
    expect(asDuration(100)).toBe('1.7 h');
  });
});

describe('SLA_POLICY_COLUMNS', () => {
  it('lists the priority, both promises, whether it is active, then the row actions', () => {
    expect(SLA_POLICY_COLUMNS.map((col) => col.colId ?? col.field)).toEqual([
      'priority',
      'firstResponseMinutes',
      'resolutionMinutes',
      'active',
      'actions',
    ]);
  });

  it('shows both promises as durations', () => {
    const row = slaPolicyRow({ firstResponseMinutes: 30, resolutionMinutes: 1440 });
    expect(shown('firstResponseMinutes', row)).toBe('30 min');
    expect(shown('resolutionMinutes', row)).toBe('24 h');
  });

  it('shows nothing while a row is still loading', () => {
    expect(shown('firstResponseMinutes', undefined)).toBe('');
  });
});
