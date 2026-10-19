import { describe, expect, it } from 'vitest';
import { CAMPAIGN_COLUMNS } from '../../../../src/pages/marketing/campaigns-grid';
import { actionSpecs, columnIds, formatCell } from '../../grid-helpers';
import { campaignRow } from '../../fixtures';

const formatDate = (value: string) => `on ${value}`;

describe('CAMPAIGN_COLUMNS', () => {
  it('lists the campaign register columns, with the actions last', () => {
    expect(columnIds(CAMPAIGN_COLUMNS)).toEqual([
      'name',
      'campaignType',
      'subject',
      'sendState',
      'lastSentAt',
      'budget',
      'actions',
    ]);
  });

  it('shows the subject, or a dash before one is written', () => {
    expect(formatCell(CAMPAIGN_COLUMNS, 'subject', campaignRow())).toBe('Festive savings');
    expect(formatCell(CAMPAIGN_COLUMNS, 'subject', campaignRow({ subject: '' }))).toBe('—');
    expect(formatCell(CAMPAIGN_COLUMNS, 'subject', campaignRow({ subject: null }))).toBe('—');
    expect(formatCell(CAMPAIGN_COLUMNS, 'subject', undefined)).toBe('');
  });

  it('writes the budget as a grouped number', () => {
    expect(formatCell(CAMPAIGN_COLUMNS, 'budget', campaignRow({ budget: 250000 }))).toBe(
      (250000).toLocaleString(),
    );
  });

  it('dates the last send through the viewer settings, or a dash when never sent', () => {
    const row = campaignRow({ lastSentAt: '2026-09-02T00:00:00.000Z' });

    expect(
      formatCell(CAMPAIGN_COLUMNS, 'lastSentAt', row, {
        value: row.lastSentAt,
        context: { formatDate },
      }),
    ).toBe('on 2026-09-02T00:00:00.000Z');
    expect(
      formatCell(CAMPAIGN_COLUMNS, 'lastSentAt', campaignRow(), {
        value: null,
        context: { formatDate },
      }),
    ).toBe('—');
  });

  it('offers view and send before the default edit and delete actions', () => {
    const specs = actionSpecs(CAMPAIGN_COLUMNS);

    expect(specs.map((spec) => spec.key)).toEqual(['view', 'send', 'edit', 'delete']);
    expect(specs[0].label).toBe('view campaign');
    expect(specs[1]).toMatchObject({ label: 'review and send', color: 'primary' });
  });
});
