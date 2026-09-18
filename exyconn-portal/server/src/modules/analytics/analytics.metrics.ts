import type { Model, PipelineStage } from 'mongoose';
import { AppSettingsModel } from '../admin/settings.model';
import { FALLBACK_TIMEZONE, zonedDateKey } from '../tracker/tracker.timezone';

export const MS_PER_HOUR = 3_600_000;
export const MS_PER_DAY = 24 * MS_PER_HOUR;

/** What a missing or empty grouping value is shown as. */
export const NOT_SET = 'Not set';

/** A labelled count or amount. */
export interface Metric {
  label: string;
  value: number;
}

/** One bucket of a series over time: a `YYYY-MM-DD` day or a `YYYY-MM` month. */
export interface TrendPoint {
  period: string;
  value: number;
}

interface GroupRow {
  _id: unknown;
  value: number;
}

/** Aggregation rows as metrics, largest first, with an empty group labelled as such. */
export function toMetrics(rows: readonly GroupRow[]): Metric[] {
  const metrics = rows.map((row) => ({
    label: row._id === null || row._id === undefined || row._id === '' ? NOT_SET : String(row._id),
    value: row.value,
  }));
  metrics.sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
  return metrics;
}

/**
 * How many rows of `model` share each value of `field`, among those `match` selects.
 * `unwind` counts an array field once per element — a user holding three roles is in three.
 */
export async function countBy(
  model: Pick<Model<unknown>, 'aggregate'>,
  match: Record<string, unknown>,
  field: string,
  unwind = false,
): Promise<Metric[]> {
  const pipeline: PipelineStage[] = [{ $match: match }];
  if (unwind) {
    pipeline.push({ $unwind: `$${field}` });
  }
  pipeline.push({ $group: { _id: `$${field}`, value: { $sum: 1 } } });
  return toMetrics(await model.aggregate<GroupRow>(pipeline));
}

/** The workspace's own timezone, as set in Admin → Settings: the day every bucket is read in. */
export async function houseTimezone(): Promise<string> {
  const settings = await AppSettingsModel.findOne({ key: 'global' }).select('timezone').lean();
  return settings?.timezone ?? FALLBACK_TIMEZONE;
}

/** The `days` calendar days ending today in `timeZone`, oldest first. */
export function dayKeys(days: number, timeZone: string, now = Date.now()): string[] {
  return Array.from({ length: days }, (_, index) =>
    zonedDateKey(new Date(now - (days - 1 - index) * MS_PER_DAY), timeZone),
  );
}

/** Aggregation rows keyed by period, laid over every key so a quiet day still shows as zero. */
export function fillTrend(keys: readonly string[], rows: readonly GroupRow[]): TrendPoint[] {
  const byKey = new Map(rows.map((row) => [String(row._id), row.value]));
  return keys.map((period) => ({ period, value: byKey.get(period) ?? 0 }));
}

/** A `$group` key that reads `field` as a `YYYY-MM-DD` day on the clock in `timeZone`. */
export function dayOf(field: string, timeZone: string) {
  return { $dateToString: { format: '%Y-%m-%d', date: `$${field}`, timezone: timeZone } };
}

/** Rounds to one decimal place — hours and percentages are read, not reconciled. */
export const oneDecimal = (value: number): number => Math.round(value * 10) / 10;
