import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import type { ValueFormatterParams } from 'ag-grid-community';
import { UsageHistoryPanel } from '../../../../../src/pages/environment-variables/usage/UsageHistoryPanel';
import {
  CALL_COLUMNS,
  type CallsGridContext,
  type IntegrationCallRow,
} from '../../../../../src/pages/environment-variables/usage/calls-grid';
import { renderWithProviders } from '../../../test-utils';
import { propsOf } from '../panel.harness';

const gql = vi.hoisted(() => ({ stats: vi.fn() }));

vi.mock('@exyconn/shell/components/data/ServerDataGrid', async () =>
  (await import('../panel.harness')).propsModule('ServerDataGrid'),
);
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListIntegrationCallsStatsQuery: gql.stats,
}));

const call = (patch: Partial<IntegrationCallRow> = {}): IntegrationCallRow =>
  ({
    id: 'c1',
    provider: 'OPENAI',
    action: 'gpt-x',
    ok: true,
    durationMs: 812,
    inputTokens: 1000,
    outputTokens: 500,
    costUsd: 0.00045,
    companyId: '',
    actorEmail: 'sales@exyconn.com',
    source: 'https://crm.exyconn.com',
    path: '/graphql',
    error: '',
    createdAt: '2026-10-26T10:00:00.000Z',
    ...patch,
  }) as IntegrationCallRow;

const formatted = (
  field: string,
  row: IntegrationCallRow | undefined,
  context: CallsGridContext,
) => {
  const col = CALL_COLUMNS.find((c) => c.field === field || c.colId === field);
  const format = col?.valueFormatter as (p: ValueFormatterParams<IntegrationCallRow>) => string;
  return format({ data: row, context } as ValueFormatterParams<IntegrationCallRow>);
};

describe('usage history', () => {
  it('totals calls, failures, priced cost and tokens', () => {
    gql.stats.mockReturnValue({
      loading: false,
      data: {
        listIntegrationCallsStats: {
          total: 12,
          counts: [{ field: 'ok', buckets: [{ value: 'false', count: 3 }] }],
          sums: [
            { field: 'costUsd', total: 1.5 },
            { field: 'inputTokens', total: 1000 },
            { field: 'outputTokens', total: 500 },
          ],
        },
      },
    });
    renderWithProviders(<UsageHistoryPanel />);

    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('$1.50')).toBeInTheDocument();
    expect(screen.getByText('1,500')).toBeInTheDocument();
    const context = propsOf('ServerDataGrid').context as CallsGridContext;
    expect(context.formatUsd(0.00045)).toBe('$0.00045');
  });

  it('formats each cell: time, cost or a dash, tokens, who and errors', () => {
    const context: CallsGridContext = {
      formatDateTime: (v) => `at ${v}`,
      formatUsd: (v) => `$${v}`,
    };
    expect(formatted('createdAt', call(), context)).toBe('at 2026-10-26T10:00:00.000Z');
    expect(formatted('createdAt', undefined, context)).toBe('');
    expect(formatted('costUsd', call(), context)).toBe('$0.00045');
    expect(formatted('costUsd', call({ costUsd: null }), context)).toBe('—');
    expect(formatted('provider', call(), context)).toBe('OpenAI');
    expect(formatted('inputTokens', call(), context)).toBe('1000 / 500');
    expect(formatted('inputTokens', call({ inputTokens: 0, outputTokens: 0 }), context)).toBe('—');
    expect(formatted('actorEmail', call({ actorEmail: '' }), context)).toBe('—');
    expect(formatted('error', call({ error: 'HTTP 500' }), context)).toBe('HTTP 500');
    expect(formatted('error', call(), context)).toBe('—');
    expect(formatted('durationMs', call(), context)).toBe('812');
    const result = CALL_COLUMNS.find((c) => c.colId === 'result')?.valueGetter as (p: {
      data: IntegrationCallRow;
      context: object;
    }) => string;
    expect(result({ data: call(), context })).toBe('SUCCEEDED');
    expect(result({ data: call({ ok: false }), context })).toBe('FAILED');
  });
});
