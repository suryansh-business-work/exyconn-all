import { describe, expect, it } from 'vitest';
import type { ColDef, ValueFormatterParams } from 'ag-grid-community';
import type { RowActionSpec } from '@exyconn/crud';
import { AiJobStatus } from '@exyconn/shell/graphql/generated';
import {
  AI_JOB_COLUMNS,
  formatCostUsd,
  type PagedAiJobRow,
} from '../../../../src/pages/ai/ai-jobs-grid';

const row = (over: Partial<PagedAiJobRow> = {}): PagedAiJobRow => ({
  id: 'job-1',
  name: 'Digest',
  model: 'gpt-4o-mini',
  prompt: 'Summarise',
  status: AiJobStatus.Succeeded,
  totalTokens: 12345,
  costUsd: 0.00123,
  latencyMs: 800,
  queuedAt: null,
  ranAt: '2026-10-01T10:00:00.000Z',
  createdByName: 'Asha',
  ...over,
});

const column = (key: string): ColDef<PagedAiJobRow> => {
  const found = AI_JOB_COLUMNS.find((col) => col.field === key || col.colId === key);
  if (!found) {
    throw new Error(`No column ${key}`);
  }
  return found;
};

const format = (key: string, data: PagedAiJobRow | undefined) => {
  const formatter = column(key).valueFormatter as (
    p: ValueFormatterParams<PagedAiJobRow>,
  ) => string;
  return formatter({
    data,
    context: { t: (s: string) => s },
  } as ValueFormatterParams<PagedAiJobRow>);
};

const runAction = (): RowActionSpec => {
  const specs = column('actions').cellRendererParams.actionSpecs as RowActionSpec[];
  return specs[0];
};

describe('formatCostUsd', () => {
  it('shows four decimals for a priced run', () => {
    expect(formatCostUsd(0.00123, true)).toBe('$0.0012');
    expect(formatCostUsd(2, true)).toBe('$2.0000');
  });

  it('shows a dash for a job never run or a run with no price on file', () => {
    expect(formatCostUsd(0.5, false)).toBe('—');
    expect(formatCostUsd(0, true)).toBe('—');
  });
});

describe('AI_JOB_COLUMNS', () => {
  it('lists the register columns in order, ending with the actions', () => {
    expect(AI_JOB_COLUMNS.map((col) => col.field ?? col.colId)).toEqual([
      'name',
      'model',
      'status',
      'createdByName',
      'totalTokens',
      'costUsd',
      'ranAt',
      'actions',
    ]);
  });

  it('names who ran a job, or a dash when nobody has', () => {
    expect(format('createdByName', row())).toBe('Asha');
    expect(format('createdByName', row({ createdByName: '' }))).toBe('—');
  });

  it('formats tokens and cost from the row', () => {
    expect(format('totalTokens', row())).toBe((12345).toLocaleString());
    expect(format('costUsd', row())).toBe('$0.0012');
    expect(format('costUsd', row({ ranAt: null }))).toBe('—');
  });

  it('renders nothing while a row is still loading', () => {
    expect(format('costUsd', undefined)).toBe('');
  });

  it('dates the last run through the viewer formatter, with a dash when never run', () => {
    const formatter = column('ranAt').valueFormatter as (p: unknown) => string;
    const context = { formatDate: (value: string) => `on ${value}`, t: (s: string) => s };
    expect(formatter({ value: '2026-10-01', context })).toBe('on 2026-10-01');
    expect(formatter({ value: null, context })).toBe('—');
  });

  it('hides Run on a job already waiting or running, so it is never sent twice', () => {
    const hidden = runAction().hidden as (r: PagedAiJobRow) => boolean;
    expect(hidden(row({ status: AiJobStatus.Running }))).toBe(true);
    expect(hidden(row({ status: AiJobStatus.Queued, queuedAt: '2026-10-01T10:00:00Z' }))).toBe(
      true,
    );
    expect(hidden(row({ status: AiJobStatus.Queued, queuedAt: null }))).toBe(false);
    expect(hidden(row({ status: AiJobStatus.Failed }))).toBe(false);
  });

  it('offers run, view, edit and delete actions', () => {
    const specs = column('actions').cellRendererParams.actionSpecs as RowActionSpec[];
    expect(specs.map((spec) => spec.key)).toEqual(['run', 'view', 'edit', 'delete']);
  });
});
