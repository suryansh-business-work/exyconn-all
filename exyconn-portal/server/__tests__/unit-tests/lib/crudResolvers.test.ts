import type { GraphQLError } from 'graphql';
import { createCrudResolvers } from '../../../src/lib/crudResolvers';
import { PERMISSION_MODULES } from '../../../src/lib/permissions';
import { recordAudit } from '../../../src/modules/audit';
import type { CrudService } from '../../../src/lib/crudService';
import { ROLES, type Role } from '../../../src/constants/roles';
import type { GraphQLContext } from '../../../src/middleware/auth';

jest.mock('../../../src/modules/audit', () => ({
  ...jest.requireActual('../../../src/modules/audit'),
  recordAudit: jest.fn().mockResolvedValue(undefined),
}));

type Input = { name: string; amount?: number };
type Resolve = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;

const ctxAs = (...roles: Role[]): GraphQLContext => ({
  user: { id: 'user-1', email: 'u@example.com', roles },
  ip: '192.0.2.1',
});
const admin = ctxAs(ROLES.ADMIN);

function fakeService(): jest.Mocked<CrudService<Input>> {
  return {
    list: jest.fn().mockResolvedValue([{ _id: 'b1', name: 'One' }]),
    paged: jest.fn().mockResolvedValue({ rows: [{ _id: 'b2', name: 'Two' }], totalCount: 7 }),
    stats: jest.fn().mockResolvedValue({ total: 1, counts: [], sums: [] }),
    get: jest.fn().mockResolvedValue({ _id: 'b1', name: 'Before', amount: 1 }),
    create: jest.fn().mockResolvedValue({ _id: 'b3', name: 'Created' }),
    update: jest.fn().mockResolvedValue({ _id: 'b1', name: 'After', amount: 2 }),
    remove: jest.fn().mockResolvedValue(true),
  };
}

const table = {
  searchFields: ['name'],
  filterFields: [],
  sortFields: ['name'],
  defaultSort: { field: 'name', dir: 'ASC' as const },
};

function build(extra: Partial<Parameters<typeof createCrudResolvers>[1]> = {}) {
  const service = fakeService();
  const maps = createCrudResolvers(service, { name: 'Budget', roles: [ROLES.FINANCE], ...extra });
  const query = maps.Query as unknown as Record<string, Resolve>;
  const mutation = maps.Mutation as unknown as Record<string, Resolve>;
  return { service, query, mutation };
}

