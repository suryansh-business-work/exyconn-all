import type { Model } from 'mongoose';
import { notFound } from '../utils/errors';
import { tableQuery, type TableConfig, type TablePage, type TableQueryInput } from '../utils/tableQuery';

export interface CrudService<TInput> {
  list(): Promise<unknown[]>;
  /** One server-side page (search/filter/sort/paginate) for a grid. */
  paged(input: TableQueryInput, config: TableConfig): Promise<TablePage>;
  get(id: string): Promise<unknown>;
  create(input: TInput): Promise<unknown>;
  update(id: string, input: Partial<TInput>): Promise<unknown>;
  remove(id: string): Promise<boolean>;
}

/**
 * Builds a standard CRUD service around a Mongoose model. Used by every business
 * module so the data-access pattern lives in exactly one place (DRY).
 */
export function createCrudService<TInput extends object>(
  model: Model<never>,
  label: string,
): CrudService<TInput> {
  const M = model as unknown as Model<TInput>;
  return {
    list: () => M.find().sort({ createdAt: -1 }).lean(),
    paged: (input, config) => tableQuery(M, input, config),
    async get(id) {
      const doc = await M.findById(id).lean();
      if (!doc) notFound(label);
      return doc;
    },
    create: (input) => M.create(input).then((d) => d.toObject()),
    async update(id, input) {
      const doc = await M.findByIdAndUpdate(id, input, { new: true }).lean();
      if (!doc) notFound(label);
      return doc;
    },
    async remove(id) {
      const doc = await M.findByIdAndDelete(id).lean();
      if (!doc) notFound(label);
      return true;
    },
  };
}
