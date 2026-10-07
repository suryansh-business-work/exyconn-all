import type { Model } from 'mongoose';

/** A model double that records the query it was asked to run. */
export function fakeModel(rows: unknown[] = [], total = 0, aggregated: unknown[] = []) {
  const chain = {
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(rows),
  };
  const model = {
    find: jest.fn(() => chain),
    countDocuments: jest.fn().mockResolvedValue(total),
    aggregate: jest.fn().mockResolvedValue(aggregated),
  };
  return { model: model as unknown as Model<unknown>, raw: model, chain };
}
