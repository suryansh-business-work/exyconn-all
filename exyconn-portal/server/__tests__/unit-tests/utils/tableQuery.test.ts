import {
  TABLE_QUERY_LIMITS,
  escapeRegex,
  tableQuery,
  type TableConfig,
  type TableQueryInput,
} from '../../../src/utils/tableQuery';
import { fakeModel } from './tableQuery.fixtures';

const CONFIG: TableConfig = {
  searchFields: ['name', 'email'],
  filterFields: ['status', 'amount', 'name'],
  sortFields: ['name'],
  defaultSort: { field: 'createdAt', dir: 'DESC' },
};

const page = (overrides: Partial<TableQueryInput> = {}): TableQueryInput => ({
  page: 0,
  pageSize: 10,
  ...overrides,
});

describe('escapeRegex', () => {
  it('escapes every regex metacharacter so user text matches literally', () => {
    expect(escapeRegex(String.raw`a.b*c+d?e^f$g{h}i(j)k|l[m]n\o`)).toBe(
      String.raw`a\.b\*c\+d\?e\^f\$g\{h\}i\(j\)k\|l\[m\]n\\o`,
    );
  });
});

describe('tableQuery', () => {
  it('returns the rows and total, with the base filter and default sort', async () => {
    const { model, raw, chain } = fakeModel([{ id: 1 }], 7);
    const result = await tableQuery(model, page(), CONFIG, { organizationId: 'org-1' });
    expect(result).toEqual({ rows: [{ id: 1 }], totalCount: 7 });
    expect(raw.find).toHaveBeenCalledWith({ organizationId: 'org-1' });
    expect(raw.countDocuments).toHaveBeenCalledWith({ organizationId: 'org-1' });
    expect(chain.sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(chain.skip).toHaveBeenCalledWith(0);
    expect(chain.limit).toHaveBeenCalledWith(10);
  });

  it('clamps the page size and a negative page', async () => {
    const { model, chain } = fakeModel();
    await tableQuery(model, page({ page: -3, pageSize: 5000 }), CONFIG);
    expect(chain.limit).toHaveBeenCalledWith(200);
    expect(chain.skip).toHaveBeenCalledWith(0);
    await tableQuery(model, page({ page: 2, pageSize: 0 }), CONFIG);
    expect(chain.limit).toHaveBeenLastCalledWith(1);
    expect(chain.skip).toHaveBeenLastCalledWith(2);
  });

  it('searches every configured field with the escaped, trimmed text', async () => {
    const { model, raw } = fakeModel();
    await tableQuery(model, page({ search: '  a.b  ' }), CONFIG);
    const condition = { $regex: String.raw`a\.b`, $options: 'i' };
    expect(raw.find).toHaveBeenCalledWith({
      $and: [{ $or: [{ name: condition }, { email: condition }] }],
    });
  });

  it('ignores a blank search, and a search when no field is searchable', async () => {
    const { model, raw } = fakeModel();
    await tableQuery(model, page({ search: '   ' }), CONFIG);
    await tableQuery(model, page({ search: 'x' }), { ...CONFIG, searchFields: [] });
    expect(raw.find).toHaveBeenNthCalledWith(1, {});
    expect(raw.find).toHaveBeenNthCalledWith(2, {});
  });

  it('translates each filter operator, ignoring unlisted fields and empty values', async () => {
    const { model, raw } = fakeModel();
    await tableQuery(
      model,
      page({
        filters: [
          { field: 'name', op: 'CONTAINS', value: 'a+' },
          { field: 'name', op: 'STARTS_WITH', value: 'Jo' },
          { field: 'amount', op: 'GT', value: '10' },
          { field: 'amount', op: 'LT', value: '99' },
          { field: 'status', op: 'EQUALS', value: 'PAID' },
          { field: 'secret', op: 'EQUALS', value: 'x' },
          { field: 'status', op: 'EQUALS', value: '' },
        ],
      }),
      CONFIG,
      { archived: false },
    );
    expect(raw.find).toHaveBeenCalledWith({
      archived: false,
      $and: [
        { name: { $regex: String.raw`a\+`, $options: 'i' } },
        { name: { $regex: '^Jo', $options: 'i' } },
        { amount: { $gt: '10' } },
        { amount: { $lt: '99' } },
        { status: 'PAID' },
      ],
    });
  });

  it('sorts by an allowed field and falls back for any other', async () => {
    const { model, chain } = fakeModel();
    await tableQuery(model, page({ sort: { field: 'name', dir: 'ASC' } }), CONFIG);
    expect(chain.sort).toHaveBeenLastCalledWith({ name: 1 });
    await tableQuery(model, page({ sort: { field: 'salary', dir: 'ASC' } }), CONFIG);
    expect(chain.sort).toHaveBeenLastCalledWith({ createdAt: -1 });
    await tableQuery(model, page({ sort: null }), CONFIG);
    expect(chain.sort).toHaveBeenLastCalledWith({ createdAt: -1 });
  });

  describe('limits', () => {
    it('refuses a search longer than the limit, and accepts one at it', async () => {
      const { model, raw } = fakeModel();
      const atLimit = 'a'.repeat(TABLE_QUERY_LIMITS.maxSearchLength);
      await expect(tableQuery(model, page({ search: atLimit }), CONFIG)).resolves.toBeDefined();
      await expect(tableQuery(model, page({ search: `${atLimit}a` }), CONFIG)).rejects.toThrow(
        `Search is limited to ${TABLE_QUERY_LIMITS.maxSearchLength} characters`,
      );
      expect(raw.find).toHaveBeenCalledTimes(1);
    });

    it('refuses too many filters', async () => {
      const { model } = fakeModel();
      const filters = Array.from({ length: TABLE_QUERY_LIMITS.maxFilters + 1 }, () => ({
        field: 'status',
        op: 'EQUALS' as const,
        value: 'x',
      }));
      await expect(tableQuery(model, page({ filters }), CONFIG)).rejects.toThrow(
        `At most ${TABLE_QUERY_LIMITS.maxFilters} filters per request`,
      );
    });

    it('refuses a filter value longer than the limit', async () => {
      const { model } = fakeModel();
      const value = 'x'.repeat(TABLE_QUERY_LIMITS.maxFilterValueLength + 1);
      await expect(
        tableQuery(model, page({ filters: [{ field: 'status', op: 'EQUALS', value }] }), CONFIG),
      ).rejects.toThrow(`limited to ${TABLE_QUERY_LIMITS.maxFilterValueLength} characters`);
    });

    it('refuses a page too far in', async () => {
      const { model } = fakeModel();
      const pageSize = 100;
      const deepest = TABLE_QUERY_LIMITS.maxSkip / pageSize;
      await expect(
        tableQuery(model, page({ page: deepest, pageSize }), CONFIG),
      ).resolves.toBeDefined();
      await expect(
        tableQuery(model, page({ page: deepest + 1, pageSize }), CONFIG),
      ).rejects.toThrow('That page is too far in');
    });
  });
});
