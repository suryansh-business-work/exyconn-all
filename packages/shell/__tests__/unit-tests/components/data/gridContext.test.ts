import { describe, expect, it } from 'vitest';
import type { Interpolations } from '@exyconn/i18n';
import { gridContextWith, gridTranslator } from '@/components/data/gridContext';

const formatDate = (value: string) => `date:${value}`;
const t = (source: string, values?: Interpolations) =>
  values ? `${source}|${JSON.stringify(values)}` : `t:${source}`;

describe('gridContextWith and gridTranslator', () => {
  it('puts the viewer translator on the context for column formatters', () => {
    const context = gridContextWith({ actions: {} }, formatDate, t);
    const translate = gridTranslator(context);

    expect(translate('Lead')).toBe('t:Lead');
    expect(translate('{done} of {total} done', { done: 3, total: 6 })).toBe(
      '{done} of {total} done|{"done":3,"total":6}',
    );
  });

  it('lets a page supply its own translator and date format over the shared ones', () => {
    const own = (source: string) => `own:${source}`;
    const context = gridContextWith({ t: own, formatDate: own }, formatDate, t) as {
      formatDate: (value: string) => string;
    };

    expect(gridTranslator(context)('Lead')).toBe('own:Lead');
    expect(context.formatDate('2026-10-07')).toBe('own:2026-10-07');
  });
});
