import { describe, expect, it } from 'vitest';
import { NETWORK_COLUMNS } from '../../../../src/pages/network/network-grid';
import { actionSpecs, columnIds } from '../page-kit/grid';

describe('NETWORK_COLUMNS', () => {
  it('lists the network register columns, with the actions last', () => {
    expect(columnIds(NETWORK_COLUMNS)).toEqual([
      'name',
      'kind',
      'address',
      'location',
      'provider',
      'status',
      'actions',
    ]);
  });

  it('offers edit and delete', () => {
    expect(actionSpecs(NETWORK_COLUMNS).map((spec) => spec.key)).toEqual(['edit', 'delete']);
  });
});
