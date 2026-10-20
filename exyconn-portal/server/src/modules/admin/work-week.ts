import { AppSettingsModel } from './settings.model';
import { DEFAULT_WORK_DAYS } from '../../constants/work';
import { badRequest } from '../../utils/errors';

/**
 * The working week: which days of the week (0 = Sunday … 6 = Saturday) somebody works.
 *
 * The workspace keeps a default on its settings and an employee may carry their own. Every
 * reader — the employee record, the tracker's expected hours, the off-day block — resolves a
 * person's week through `workDaysOf`, so none of them can disagree about a day off.
 */

const DAYS_IN_WEEK = 7;

/** A week as somebody gave it: whole days 0–6, each once, at least one. Sorted for storage. */
export function normalizeWorkDays(days: readonly number[]): number[] {
  if (!days.every((day) => Number.isInteger(day) && day >= 0 && day < DAYS_IN_WEEK)) {
    badRequest('Work days are whole numbers from 0 (Sunday) to 6 (Saturday).');
  }
  const unique = new Set(days);
  if (unique.size !== days.length) {
    badRequest('Each work day can be listed only once.');
  }
  if (unique.size === 0) {
    badRequest('Choose at least one work day.');
  }
  return [...unique].sort((a, b) => a - b);
}

/** The workspace's default week, from its settings; the house default when it has none. */
export async function orgDefaultWorkDays(): Promise<number[]> {
  const settings = await AppSettingsModel.findOne({ key: 'global' })
    .select('defaultWorkDays')
    .lean();
  const stored = settings?.defaultWorkDays ?? [];
  return stored.length > 0 ? [...stored] : [...DEFAULT_WORK_DAYS];
}

/** Saves the workspace's default week and answers with what was stored. */
export async function saveDefaultWorkDays(days: readonly number[]): Promise<number[]> {
  const normalized = normalizeWorkDays(days);
  await AppSettingsModel.findOneAndUpdate(
    { key: 'global' },
    { defaultWorkDays: normalized },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  return normalized;
}

/** The part of a user record the week is read from. A lean User document satisfies this. */
export interface WorkDaysSource {
  workDays?: number[] | null;
}

/**
 * A person's effective week: their own when HR set one, else the workspace's. `orgDefault`
 * is only called when it is needed, so a caller resolving many people can hand in one read.
 */
export async function workDaysOf(
  user: WorkDaysSource | null | undefined,
  orgDefault: () => Promise<number[]> = orgDefaultWorkDays,
): Promise<number[]> {
  const own = user?.workDays ?? [];
  return own.length > 0 ? [...own] : orgDefault();
}
