import { ContractModel } from '../../../../src/modules/legal/legal.model';
import { PolicyModel } from '../../../../src/modules/legal/policy.model';
import { reminderSources } from '../../../../src/modules/reminders/reminders.registry';
import { ROLES } from '../../../../src/constants/roles';
import { useTestOrganization } from '../../../helpers';
import type { Reminder } from '../../../../src/modules/reminders';

// Importing the module registers the source under test.
import '../../../../src/modules/legal/legal.reminders';

const DAY = 86_400_000;
const NOW = new Date('2026-09-20T09:00:00.000Z');
const inDays = (days: number) => new Date(NOW.getTime() + days * DAY);

useTestOrganization();

/** The registered `legal` source, asked the question the sweep asks it. */
function dueNow(): Promise<Reminder[]> {
  const source = reminderSources().find((candidate) => candidate.key === 'legal');
  if (!source) throw new Error('the legal reminder source is not registered');
  return source.due(NOW);
}

const contract = (title: string, expiresInDays: number, status = 'ACTIVE') =>
  ContractModel.create({
    title,
    party: 'Quill LLP',
    type: 'NDA',
    effectiveDate: inDays(-300),
    expiryDate: inDays(expiresInDays),
    status,
  });

const policy = (slug: string, overrides: Record<string, unknown>) =>
  PolicyModel.create({
    title: slug,
    slug,
    body: '<p>Text</p>',
    status: 'PUBLISHED',
    effectiveDate: inDays(-400),
    ...overrides,
  });

describe('the legal reminder source', () => {
  it('is registered under a label the health screen can show', () => {
    const source = reminderSources().find((candidate) => candidate.key === 'legal');

    expect(source?.label).toBe('Contract expiry and policy review');
  });

  it('asks for nothing when nothing is near its date', async () => {
    await contract('Far off', 31);
    await contract('Abandoned draft', 3, 'DRAFT');
    await policy('later', { nextReviewOn: inDays(5) });
    await policy('never-reviewed', { nextReviewOn: null });
    await policy('draft-review', { status: 'DRAFT', nextReviewOn: inDays(-5) });

    await expect(dueNow()).resolves.toEqual([]);
  });

  it('chases a contract running out within the month, for Legal', async () => {
    const row = await contract('Quill NDA', 10);

    const [reminder] = await dueNow();

    expect(reminder).toEqual({
      dedupeKey: `contract-expiry:${row._id.toHexString()}:2026-09-20`,
      kind: 'LEGAL',
      title: 'Quill NDA expires in 10 days',
      body: 'The agreement with Quill LLP expires in 10 days. Renew it, replace it or mark it terminated.',
      link: '/legal/contracts',
      roles: [ROLES.LEGAL],
    });
  });

  it('marks a lapsed contract expired before chasing it as expired', async () => {
    const row = await contract('Quill MSA', -3);

    const [reminder] = await dueNow();

    expect(reminder.title).toBe('Quill MSA has expired');
    expect(reminder.body).toBe(
      'The agreement with Quill LLP expired 3 days ago. Renew it, replace it or mark it terminated.',
    );
    expect((await ContractModel.findById(row._id).lean())?.status).toBe('EXPIRED');
  });

  it('chases a published policy whose review date has passed', async () => {
    const row = await policy('privacy', { nextReviewOn: inDays(-5) });

    const reminders = await dueNow();

    expect(reminders).toEqual([
      {
        dedupeKey: `policy-review:${row._id.toHexString()}:2026-09-20`,
        kind: 'LEGAL',
        title: 'privacy is due for review',
        body: 'Its review date was 5 days ago. Re-read it, then either publish the new wording or push the date out.',
        link: '/legal/policies',
        roles: [ROLES.LEGAL],
      },
    ]);
  });

  it('lists contracts before policies', async () => {
    await policy('privacy', { nextReviewOn: inDays(-1) });
    await contract('Quill NDA', 1);

    const titles = (await dueNow()).map((reminder) => reminder.title);

    expect(titles).toEqual(['Quill NDA expires tomorrow', 'privacy is due for review']);
  });
});
