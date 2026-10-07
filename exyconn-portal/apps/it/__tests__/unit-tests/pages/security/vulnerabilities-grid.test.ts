import { describe, expect, it } from 'vitest';
import { VULNERABILITY_COLUMNS } from '../../../../src/pages/security/vulnerabilities-grid';
import { actionSpecs, columnIds } from '../page-kit/grid';

describe('VULNERABILITY_COLUMNS', () => {
  it('lists the vulnerability register columns, with the actions last', () => {
    expect(columnIds(VULNERABILITY_COLUMNS)).toEqual([
      'title',
      'cve',
      'severity',
      'affectedSystem',
      'status',
      'discoveredAt',
      'dueAt',
      'actions',
    ]);
  });

  it('offers edit and delete', () => {
    expect(actionSpecs(VULNERABILITY_COLUMNS).map((spec) => spec.key)).toEqual(['edit', 'delete']);
  });
});
