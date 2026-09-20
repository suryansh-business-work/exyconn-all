import { RiskModel } from './risk.model';
import { FindingModel } from './finding.model';
import { ManagementReviewModel } from './review.model';
import { registerReminderSource, dayKey, daysUntil, dueInWords } from '../reminders';
import { ROLES } from '../../constants/roles';
import type { Reminder } from '../reminders';

/**
 * The dates an ISO management system lives or dies by.
 *
 * Every one of these was already stored and indexed, and nothing ever read them: a risk
 * review date, a corrective action's deadline and an action minuted in a management review
 * sat in the database until an auditor asked. Being chased is the difference between a
 * register and a management system.
 */

/** Whoever owns the record, plus the officers who answer for the whole system. */
function ownerAnd(ownerId: string | undefined): Pick<Reminder, 'employeeIds' | 'roles'> {
  return { employeeIds: ownerId ? [ownerId] : [], roles: [ROLES.COMPLIANCE] };
}

async function risksDueForReview(now: Date): Promise<Reminder[]> {
  const rows = await RiskModel.find({
    status: { $ne: 'CLOSED' },
    reviewDueOn: { $ne: null, $lte: now },
  })
    .select('reference title ownerId reviewDueOn')
    .lean();

  return rows.map((risk) => ({
    dedupeKey: `risk-review:${String(risk._id)}:${dayKey(now)}`,
    kind: 'COMPLIANCE',
    title: `${risk.reference} is due for review`,
    body: `"${risk.title}" was due to be reviewed ${dueInWords(daysUntil(now, risk.reviewDueOn as Date))}. Re-score it, or close it if it no longer applies.`,
    link: '/compliance',
    ...ownerAnd(risk.ownerId),
  }));
}

async function findingsOverdue(now: Date): Promise<Reminder[]> {
  const rows = await FindingModel.find({
    status: { $nin: ['VERIFIED', 'CLOSED'] },
    dueOn: { $ne: null, $lte: now },
  })
    .select('reference title ownerId dueOn')
    .lean();

  return rows.map((finding) => ({
    dedupeKey: `finding-due:${String(finding._id)}:${dayKey(now)}`,
    kind: 'COMPLIANCE',
    title: `${finding.reference} is past its date`,
    body: `The corrective action for "${finding.title}" was due ${dueInWords(daysUntil(now, finding.dueOn as Date))}. Record what was done, or agree a new date.`,
    link: '/compliance/findings',
    ...ownerAnd(finding.ownerId),
  }));
}

/** Actions minuted in a management review, which live inside the review record. */
async function reviewActionsOverdue(now: Date): Promise<Reminder[]> {
  const reviews = await ManagementReviewModel.find({
    'actions.done': false,
    'actions.dueOn': { $ne: null, $lte: now },
  })
    .select('title actions')
    .lean();

  return reviews.flatMap((review) =>
    review.actions
      // The index is part of the key, so it is carried rather than recomputed: two actions
      // in one review must not chase under the same key.
      .map((action, index) => ({ action, index }))
      .filter(({ action }) => !action.done && action.dueOn && action.dueOn <= now)
      .map(({ action, index }) => ({
        dedupeKey: `review-action:${String(review._id)}:${index}:${dayKey(now)}`,
        kind: 'COMPLIANCE',
        title: `An action from "${review.title}" is overdue`,
        body: `${action.description} — due ${dueInWords(daysUntil(now, action.dueOn as Date))}${action.ownerName ? `, with ${action.ownerName}` : ''}.`,
        link: '/compliance/reviews',
        roles: [ROLES.COMPLIANCE],
      })),
  );
}

registerReminderSource({
  key: 'compliance',
  label: 'Risk reviews, corrective actions and review actions',
  async due(now) {
    const [risks, findings, actions] = await Promise.all([
      risksDueForReview(now),
      findingsOverdue(now),
      reviewActionsOverdue(now),
    ]);
    return [...risks, ...findings, ...actions];
  },
});
