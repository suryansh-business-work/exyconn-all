import { describe, expect, it } from 'vitest';
import { formatMoney } from '@exyconn/shell/utils/money';
import {
  crmBreakdowns,
  crmStatItems,
  type CrmOverviewSource,
} from '../../../../src/pages/crm/crm-overview.tiles';
import { tableStats } from '../../fixtures';

const EMPTY: CrmOverviewSource = {
  leads: undefined,
  deals: undefined,
  companies: undefined,
  contacts: undefined,
  forecast: undefined,
};

const LOADED: CrmOverviewSource = {
  leads: tableStats(
    40,
    { stage: { NEW: 20, WON: 6 }, source: { WEBSITE: 30, EVENT: 10 } },
    { value: 500000 },
  ),
  deals: tableStats(12, { stage: { WON: 3, PROPOSAL: 9 } }, { value: 900000 }),
  companies: tableStats(15),
  contacts: tableStats(33),
  forecast: { openCount: 9, openValue: 640000, weightedValue: 210000 },
};

const valuesByLabel = (source: CrmOverviewSource) =>
  Object.fromEntries(crmStatItems(source).map((item) => [item.label, item.value]));

describe('crmStatItems', () => {
  it('walks the funnel from leads to won deals', () => {
    expect(valuesByLabel(LOADED)).toEqual({
      Leads: '40',
      'Leads won': '6',
      Companies: '15',
      Contacts: '33',
      'Open deals': '9',
      'Open pipeline': formatMoney(640000),
      'Weighted forecast': formatMoney(210000),
      'Deals won': `3 · ${formatMoney(900000)} total`,
    });
  });

  it('reads zero everywhere while nothing has loaded', () => {
    expect(valuesByLabel(EMPTY)).toEqual({
      Leads: '0',
      'Leads won': '0',
      Companies: '0',
      Contacts: '0',
      'Open deals': '0',
      'Open pipeline': formatMoney(0),
      'Weighted forecast': formatMoney(0),
      'Deals won': `0 · ${formatMoney(0)} total`,
    });
  });

  it('gives every tile an accent colour', () => {
    for (const item of crmStatItems(LOADED)) {
      expect(item.accent).toEqual(expect.any(String));
    }
  });
});

describe('crmBreakdowns', () => {
  it('spreads leads and deals across their stages, and leads across their sources', () => {
    const [leadStages, dealStages, leadSources] = crmBreakdowns(LOADED);

    expect(leadStages.title).toBe('Leads by stage');
    expect(leadStages.buckets).toEqual([
      { value: 'NEW', count: 20 },
      { value: 'WON', count: 6 },
    ]);
    expect(dealStages.title).toBe('Deals by stage');
    expect(dealStages.buckets).toEqual([
      { value: 'WON', count: 3 },
      { value: 'PROPOSAL', count: 9 },
    ]);
    expect(leadSources.title).toBe('Leads by source');
    expect(leadSources.buckets).toEqual([
      { value: 'WEBSITE', count: 30 },
      { value: 'EVENT', count: 10 },
    ]);
  });

  it('has no buckets while loading, or for a field the stats did not group by', () => {
    expect(crmBreakdowns(EMPTY).map((breakdown) => breakdown.buckets)).toEqual([[], [], []]);
    const ungrouped = { ...EMPTY, leads: tableStats(4), deals: tableStats(2) };
    expect(crmBreakdowns(ungrouped).map((breakdown) => breakdown.buckets)).toEqual([[], [], []]);
  });
});
