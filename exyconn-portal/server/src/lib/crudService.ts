import type { Model } from 'mongoose';
import { notFound } from '../utils/errors';
import {
  tableQuery,
  tableStats,
  type StatsConfig,
  type TableConfig,
  type TablePage,
  type TableQueryInput,
  type TableStatsResult,
} from '../utils/tableQuery';

/**
 * The most rows an unpaged `list<Plural>` query returns (newest first). Those queries feed
 * dropdowns and small lists; a collection grown past this belongs on the paged grid query,
 * and without a ceiling one request could pull an entire collection into memory.
 */
export const MAX_LIST_ROWS = 2000;

export interface CrudService<TInput> {
  /** The newest {@link MAX_LIST_ROWS} records. */
  list(): Promise<unknown[]>;
  /** One server-side page (search/filter/sort/paginate) for a grid. */
  paged(input: TableQueryInput, config: TableConfig): Promise<TablePage>;
  /** Dashboard summary numbers (total + grouped counts + sums) in one aggregation. */
  stats(config: StatsConfig): Promise<TableStatsResult>;
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
    list: () => M.find().sort({ createdAt: -1 }).limit(MAX_LIST_ROWS).lean(),
    paged: (input, config) => tableQuery(M, input, config),
    stats: (config) => tableStats(M, config),
    async get(id) {
      const doc = await M.findById(id).lean();
      if (!doc) notFound(label);
      return doc;
    },
    create: (input) => M.create(input).then((d) => d.toObject()),
    async update(id, input) {
      // Validators too: an update must not store what a create would refuse (a '₹' currency).
      const doc = await M.findByIdAndUpdate(id, input, { new: true, runValidators: true }).lean();
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
