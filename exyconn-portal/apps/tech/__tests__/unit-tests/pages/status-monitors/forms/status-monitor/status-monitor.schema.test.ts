import { describe, expect, it } from 'vitest';
import { StatusCategory } from '@exyconn/shell/graphql/generated';
import {
  statusMonitorSchema,
  toStatusMonitorValues,
} from '../../../../../../src/pages/status-monitors/forms/status-monitor';
import { MONITOR } from './status-monitor.fixtures';

const VALID = {
  key: 'tools-api',
  name: 'Tools API',
  description: '',
  category: StatusCategory.Api,
  url: 'https://tools-api.example.com/health',
  isActive: true,
  order: 0,
};

/** The messages a value fails with, or none when it passes. */
function messages(values: Record<string, unknown>): string[] {
  const result = statusMonitorSchema.safeParse({ ...VALID, ...values });
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe('toStatusMonitorValues', () => {
  it('starts a new monitor as a shown portal at the top of the list', () => {
    expect(toStatusMonitorValues(null)).toEqual({
      key: '',
      name: '',
      description: '',
      category: StatusCategory.Portal,
      url: '',
      isActive: true,
      order: 0,
    });
  });

  it('copies a saved monitor’s editable fields', () => {
    expect(toStatusMonitorValues(MONITOR)).toEqual({
      key: 'tools-api',
      name: 'Tools API',
      description: 'The public tools backend',
      category: StatusCategory.Api,
      url: 'https://tools-api.example.com/health',
      isActive: false,
      order: 4,
    });
  });
});

describe('statusMonitorSchema', () => {
  it('accepts a complete monitor, trimmed, with the order read as a number', () => {
    const result = statusMonitorSchema.parse({ ...VALID, key: '  hr  ', name: ' HR ', order: '3' });
    expect(result).toMatchObject({ key: 'hr', name: 'HR', order: 3 });
  });

  it('requires a key of lower-case letters, digits and hyphens within 40 characters', () => {
    expect(messages({ key: ' ' })).toContain('Key is required');
    expect(messages({ key: 'a'.repeat(41) })).toEqual(['Keep the key under 40 characters']);
    expect(messages({ key: 'a'.repeat(40) })).toEqual([]);
    expect(messages({ key: 'Tools API' })).toEqual([
      'Use lower-case letters, digits and hyphens only',
    ]);
  });

  it('requires a name within 80 characters and a description within 160', () => {
    expect(messages({ name: 'A' })).toEqual(['Name is required']);
    expect(messages({ name: 'n'.repeat(81) })).toEqual(['Keep the name under 80 characters']);
    expect(messages({ description: 'd'.repeat(161) })).toEqual([
      'Keep the description under 160 characters',
    ]);
    expect(messages({ description: 'd'.repeat(160) })).toEqual([]);
  });

  it('requires a full http(s) URL', () => {
    expect(messages({ url: '' })).toContain('URL is required');
    expect(messages({ url: 'tools.example.com/health' })).toEqual([
      'Enter the full URL, starting with https://',
    ]);
    expect(messages({ url: 'http://localhost:4000/health' })).toEqual([]);
  });

  it('refuses a category the server does not know', () => {
    expect(messages({ category: 'MAINFRAME' })).toHaveLength(1);
  });

  it('refuses a negative or non-numeric order', () => {
    expect(messages({ order: -1 })).toEqual(['Order cannot be negative']);
    expect(messages({ order: 'soon' })).toEqual(['Order must be a number']);
  });
});
