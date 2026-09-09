import { CounterModel } from './counter.model';

/**
 * The next number in a named series, drawn atomically.
 *
 * `$inc` with `upsert` is the whole trick: two callers in the same instant get two different
 * numbers, and the series has no gaps and no repeats. Anything that hands a human-readable
 * reference to the outside world — an invoice, a purchase order — draws it from here rather
 * than counting rows, which races and reuses numbers after a delete.
 */
export async function nextSequence(key: string, prefix: string, width = 4): Promise<string> {
  const counter = await CounterModel.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  ).lean();
  return `${prefix}${String(counter?.seq ?? 1).padStart(width, '0')}`;
}
