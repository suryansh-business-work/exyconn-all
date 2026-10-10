import { RiskModel } from '../../../../src/modules/compliance/risk.model';
import { FindingModel } from '../../../../src/modules/compliance/finding.model';
import { ManagementReviewModel } from '../../../../src/modules/compliance/review.model';
import { reminderSources } from '../../../../src/modules/reminders/reminders.registry';
import { ROLES } from '../../../../src/constants/roles';
import { useTestOrganization } from '../../../helpers';
import type { Reminder } from '../../../../src/modules/reminders';

// Importing the module registers the source; this is the one under test.
import '../../../../src/modules/compliance/compliance.reminders';

const DAY = 86_400_000;
const NOW = new Date('2026-09-20T09:00:00.000Z');
const daysAgo = (days: number) => new Date(NOW.getTime() - days * DAY);

useTestOrganization();

/** The registered `compliance` source, asked the same question the sweep asks it. */
function dueNow(): Promise<Reminder[]> {
  const source = reminderSources().find((candidate) => candidate.key === 'compliance');
  if (!source) throw new Error('the compliance reminder source is not registered');
  return source.due(NOW);
}

const risk = (over: Record<string, unknown>) =>
  RiskModel.create({
    title: 'Single payroll supplier',
    category: 'OPERATIONAL',
    likelihood: 3,
    impact: 3,
    residualLikelihood: 2,
    residualImpact: 2,
    identifiedOn: daysAgo(90),
    status: 'TREATING',
    ...over,
  });

const finding = (over: Record<string, unknown>) =>
  FindingModel.create({
    title: 'Access review not evidenced',
    category: 'INFORMATION_SECURITY',
    raisedOn: daysAgo(30),
    status: 'ACTION_AGREED',
    ...over,
  });

describe('the compliance reminder source', () => {
  it('is registered under a label the health screen can show', () => {
    const source = reminderSources().find((candidate) => candidate.key === 'compliance');

    expect(source?.label).toBe('Risk reviews, corrective actions and review actions');
  });

  it('asks for nothing when every date is still ahead', async () => {
    await risk({ reference: 'RISK-0001', reviewDueOn: new Date(NOW.getTime() + DAY) });
    await finding({ reference: 'NC-0001', dueOn: new Date(NOW.getTime() + DAY) });

    await expect(dueNow()).resolves.toEqual([]);
  });

  it('chases an unowned risk past review to the compliance officers alone', async () => {
    const row = await risk({ reference: 'RISK-0002', reviewDueOn: daysAgo(3) });
    await risk({ reference: 'RISK-0003', reviewDueOn: daysAgo(3), status: 'CLOSED' });

    const reminders = await dueNow();

    expect(reminders).toEqual([
      {
        dedupeKey: `risk-review:${row._id.toHexString()}:2026-09-20`,
        kind: 'COMPLIANCE',
        title: 'RISK-0002 is due for review',
        body: '"Single payroll supplier" was due to be reviewed 3 days ago. Re-score it, or close it if it no longer applies.',
        link: '/compliance',
        employeeIds: [],
        roles: [ROLES.COMPLIANCE],
      },
    ]);
  });

  it('chases the owner of a late corrective action, but not a verified one', async () => {
    const row = await finding({ reference: 'NC-0002', ownerId: 'owner-1', dueOn: daysAgo(1) });
    await finding({
      reference: 'NC-0003',
      ownerId: 'owner-1',
      dueOn: daysAgo(1),
      status: 'VERIFIED',
    });

    const reminders = await dueNow();

    expect(reminders).toEqual([
      {
        dedupeKey: `finding-due:${row._id.toHexString()}:2026-09-20`,
        kind: 'COMPLIANCE',
        title: 'NC-0002 is past its date',
        body: 'The corrective action for "Access review not evidenced" was due yesterday. Record what was done, or agree a new date.',
        link: '/compliance/findings',
        employeeIds: ['owner-1'],
        roles: [ROLES.COMPLIANCE],
      },
    ]);
  });

  it('chases each overdue review action under its own key, and skips the rest', async () => {
    const review = await ManagementReviewModel.create({
      reference: 'MR-0001',
      title: 'Q3 management review',
      heldOn: daysAgo(60),
      status: 'MINUTED',
      actions: [
        { description: 'Already done', dueOn: daysAgo(5), done: true },
        { description: 'Not due yet', dueOn: new Date(NOW.getTime() + 5 * DAY), done: false },
        { description: 'Rewrite the procedure', dueOn: daysAgo(3), done: false },
        { description: 'No date agreed', dueOn: null, done: false },
        { description: 'Retrain the team', ownerName: 'Ravi', dueOn: daysAgo(1), done: false },
      ],
    });
    const id = review._id.toHexString();

    const reminders = await dueNow();

    expect(reminders).toEqual([
      {
        dedupeKey: `review-action:${id}:2:2026-09-20`,
        kind: 'COMPLIANCE',
        title: 'An action from "Q3 management review" is overdue',
        body: 'Rewrite the procedure — due 3 days ago.',
        link: '/compliance/reviews',
        roles: [ROLES.COMPLIANCE],
      },
      {
        dedupeKey: `review-action:${id}:4:2026-09-20`,
        kind: 'COMPLIANCE',
        title: 'An action from "Q3 management review" is overdue',
        body: 'Retrain the team — due yesterday, with Ravi.',
        link: '/compliance/reviews',
        roles: [ROLES.COMPLIANCE],
      },
    ]);
  });

  it('lists risks first, then findings, then review actions', async () => {
    await ManagementReviewModel.create({
      reference: 'MR-0002',
      title: 'Annual review',
      heldOn: daysAgo(100),
      actions: [{ description: 'Budget for audits', dueOn: daysAgo(2), done: false }],
    });
    await finding({ reference: 'NC-0004', dueOn: daysAgo(2) });
    await risk({ reference: 'RISK-0004', ownerId: 'owner-2', reviewDueOn: daysAgo(2) });

    const reminders = await dueNow();

    expect(reminders.map((reminder) => reminder.link)).toEqual([
      '/compliance',
      '/compliance/findings',
      '/compliance/reviews',
    ]);
    expect(reminders[0].employeeIds).toEqual(['owner-2']);
    expect(reminders[1].employeeIds).toEqual([]);
  });
});
