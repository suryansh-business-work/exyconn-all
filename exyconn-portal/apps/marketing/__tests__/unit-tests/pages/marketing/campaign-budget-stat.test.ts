import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_FORMAT_SETTINGS, setActiveFormatSettings } from '@exyconn/i18n';
import { totalBudgetStat } from '../../../../src/pages/marketing/campaign-budget-stat';
import { tableStats } from '../../fixtures';

/** English in, English out, with the values written in so a test can read them. */
const t = (source: string, values: Readonly<Record<string, string | number>> = {}) =>
  source.replaceAll(/\{(\w+)\}/g, (_, key: string) => String(values[key]));

const ACCENT = '#ff00aa';

describe('totalBudgetStat', () => {
  beforeEach(() => {
    setActiveFormatSettings({ ...DEFAULT_FORMAT_SETTINGS, locale: 'en-US', currency: 'EUR' });
  });

  afterEach(() => {
    setActiveFormatSettings(DEFAULT_FORMAT_SETTINGS);
  });

  it('totals budgets that share a currency in that currency', () => {
    const stats = tableStats(4, { budgetCurrency: { INR: 4 } }, { budget: 450000 });

    expect(totalBudgetStat(stats, t, ACCENT)).toEqual({
      label: 'Total budget',
      value: '₹450,000',
      accent: ACCENT,
    });
  });

  it('shows the company currency before any campaign exists', () => {
    expect(totalBudgetStat(tableStats(0), t, ACCENT).value).toBe('€0');
    expect(totalBudgetStat(undefined, t, ACCENT).value).toBe('€0');
  });

  it('names how many currencies there are instead of adding them together', () => {
    const stats = tableStats(3, { budgetCurrency: { INR: 2, USD: 1 } }, { budget: 9000 });

    const stat = totalBudgetStat(stats, t, ACCENT);

    expect(stat.value).toBe('2 currencies');
    expect(stat.label).toBe('Total budget');
    expect(stat.info).toMatch(/more than one currency/);
  });
});
