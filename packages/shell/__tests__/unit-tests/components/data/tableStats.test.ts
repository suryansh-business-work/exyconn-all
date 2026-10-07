import { describe, expect, it } from 'vitest';
import {
  statCount,
  statDistinct,
  statSum,
  statTotal,
  type TableStatsShape,
} from '@/components/data/tableStats';

const stats: TableStatsShape = {
  total: 12,
  counts: [
    {
      field: 'status',
      buckets: [
        { value: 'PAID', count: 7 },
        { value: 'DRAFT', count: 5 },
      ],
    },
  ],
  sums: [{ field: 'amount', total: 4200.5 }],
};

describe('table stats helpers', () => {
  it('read the total, a bucket, the distinct count and a sum', () => {
    expect(statTotal(stats)).toBe(12);
    expect(statCount(stats, 'status', 'PAID')).toBe(7);
    expect(statDistinct(stats, 'status')).toBe(2);
    expect(statSum(stats, 'amount')).toBe(4200.5);
  });

  it('read zero for a field or value the aggregation does not have', () => {
    expect(statCount(stats, 'status', 'VOID')).toBe(0);
    expect(statCount(stats, 'owner', 'PAID')).toBe(0);
    expect(statDistinct(stats, 'owner')).toBe(0);
    expect(statSum(stats, 'tax')).toBe(0);
  });

  it('read zero while the stats query has not answered', () => {
    for (const pending of [null, undefined]) {
      expect(statTotal(pending)).toBe(0);
      expect(statCount(pending, 'status', 'PAID')).toBe(0);
      expect(statDistinct(pending, 'status')).toBe(0);
      expect(statSum(pending, 'amount')).toBe(0);
    }
  });
});
