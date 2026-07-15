import type { FilterQuery, Model, PipelineStage } from 'mongoose';

/**
 * Reusable server-side table engine shared by every paginated portal grid.
 *
 * A resolver hands it the module's Mongoose model, the client's `TableQueryInput`
 * (page/size/search/sort/filters) and a whitelist config, and gets back one page of
 * rows plus the total count for the current filter. Whitelisting the searchable /
 * filterable / sortable fields is what makes this safe to expose: a client can never
 * sort or filter on a field the module did not opt in, so it cannot probe hidden data.
 */

export type SortDir = 'ASC' | 'DESC';
export type FilterOp = 'CONTAINS' | 'STARTS_WITH' | 'EQUALS' | 'GT' | 'LT';

export interface TableSortInput {
  field: string;
  dir: SortDir;
}

export interface TableFilterInput {
  field: string;
  op: FilterOp;
  value: string;
}

export interface TableQueryInput {
  /** Zero-indexed page number. */
  page: number;
  pageSize: number;
  search?: string | null;
  sort?: TableSortInput | null;
  filters?: TableFilterInput[] | null;
}

export interface TableConfig {
  /** Fields the free-text `search` box scans (case-insensitive substring). */
  searchFields: string[];
  /** Fields a per-column filter may target. */
  filterFields: string[];
  /** Fields a column may sort by. */
  sortFields: string[];
  /** Applied when the request carries no (valid) sort. */
  defaultSort: TableSortInput;
}

export interface TablePage {
  rows: unknown[];
  totalCount: number;
}

/** Upper bound so a client can never ask for an unbounded page. */
const MAX_PAGE_SIZE = 200;

/** Escapes user text so it is matched literally inside a Mongo `$regex`. */
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Translates one whitelisted column filter into its Mongo condition. */
function filterCondition(op: FilterOp, value: string): unknown {
  const escaped = escapeRegex(value);
  if (op === 'CONTAINS') {
    return { $regex: escaped, $options: 'i' };
  }
  if (op === 'STARTS_WITH') {
    return { $regex: `^${escaped}`, $options: 'i' };
  }
  if (op === 'GT') {
    return { $gt: value };
  }
  if (op === 'LT') {
    return { $lt: value };
  }
  return value;
}

/** Builds the combined Mongo filter from the base filter, search and column filters. */
function buildFilter<T>(
  input: TableQueryInput,
  config: TableConfig,
  baseFilter: FilterQuery<T>,
): FilterQuery<T> {
  const and: Record<string, unknown>[] = [];

  const search = input.search?.trim();
  if (search && config.searchFields.length > 0) {
    const condition = { $regex: escapeRegex(search), $options: 'i' };
    and.push({ $or: config.searchFields.map((field) => ({ [field]: condition })) });
  }

  const filterFields = new Set(config.filterFields);
  for (const filter of input.filters ?? []) {
    if (filterFields.has(filter.field) && filter.value !== '') {
      and.push({ [filter.field]: filterCondition(filter.op, filter.value) });
    }
  }

  if (and.length === 0) {
    return baseFilter;
  }
  return { ...baseFilter, $and: and } as FilterQuery<T>;
}

/** Resolves the sort, falling back to the config default when the field isn't allowed. */
function buildSort(input: TableQueryInput, config: TableConfig): Record<string, 1 | -1> {
  const sortFields = new Set(config.sortFields);
  const useRequested = Boolean(input.sort && sortFields.has(input.sort.field));
  const sort = useRequested ? (input.sort as TableSortInput) : config.defaultSort;
  return { [sort.field]: sort.dir === 'DESC' ? -1 : 1 };
}

/** Which columns to bucket-count and which numeric columns to sum for a dashboard. */
export interface StatsConfig {
  /** Fields to group-count, e.g. ['status'] -> { PAID: 3, OVERDUE: 1 }. */
  countBy?: string[];
  /** Array fields to unwind then group, e.g. ['roles'] -> per-role counts. */
  unwindCountBy?: string[];
  /** Numeric fields to total, e.g. ['amount']. */
  sum?: string[];
}

export interface StatBucket {
  value: string;
  count: number;
}

export interface StatFieldCounts {
  field: string;
  buckets: StatBucket[];
}

export interface StatFieldSum {
  field: string;
  total: number;
}

export interface TableStatsResult {
  total: number;
  counts: StatFieldCounts[];
  sums: StatFieldSum[];
}

/**
 * Computes a dashboard's summary numbers in ONE aggregation instead of pulling every row to
 * the client. `$facet` runs the total, the per-field group counts and the field sums as one
 * round-trip. The `countBy`/`sum` fields come from trusted server config, never the client.
 */
export async function tableStats<T>(
  model: Model<T>,
  config: StatsConfig,
  baseFilter: FilterQuery<T> = {},
): Promise<TableStatsResult> {
  const countBy = config.countBy ?? [];
  const unwindCountBy = config.unwindCountBy ?? [];
  const sumFields = config.sum ?? [];

  const facet: Record<string, PipelineStage.FacetPipelineStage[]> = {
    total: [{ $count: 'value' }],
  };
  for (const field of countBy) {
    facet[`c_${field}`] = [{ $group: { _id: `$${field}`, count: { $sum: 1 } } }];
  }
  for (const field of unwindCountBy) {
    facet[`c_${field}`] = [
      { $unwind: `$${field}` },
      { $group: { _id: `$${field}`, count: { $sum: 1 } } },
    ];
  }
  for (const field of sumFields) {
    facet[`s_${field}`] = [{ $group: { _id: null, total: { $sum: `$${field}` } } }];
  }

  const [raw] = await model.aggregate([{ $match: baseFilter }, { $facet: facet }]);
  const doc = (raw ?? {}) as Record<string, Array<Record<string, unknown>>>;

  const counts: StatFieldCounts[] = [...countBy, ...unwindCountBy].map((field) => ({
    field,
    buckets: (doc[`c_${field}`] ?? []).map((bucket) => ({
      value: String(bucket._id),
      count: bucket.count as number,
    })),
  }));
  const sums: StatFieldSum[] = sumFields.map((field) => ({
    field,
    total: (doc[`s_${field}`]?.[0]?.total as number) ?? 0,
  }));

  return { total: (doc.total?.[0]?.value as number) ?? 0, counts, sums };
}

/**
 * Runs one page of a server-side table query: filtered, sorted, paginated rows plus the
 * total count for that filter (so the client can render the correct page count).
 */
export async function tableQuery<T>(
  model: Model<T>,
  input: TableQueryInput,
  config: TableConfig,
  baseFilter: FilterQuery<T> = {},
): Promise<TablePage> {
  const filter = buildFilter(input, config, baseFilter);
  const sort = buildSort(input, config);
  const pageSize = clamp(input.pageSize, 1, MAX_PAGE_SIZE);
  const page = Math.max(0, input.page);

  const [rows, totalCount] = await Promise.all([
    model
      .find(filter)
      .sort(sort)
      .skip(page * pageSize)
      .limit(pageSize)
      .lean(),
    model.countDocuments(filter),
  ]);

  return { rows, totalCount };
}
