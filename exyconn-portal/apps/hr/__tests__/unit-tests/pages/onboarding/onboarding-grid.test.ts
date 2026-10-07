import { describe, expect, it } from 'vitest';
import type { ColDef, ValueGetterParams } from 'ag-grid-community';
import { interpolate } from '@exyconn/i18n';
import {
  DETAILS_ACTION,
  ONBOARDING_COLUMNS,
  progressLabel,
  type PagedOnboardingChecklistRow,
} from '../../../../src/pages/onboarding/onboarding-grid';
import { actionKeys, columnIds, formatCell } from '../../harness/grid';
import { checklist, onboardingItem } from './onboarding-fixture';

type Row = PagedOnboardingChecklistRow;

/** The state chip's value, read the way ag-grid reads a value getter. */
function stateOf(row: Row | undefined): unknown {
  const column = ONBOARDING_COLUMNS.find((col) => col.colId === 'state') as ColDef<Row>;
  const getter = column.valueGetter as (params: ValueGetterParams<Row>) => unknown;
  return getter({ data: row, context: { t: interpolate } } as ValueGetterParams<Row>);
}

describe('progressLabel', () => {
  it('counts the ticked tasks against the total and adds the percentage', () => {
    expect(progressLabel(checklist(), interpolate)).toBe('1 of 2 done (50%)');
  });

  it('reads zero of zero for a checklist with no tasks', () => {
    expect(progressLabel(checklist({ items: [], progressPercent: 0 }), interpolate)).toBe(
      '0 of 0 done (0%)',
    );
  });

  it('hands the sentence to the translator rather than gluing it together', () => {
    const translated = progressLabel(
      checklist({ items: [onboardingItem({ done: true })], progressPercent: 100 }),
      (source, values) => `[${interpolate(source, values)}]`,
    );
    expect(translated).toBe('[1 of 1 done (100%)]');
  });
});

describe('ONBOARDING_COLUMNS', () => {
  it('lays out employee, template, join date, progress, state and the actions', () => {
    expect(columnIds(ONBOARDING_COLUMNS)).toEqual([
      'employeeName',
      'templateName',
      'joinDate',
      'progress',
      'state',
      'actions',
    ]);
  });

  it('offers opening the checklist before deleting it', () => {
    expect(actionKeys(ONBOARDING_COLUMNS)).toEqual(['details', 'delete']);
    expect(DETAILS_ACTION).toMatchObject({ label: 'open checklist', color: 'primary' });
  });

  it('formats the progress column from the whole row, and nothing while it loads', () => {
    expect(formatCell(ONBOARDING_COLUMNS, 'progress', checklist(), { t: interpolate })).toBe(
      '1 of 2 done (50%)',
    );
    expect(formatCell(ONBOARDING_COLUMNS, 'progress', undefined)).toBe('');
  });

  it('shows a finished checklist as complete and an open one as in progress', () => {
    expect(stateOf(checklist({ complete: true }))).toBe('COMPLETE');
    expect(stateOf(checklist())).toBe('IN_PROGRESS');
    expect(stateOf(undefined)).toBeNull();
  });
});
