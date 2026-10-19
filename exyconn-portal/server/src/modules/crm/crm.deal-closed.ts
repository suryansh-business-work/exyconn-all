import type { Query, Schema } from 'mongoose';

/** Stages a deal can no longer move out of; they leave the open pipeline. */
export const CLOSED_DEAL_STAGES: ReadonlySet<string> = new Set(['WON', 'LOST']);

/** Spread into the Deal schema. */
export const dealClosedFields = {
  /**
   * When the deal entered WON or LOST; null while it is open. Kept because the dashboard asks
   * "won this quarter", and `updatedAt` moves every time somebody corrects a won deal's notes.
   */
  closedAt: { type: Date, default: null },
};

/** What a stage change does to `closedAt`. */
const closedAtFor = (stage: string): Date | null =>
  CLOSED_DEAL_STAGES.has(stage) ? new Date() : null;

type StageUpdate = { stage?: unknown; $set?: { stage?: unknown } };

/** The stage an update writes, if it writes one. */
function stageOf(update: unknown): string | null {
  if (!update || Array.isArray(update)) {
    return null;
  }
  const { stage, $set } = update as StageUpdate;
  const next = $set?.stage ?? stage;
  return typeof next === 'string' ? next : null;
}

/**
 * Stamps `closedAt` on every path a deal's stage changes by — the form, the board's drag, a
 * lead conversion, an import — so no caller has to remember it. A save that leaves the stage as
 * it was (a corrected value on a won deal) keeps the original close date.
 */
export function applyDealClosedHooks(schema: Schema): void {
  schema.pre('save', function () {
    if (this.isNew || this.isModified('stage')) {
      this.set('closedAt', closedAtFor(String(this.get('stage'))));
    }
  });

  schema.pre(['findOneAndUpdate', 'updateOne'], async function (this: Query<unknown, unknown>) {
    const next = stageOf(this.getUpdate());
    if (next === null) {
      return;
    }
    const current = await this.model
      .findOne(this.getFilter())
      .select('stage')
      .lean<{ stage?: string }>();
    if (current?.stage !== next) {
      this.set('closedAt', closedAtFor(next));
    }
  });
}
