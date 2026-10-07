import { tableStats } from '../../../src/utils/tableQuery';
import { fakeModel } from './tableQuery.fixtures';

describe('tableStats', () => {
  it('builds one $facet for the total, the counts, the unwound counts and the sums', async () => {
    const { model, raw } = fakeModel([], 0, [
      {
        total: [{ value: 4 }],
        c_status: [
          { _id: 'PAID', count: 3 },
          { _id: null, count: 1 },
        ],
        c_roles: [{ _id: 'HR', count: 2 }],
        s_amount: [{ _id: null, total: 250 }],
      },
    ]);
    const stats = await tableStats(
      model,
      { countBy: ['status'], unwindCountBy: ['roles'], sum: ['amount', 'tax'] },
      { organizationId: 'org-1' },
    );
    expect(raw.aggregate).toHaveBeenCalledWith([
      { $match: { organizationId: 'org-1' } },
      {
        $facet: {
          total: [{ $count: 'value' }],
          c_status: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
          c_roles: [{ $unwind: '$roles' }, { $group: { _id: '$roles', count: { $sum: 1 } } }],
          s_amount: [{ $group: { _id: null, total: { $sum: '$amount' } } }],
          s_tax: [{ $group: { _id: null, total: { $sum: '$tax' } } }],
        },
      },
    ]);
    expect(stats).toEqual({
      total: 4,
      counts: [
        {
          field: 'status',
          buckets: [
            { value: 'PAID', count: 3 },
            { value: 'null', count: 1 },
          ],
        },
        { field: 'roles', buckets: [{ value: 'HR', count: 2 }] },
      ],
      sums: [
        { field: 'amount', total: 250 },
        { field: 'tax', total: 0 },
      ],
    });
  });

  it('answers zeros when the aggregation returns nothing', async () => {
    const { model, raw } = fakeModel([], 0, []);
    await expect(tableStats(model, { countBy: ['status'], sum: ['amount'] })).resolves.toEqual({
      total: 0,
      counts: [{ field: 'status', buckets: [] }],
      sums: [{ field: 'amount', total: 0 }],
    });
    expect(raw.aggregate).toHaveBeenCalledWith([{ $match: {} }, { $facet: expect.any(Object) }]);
  });

  it('answers a zero total when no document matched', async () => {
    const { model } = fakeModel([], 0, [{ total: [] }]);
    await expect(tableStats(model, {})).resolves.toEqual({ total: 0, counts: [], sums: [] });
  });
});
