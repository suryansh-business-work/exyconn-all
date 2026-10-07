import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LOG_FILTERS,
  LOG_FILTERS,
  enumLabel,
} from '../../../../src/pages/logs/logs.constants';

describe('logs constants', () => {
  it('offers source, level and status filters straight from the API enums', () => {
    expect(LOG_FILTERS.map((spec) => spec.field)).toEqual(['source', 'level', 'status']);
    expect(LOG_FILTERS[0].values).toEqual(['DESKTOP', 'MOBILE', 'PORTAL', 'SERVER']);
    expect(LOG_FILTERS[1].values).toEqual(['DEBUG', 'ERROR', 'INFO', 'WARN']);
    expect(LOG_FILTERS[2].values).toEqual(['IGNORED', 'OPEN', 'RESOLVED']);
  });

  it('lands on open problems from every source and level', () => {
    expect(DEFAULT_LOG_FILTERS).toEqual({ source: '', level: '', status: 'OPEN' });
  });

  it('turns an enum value into a sentence-case label', () => {
    expect(enumLabel('MOBILE')).toBe('Mobile');
    expect(enumLabel('WARN')).toBe('Warn');
    expect(enumLabel('')).toBe('');
  });
});
