import { describe, it, expect } from 'vitest';
import { gridContextWith } from '../../src/components/data/gridContext';

const formatDate = (value: string) => `formatted:${value}`;

describe('gridContextWith', () => {
  it('gives a page that only passes row actions a working formatDate', () => {
    const context = gridContextWith({ actions: {} }, formatDate) as {
      actions: object;
      formatDate: (value: string) => string;
    };

    expect(context.actions).toEqual({});
    expect(context.formatDate('2026-09-04')).toBe('formatted:2026-09-04');
  });

  it('lets a page override formatDate with its own', () => {
    const own = (value: string) => `own:${value}`;
    const context = gridContextWith({ actions: {}, formatDate: own }, formatDate) as {
      formatDate: (value: string) => string;
    };

    expect(context.formatDate('2026-09-04')).toBe('own:2026-09-04');
  });

  it('still produces a formatDate when the page passes no context at all', () => {
    const context = gridContextWith(undefined, formatDate) as {
      formatDate: (value: string) => string;
    };

    expect(context.formatDate('2026-09-04')).toBe('formatted:2026-09-04');
  });
});