describe('createCrudResolvers queries', () => {
  it('registers the module for the permission matrix', () => {
    build({ name: 'Widget' });
    expect(PERMISSION_MODULES.has('Widget')).toBe(true);
  });

  it('names the list after the plural, regular or irregular', () => {
    expect(Object.keys(build().query)).toEqual(['listBudgets', 'getBudget']);
    expect(Object.keys(build({ name: 'CaseStudy', plural: 'CaseStudies' }).query)).toEqual([
      'listCaseStudies',
      'getCaseStudy',
    ]);
  });

  it('lists and gets records with ids', async () => {
    const { query, service } = build();
    await expect(query.listBudgets(null, {}, admin)).resolves.toEqual([
      { _id: 'b1', id: 'b1', name: 'One' },
    ]);
    await expect(query.getBudget(null, { id: 'b1' }, admin)).resolves.toMatchObject({ id: 'b1' });
    expect(service.get).toHaveBeenCalledWith('b1');
  });

  it('adds the paged and stats queries only when configured', async () => {
    const { query, service } = build({ table, stats: { countBy: ['status'] } });
    await expect(
      query.listBudgetsPaged(null, { input: { page: 0, pageSize: 5 } }, admin),
    ).resolves.toEqual({
      rows: [{ _id: 'b2', id: 'b2', name: 'Two' }],
      totalCount: 7,
    });
    expect(service.paged).toHaveBeenCalledWith({ page: 0, pageSize: 5 }, table);
    await expect(query.listBudgetsStats(null, {}, admin)).resolves.toEqual({
      total: 1,
      counts: [],
      sums: [],
    });
    expect(service.stats).toHaveBeenCalledWith({ countBy: ['status'] });
  });

  it('guards every operation with the module roles', async () => {
    const { query, mutation, service } = build({ table, stats: {} });
    const outsider = ctxAs(ROLES.CRM);
    const attempts = [
      query.listBudgets(null, {}, outsider),
      query.getBudget(null, { id: 'b1' }, outsider),
      query.listBudgetsPaged(null, { input: { page: 0, pageSize: 5 } }, outsider),
      query.listBudgetsStats(null, {}, outsider),
      mutation.createBudget(null, { input: { name: 'x' } }, outsider),
      mutation.updateBudget(null, { id: 'b1', input: {} }, outsider),
      mutation.deleteBudget(null, { id: 'b1' }, outsider),
    ];
    const codes = await Promise.all(
      attempts.map((attempt) =>
        attempt.then(
          () => 'ALLOWED',
          (error: unknown) => (error as GraphQLError).extensions?.code,
        ),
      ),
    );
    expect(codes).toEqual(Array.from({ length: 7 }, () => 'FORBIDDEN'));
    expect(service.list).not.toHaveBeenCalled();
    expect(recordAudit).not.toHaveBeenCalled();
  });

  it('lets a module role through', async () => {
    const { query } = build();
    await expect(query.listBudgets(null, {}, ctxAs(ROLES.FINANCE))).resolves.toHaveLength(1);
  });
});

describe('createCrudResolvers mutations', () => {
  it('creates and records who did it', async () => {
    const { mutation, service } = build();
    await expect(
      mutation.createBudget(null, { input: { name: 'Created' } }, admin),
    ).resolves.toEqual({
      _id: 'b3',
      id: 'b3',
      name: 'Created',
    });
    expect(service.create).toHaveBeenCalledWith({ name: 'Created' });
    expect(recordAudit).toHaveBeenCalledWith(admin, {
      action: 'CREATE',
      module: 'Budget',
      entityId: 'b3',
      entityLabel: 'Created',
      summary: 'Created Budget',
    });
  });

  it('records which fields an update changed', async () => {
    const { mutation, service } = build();
    const input = { name: 'After', amount: 2 };
    await expect(mutation.updateBudget(null, { id: 'b1', input }, admin)).resolves.toMatchObject({
      id: 'b1',
      name: 'After',
    });
    expect(service.update).toHaveBeenCalledWith('b1', input);
    expect(recordAudit).toHaveBeenCalledWith(admin, {
      action: 'UPDATE',
      module: 'Budget',
      entityId: 'b1',
      entityLabel: 'After',
      summary: 'Updated Budget (name, amount)',
      changes: { name: { from: 'Before', to: 'After' }, amount: { from: 1, to: 2 } },
    });
  });

  it('says only that it updated when nothing changed', async () => {
    const { mutation } = build();
    await mutation.updateBudget(null, { id: 'b1', input: { name: 'Before' } }, admin);
    expect(recordAudit).toHaveBeenCalledWith(
      admin,
      expect.objectContaining({ summary: 'Updated Budget', changes: {} }),
    );
  });

  it('labels a row by the configured fields when it has no usual one', async () => {
    const { mutation, service } = build({ labelFields: ['vendor'] });
    service.get.mockResolvedValueOnce({ _id: 'b1', vendor: 'Acme' });
    await expect(mutation.deleteBudget(null, { id: 'b1' }, admin)).resolves.toBe(true);
    expect(service.remove).toHaveBeenCalledWith('b1');
    expect(recordAudit).toHaveBeenCalledWith(admin, {
      action: 'DELETE',
      module: 'Budget',
      entityId: 'b1',
      entityLabel: 'Acme',
      summary: 'Deleted Budget',
    });
  });
});
