import { ContractModel } from './legal.model';
import { expireLapsedContracts } from './legal.expiry';
import { PolicyModel } from './policy.model';
import { registerReminderSource, dayKey, daysFromNow, daysUntil, dueInWords } from '../reminders';
import { ROLES } from '../../constants/roles';
import type { Reminder } from '../reminders';

/**
 * How far ahead a contract is worth mentioning.
 *
 * A month is the shortest notice period worth acting on: most renewals need a decision, a
 * countersignature or a cancellation letter, and hearing about it on the expiry date is
 * hearing about it too late.
 */
const EXPIRY_WINDOW_DAYS = 30;

/** Contracts running out, and contracts that already have. */
async function expiringContracts(now: Date): Promise<Reminder[]> {
  const rows = await ContractModel.find({
    // EXPIRED as well as ACTIVE: one that lapsed this morning is exactly the one worth
    // saying something about, and the sweep has just marked it.
    status: { $in: ['ACTIVE', 'EXPIRED'] },
    // Bounded at both ends. Without the lower bound an agreement that ran out two years ago
    // and was never tidied up would be chased every morning for ever, which is how a daily
    // reminder becomes something people filter away.
    expiryDate: {
      $gte: daysFromNow(now, -EXPIRY_WINDOW_DAYS),
      $lte: daysFromNow(now, EXPIRY_WINDOW_DAYS),
    },
  })
    .select('title party expiryDate')
    .lean();

  return rows.map((contract) => {
    const days = daysUntil(now, contract.expiryDate);
    const expired = days < 0;
    return {
      dedupeKey: `contract-expiry:${String(contract._id)}:${dayKey(now)}`,
      kind: 'LEGAL',
      title: expired
        ? `${contract.title} has expired`
        : `${contract.title} expires ${dueInWords(days)}`,
      body: `The agreement with ${contract.party} ${expired ? 'expired' : 'expires'} ${dueInWords(days)}. Renew it, replace it or mark it terminated.`,
      link: '/legal/contracts',
      roles: [ROLES.LEGAL],
    };
  });
}

/** Published policies past the date somebody said they would look at them again. */
async function policiesDueForReview(now: Date): Promise<Reminder[]> {
  const rows = await PolicyModel.find({
    status: 'PUBLISHED',
    nextReviewOn: { $ne: null, $lte: now },
  })
    .select('title nextReviewOn')
    .lean();

  return rows.map((policy) => ({
    dedupeKey: `policy-review:${String(policy._id)}:${dayKey(now)}`,
    kind: 'LEGAL',
    title: `${policy.title} is due for review`,
    body: `Its review date was ${dueInWords(daysUntil(now, policy.nextReviewOn as Date))}. Re-read it, then either publish the new wording or push the date out.`,
    link: '/legal/policies',
    roles: [ROLES.LEGAL],
  }));
}

registerReminderSource({
  key: 'legal',
  label: 'Contract expiry and policy review',
  async due(now) {
    // Writing the lapse before reading the register, so the two agree: a contract that ran
    // out overnight is marked EXPIRED and chased as expired in the same pass, rather than
    // being chased as "expires today" for another hour.
    await expireLapsedContracts(now);
    const [contracts, policies] = await Promise.all([
      expiringContracts(now),
      policiesDueForReview(now),
    ]);
    return [...contracts, ...policies];
  },
});
