import mongoose, { Schema, Types, type Model } from 'mongoose';
import type { GraphQLError } from 'graphql';
import { MAX_LIST_ROWS, createCrudService } from '../../../src/lib/crudService';
import { currencyField } from '../../../src/lib/currencyField';

interface ProbeInput {
  name: string;
  status?: string;
  amount?: number;
  currency?: string;
  createdAt?: Date;
}

const ProbeModel = mongoose.model(
  'CrudServiceProbe',
  new Schema({
    name: { type: String, required: true },
    status: { type: String, default: 'OPEN' },
    amount: { type: Number, default: 0 },
    currency: { ...currencyField, required: false },
    createdAt: { type: Date, default: () => new Date() },
  }),
);

const service = createCrudService<ProbeInput>(ProbeModel as unknown as Model<never>, 'Probe');

const codeOf = (promise: Promise<unknown>) =>
  promise.then(
    () => 'OK',
    (error: unknown) => (error as GraphQLError).extensions?.code ?? (error as Error).name,
  );

const at = (day: number) => new Date(Date.UTC(2026, 0, day));

describe('createCrudService', () => {
  it('caps an unpaged list', () => {
    expect(MAX_LIST_ROWS).toBe(2000);
  });

  it('lists the newest records first', async () => {
    await service.create({ name: 'old', createdAt: at(1) });
    await service.create({ name: 'new', createdAt: at(3) });
    await service.create({ name: 'mid', createdAt: at(2) });
    const rows = (await service.list()) as ProbeInput[];
    expect(rows.map((row) => row.name)).toEqual(['new', 'mid', 'old']);
  });

  it('creates a plain object, not a document', async () => {
    const created = (await service.create({ name: 'Widget', currency: 'usd' })) as Record<
      string,
      unknown
    >;
    expect(created).toMatchObject({ name: 'Widget', currency: 'USD', status: 'OPEN' });
    expect(created._id).toBeInstanceOf(Types.ObjectId);
    expect(created).not.toBeInstanceOf(mongoose.Document);
  });

  it('gets one record and reports a missing one by its label', async () => {
    const created = (await service.create({ name: 'Widget' })) as { _id: Types.ObjectId };
    await expect(service.get(String(created._id))).resolves.toMatchObject({ name: 'Widget' });
    await expect(service.get(String(new Types.ObjectId()))).rejects.toThrow('Probe not found');
  });

  it('updates a record and refuses what a create would refuse', async () => {
    const created = (await service.create({ name: 'Widget' })) as { _id: Types.ObjectId };
    const id = String(created._id);
    await expect(service.update(id, { status: 'DONE' })).resolves.toMatchObject({
      name: 'Widget',
      status: 'DONE',
    });
    await expect(codeOf(service.update(id, { currency: '₹' }))).resolves.toBe('ValidationError');
    await expect(
      codeOf(service.update(String(new Types.ObjectId()), { status: 'X' })),
    ).resolves.toBe('NOT_FOUND');
  });

  it('removes a record once', async () => {
    const created = (await service.create({ name: 'Widget' })) as { _id: Types.ObjectId };
    const id = String(created._id);
    await expect(service.remove(id)).resolves.toBe(true);
    await expect(codeOf(service.remove(id))).resolves.toBe('NOT_FOUND');
  });

  it('pages, searches and sorts through the table query', async () => {
    for (const name of ['alpha', 'beta', 'alphabet', 'gamma']) {
      await service.create({ name });
    }
    const page = await service.paged(
      { page: 0, pageSize: 1, search: 'alpha' },
      {
        searchFields: ['name'],
        filterFields: [],
        sortFields: ['name'],
        defaultSort: { field: 'name', dir: 'DESC' },
      },
    );
    expect(page.totalCount).toBe(2);
    expect((page.rows as ProbeInput[]).map((row) => row.name)).toEqual(['alphabet']);
  });

  it('summarises counts and sums in one call', async () => {
    await service.create({ name: 'a', status: 'PAID', amount: 10 });
    await service.create({ name: 'b', status: 'PAID', amount: 5 });
    await service.create({ name: 'c', status: 'DUE', amount: 1 });
    const stats = await service.stats({ countBy: ['status'], sum: ['amount'] });
    expect(stats.total).toBe(3);
    expect(stats.sums).toEqual([{ field: 'amount', total: 16 }]);
    expect(stats.counts[0].buckets).toEqual(
      expect.arrayContaining([
        { value: 'PAID', count: 2 },
        { value: 'DUE', count: 1 },
      ]),
    );
  });
});
