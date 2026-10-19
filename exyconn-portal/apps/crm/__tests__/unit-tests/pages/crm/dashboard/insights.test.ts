import { describe, expect, it } from 'vitest';
import { CrmInsightKind, CrmInsightTone } from '@exyconn/shell/graphql/generated';
import { humanize, insightCopy } from '../../../../../src/pages/crm/dashboard/insights';
import { percentOf } from '../../../../../src/pages/crm/dashboard/dashboard.tiles';

const insight = (kind: CrmInsightKind, over: Record<string, unknown> = {}) => ({
  kind,
  tone: CrmInsightTone.Warning,
  count: 3,
  label: '',
  compareLabel: '',
  ratio: 0,
  days: 0,
  ...over,
});

describe('an insight’s sentence', () => {
  it('uses the singular for one and the plural otherwise, with a link to act on it', () => {
    expect(insightCopy(insight(CrmInsightKind.OverdueReminders, { count: 1 }))).toMatchObject({
      text: '1 reminder is overdue',
      to: '/calendar',
    });
    expect(insightCopy(insight(CrmInsightKind.OverdueTasks)).text).toBe(
      '{count} tasks are overdue',
    );
  });

  it('names the groups in words', () => {
    const copy = insightCopy(
      insight(CrmInsightKind.CompanyOriginConversion, {
        count: 1,
        label: 'GOOGLE_PLACES',
        compareLabel: 'WEBSITE',
        ratio: 2,
      }),
    );

    expect(copy.text).toContain('become clients {ratio}×');
    expect(copy.values).toMatchObject({ label: 'Google places', compare: 'Website', ratio: 2 });
    expect(copy.to).toBe('/companies');
  });

  it('writes enum values as words and shares as percents', () => {
    expect(humanize('NEGOTIATION')).toBe('Negotiation');
    expect(percentOf(0.666)).toBe('67%');
    expect(percentOf(null)).toBe('—');
  });
});
