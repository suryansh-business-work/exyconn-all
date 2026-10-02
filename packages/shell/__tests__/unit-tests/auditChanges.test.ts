import { describe, expect, it } from 'vitest';
import { parseAuditChanges } from '@/components/audit';

describe('parseAuditChanges', () => {
  it('turns the stored JSON into one from/to row per field', () => {
    const changes = JSON.stringify({
      status: { from: 'DRAFT', to: 'SENT' },
      amountPaid: { from: 0, to: 400 },
      lines: { from: [], to: [{ rate: 1 }] },
    });

    expect(parseAuditChanges(changes)).toEqual([
      { field: 'status', from: 'DRAFT', to: 'SENT' },
      { field: 'amountPaid', from: '0', to: '400' },
      { field: 'lines', from: '[]', to: '[{"rate":1}]' },
    ]);
  });

  it('prints a blank value as a dash', () => {
    const changes = JSON.stringify({ paidOn: { from: null, to: '' }, note: {} });

    expect(parseAuditChanges(changes)).toEqual([
      { field: 'paidOn', from: '—', to: '—' },
      { field: 'note', from: '—', to: '—' },
    ]);
  });

  it('yields nothing for an empty or unreadable column', () => {
    expect(parseAuditChanges('')).toEqual([]);
    expect(parseAuditChanges('{not json')).toEqual([]);
  });

  it('survives a field whose change is null', () => {
    expect(parseAuditChanges(JSON.stringify({ x: null }))).toEqual([
      { field: 'x', from: '—', to: '—' },
    ]);
  });
});
