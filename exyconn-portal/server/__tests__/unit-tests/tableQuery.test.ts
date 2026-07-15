import { UserModel } from '../../src/modules/admin/user.model';
import { hashPassword } from '../../src/utils/password';
import { ROLES } from '../../src/constants/roles';
import { tableQuery, tableStats, type TableConfig } from '../../src/utils/tableQuery';

const CONFIG: TableConfig = {
  searchFields: ['name', 'email'],
  filterFields: ['department', 'employmentStatus'],
  sortFields: ['name', 'createdAt'],
  defaultSort: { field: 'createdAt', dir: 'DESC' },
};

async function make(name: string, email: string, extra: Record<string, unknown> = {}) {
  return UserModel.create({
    name,
    email,
    passwordHash: await hashPassword('Pass@123'),
    roles: [ROLES.EMPLOYEE],
    ...extra,
  });
}

describe('tableQuery', () => {
  it('paginates and reports the full total count for the current filter', async () => {
    for (let i = 0; i < 5; i += 1) {
      await make(`User ${i}`, `u${i}@x.com`);
    }
    const first = await tableQuery(UserModel, { page: 0, pageSize: 2 }, CONFIG);
    expect(first.rows).toHaveLength(2);
    expect(first.totalCount).toBe(5);

    const third = await tableQuery(UserModel, { page: 2, pageSize: 2 }, CONFIG);
    expect(third.rows).toHaveLength(1);
    expect(third.totalCount).toBe(5);
  });

  it('searches across the configured fields, case-insensitively', async () => {
    await make('Alice', 'alice@acme.com');
    await make('Bob', 'bob@other.com');

    const page = await tableQuery(UserModel, { page: 0, pageSize: 10, search: 'ACME' }, CONFIG);
    expect(page.totalCount).toBe(1);
    expect((page.rows[0] as { email: string }).email).toBe('alice@acme.com');
  });

  it('applies a whitelisted column filter and ignores an unlisted field', async () => {
    await make('A', 'a@x.com', { department: 'Sales' });
    await make('B', 'b@x.com', { department: 'Ops' });

    const filtered = await tableQuery(
      UserModel,
      { page: 0, pageSize: 10, filters: [{ field: 'department', op: 'EQUALS', value: 'Sales' }] },
      CONFIG,
    );
    expect(filtered.totalCount).toBe(1);

    // `email` is not in filterFields, so the client cannot filter on it — all rows return.
    const ignored = await tableQuery(
      UserModel,
      { page: 0, pageSize: 10, filters: [{ field: 'email', op: 'EQUALS', value: 'a@x.com' }] },
      CONFIG,
    );
    expect(ignored.totalCount).toBe(2);
  });

  it('aggregates dashboard stats — total and grouped counts — in one pass', async () => {
    await make('A', 'a@x.com', { department: 'Sales' });
    await make('B', 'b@x.com', { department: 'Sales' });
    await make('C', 'c@x.com', { department: 'Ops' });

    const stats = await tableStats(UserModel, { countBy: ['department'] });
    expect(stats.total).toBe(3);
    const dept = stats.counts.find((c) => c.field === 'department');
    expect(dept?.buckets.find((b) => b.value === 'Sales')?.count).toBe(2);
    expect(dept?.buckets.find((b) => b.value === 'Ops')?.count).toBe(1);
  });

  it('sorts by an allowed field and ignores a disallowed sort field', async () => {
    await make('Charlie', 'c@x.com');
    await make('Anna', 'a@x.com');

    const asc = await tableQuery(
      UserModel,
      { page: 0, pageSize: 10, sort: { field: 'name', dir: 'ASC' } },
      CONFIG,
    );
    expect((asc.rows[0] as { name: string }).name).toBe('Anna');

    // `roles` is not sortable, so the default sort (createdAt DESC) applies instead.
    const fallback = await tableQuery(
      UserModel,
      { page: 0, pageSize: 10, sort: { field: 'roles', dir: 'ASC' } },
      CONFIG,
    );
    expect((fallback.rows[0] as { name: string }).name).toBe('Anna');
  });
});
