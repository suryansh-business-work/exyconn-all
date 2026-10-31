import { Types } from 'mongoose';
import {
  fileMeetingNotesInCrm,
  type MeetingNotesForCrm,
} from '../../../../src/modules/crm/crm.meeting-notes';
import { shareNotesWithCrm } from '../../../../src/modules/meeting-assistant/ma.crm';
import {
  MaActionItemModel,
  MaParticipantModel,
} from '../../../../src/modules/meeting-assistant/models';
import { ActivityModel } from '../../../../src/modules/crm/activity.model';
import { ContactModel } from '../../../../src/modules/crm/contact.model';
import { DealModel } from '../../../../src/modules/crm/deal.model';
import { logger } from '../../../../src/utils/logger';
import { runForOrganization } from '../../../../src/lib/tenant';

const STARTED = new Date('2026-10-30T10:00:00.000Z');
const ENDED = new Date('2026-10-30T10:45:30.000Z');

const meeting = (extra: Partial<MeetingNotesForCrm> = {}): MeetingNotesForCrm => ({
  meetingId: 'meet-1',
  title: 'Acme kickoff',
  startedAt: STARTED,
  endedAt: ENDED,
  ownerName: 'Priya',
  summary: 'Agreed the rollout plan.',
  actionItems: [
    { title: 'Send the proposal', assignedTo: 'Priya', dueText: 'Friday' },
    { title: 'Book a demo', assignedTo: null, dueText: null },
  ],
  participantEmails: [' Ravi@Acme.com ', 'ravi@acme.com', '', 'stranger@nowhere.test'],
  meetingUrl: 'https://employee.exyconn.com/me/meetings/list/meet-1/summary',
  ...extra,
});

async function seedRavi() {
  const contact = await ContactModel.create({ name: 'Ravi', email: 'ravi@acme.com' });
  const contactId = contact._id.toHexString();
  const open = await DealModel.create({ title: 'Acme rollout', owner: 'A', contactId });
  const won = await DealModel.create({ title: 'Acme pilot', owner: 'A', contactId, stage: 'WON' });
  return { contactId, openId: open._id.toHexString(), wonId: won._id.toHexString() };
}

/** Deals are rescored after the answer; wait for it so it does not outlive the test. */
async function rescored(dealId: string) {
  for (let i = 0; i < 50; i += 1) {
    if ((await DealModel.findById(dealId).lean())?.scoredAt) return true;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  return false;
}

afterEach(() => {
  jest.restoreAllMocks();
});

/** Filing rescores deals after it answers; let that finish before the harness empties the database. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 200));

describe('fileMeetingNotesInCrm', () => {
  afterEach(settle);

  it('files the meeting on the matched contact and their open deals, then rescores them', async () => {
    const { contactId, openId, wonId } = await seedRavi();

    await expect(fileMeetingNotesInCrm(meeting())).resolves.toBe(2);

    const rows = await ActivityModel.find().sort({ relatedType: 1 }).lean();
    expect(rows.map((r) => [r.relatedType, r.relatedId, r.relatedName])).toEqual([
      ['CONTACT', contactId, 'Ravi'],
      ['DEAL', openId, 'Acme rollout'],
    ]);
    expect(rows[0]).toMatchObject({
      type: 'MEETING',
      subject: 'Meeting: Acme kickoff',
      done: true,
      owner: 'Priya',
      durationSeconds: 2730,
      sourceKey: `meeting:meet-1:CONTACT:${contactId}`,
      notes: [
        'Agreed the rollout plan.',
        '',
        'Action items:',
        '- Send the proposal (Priya), due Friday',
        '- Book a demo',
        '',
        'Full notes: https://employee.exyconn.com/me/meetings/list/meet-1/summary',
      ].join('\n'),
    });
    expect(await ActivityModel.countDocuments({ relatedId: wonId })).toBe(0);
    expect(await rescored(openId)).toBe(true);
  });

  it('matches a contact by any of their addresses', async () => {
    await ContactModel.create({
      name: 'Meera',
      email: 'meera@acme.com',
      emails: [{ address: 'meera.home@gmail.com', label: 'Personal', primary: false }],
    });

    await expect(
      fileMeetingNotesInCrm(meeting({ participantEmails: ['meera.home@gmail.com'] })),
    ).resolves.toBe(1);
  });

  it('rewrites the same rows when the notes are regenerated, never duplicating them', async () => {
    await seedRavi();
    await fileMeetingNotesInCrm(meeting());

    await fileMeetingNotesInCrm(meeting({ summary: 'Revised plan.', title: '', ownerName: '' }));

    const rows = await ActivityModel.find().lean();
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      subject: 'Meeting: Google Meet call',
      owner: 'Meeting Assistant',
    });
    expect(rows[0].notes).toMatch(/^Revised plan\./);
  });

  it('writes placeholders for a meeting without summary, action items or an end', async () => {
    await ContactModel.create({ name: 'Ravi', email: 'ravi@acme.com' });

    await fileMeetingNotesInCrm(meeting({ summary: '', actionItems: [], endedAt: null }));

    const row = await ActivityModel.findOne().lean();
    expect(row?.durationSeconds).toBeNull();
    expect(row?.notes).toContain('No summary was written for this meeting.');
    expect(row?.notes).toContain('Action items:\n- None recorded');
  });

  it('files nothing when no participant matches a contact, or nobody gave an address', async () => {
    await ContactModel.create({ name: 'Ravi', email: 'ravi@acme.com' });

    await expect(
      fileMeetingNotesInCrm(meeting({ participantEmails: ['stranger@nowhere.test'] })),
    ).resolves.toBe(0);
    await expect(fileMeetingNotesInCrm(meeting({ participantEmails: ['', '  '] }))).resolves.toBe(
      0,
    );
    expect(await ActivityModel.countDocuments()).toBe(0);
  });

  it("never files a meeting on another company's contact", async () => {
    const theirs = new Types.ObjectId().toHexString();
    const mine = new Types.ObjectId().toHexString();
    await runForOrganization(theirs, () =>
      ContactModel.create({ name: 'Ravi', email: 'ravi@acme.com' }),
    );

    await expect(runForOrganization(mine, () => fileMeetingNotesInCrm(meeting()))).resolves.toBe(0);
    expect(await ActivityModel.countDocuments()).toBe(0);
  });

  it('logs a rescore that fails and still reports what it filed', async () => {
    await seedRavi();
    const error = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    const find = DealModel.find.bind(DealModel);
    jest
      .spyOn(DealModel, 'find')
      .mockImplementationOnce(find as never)
      .mockImplementationOnce(() => {
        throw new Error('deals away');
      });

    await expect(fileMeetingNotesInCrm(meeting())).resolves.toBe(2);
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(error).toHaveBeenCalledWith(
      { err: expect.any(Error) },
      'Deals could not be rescored after a meeting',
    );
  });
});

describe('shareNotesWithCrm', () => {
  afterEach(settle);

  const meetingId = new Types.ObjectId();
  const leanMeeting = (extra: Record<string, unknown> = {}) =>
    ({
      _id: meetingId,
      title: 'Acme kickoff',
      startedAt: STARTED,
      endedAt: ENDED,
      ownerName: 'Priya',
      ...extra,
    }) as unknown as Parameters<typeof shareNotesWithCrm>[0];

  const participant = (email: string | null) =>
    MaParticipantModel.create({
      meetingId: meetingId.toHexString(),
      key: new Types.ObjectId().toHexString(),
      displayName: email ?? 'Guest',
      email,
      source: 'GOOGLE_MEET_API',
    });

  it('hands the verified participants and action items to the CRM with a link to the notes', async () => {
    const info = jest.spyOn(logger, 'info').mockImplementation(() => undefined);
    const { contactId } = await seedRavi();
    await participant('ravi@acme.com');
    await participant(null);
    await MaActionItemModel.create({
      meetingId: meetingId.toHexString(),
      title: 'Send the proposal',
      assignedTo: 'Priya',
      dueText: 'Friday',
      createdById: 'u1',
    });

    await shareNotesWithCrm(leanMeeting(), { executiveSummary: '', overview: 'The overview.' });

    const row = await ActivityModel.findOne({ relatedId: contactId }).lean();
    expect(row?.notes).toBe(
      [
        'The overview.',
        '',
        'Action items:',
        '- Send the proposal (Priya), due Friday',
        '',
        `Full notes: https://employee.exyconn.com/me/meetings/list/${meetingId.toHexString()}/summary`,
      ].join('\n'),
    );
    expect(info).toHaveBeenCalledWith(
      `Meeting ${meetingId.toHexString()} notes filed on 2 CRM record(s)`,
    );
  });

  it('prefers the executive summary, and says nothing when nobody matched', async () => {
    const info = jest.spyOn(logger, 'info').mockImplementation(() => undefined);
    await ContactModel.create({ name: 'Ravi', email: 'ravi@acme.com' });
    await participant('ravi@acme.com');
    await MaActionItemModel.create({
      meetingId: meetingId.toHexString(),
      title: 'Follow up',
      createdById: 'u1',
    });

    await shareNotesWithCrm(leanMeeting({ endedAt: undefined }), {
      executiveSummary: 'Short.',
      overview: 'Long.',
    });
    expect((await ActivityModel.findOne().lean())?.notes).toMatch(/^Short\.[\s\S]*- Follow up\n/);
    expect((await ActivityModel.findOne().lean())?.durationSeconds).toBeNull();

    await ActivityModel.deleteMany({});
    await ContactModel.deleteMany({});
    info.mockClear();
    await shareNotesWithCrm(leanMeeting(), { executiveSummary: 'Short.', overview: '' });
    expect(info).not.toHaveBeenCalled();
  });

  it('logs a CRM failure instead of failing the notes step', async () => {
    const error = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    jest.spyOn(ContactModel, 'find').mockImplementationOnce(() => {
      throw new Error('crm away');
    });
    await participant('ravi@acme.com');

    await expect(
      shareNotesWithCrm(leanMeeting(), { executiveSummary: 'x', overview: '' }),
    ).resolves.toBeUndefined();
    expect(error).toHaveBeenCalledWith(
      { err: expect.any(Error) },
      `Meeting ${meetingId.toHexString()} notes could not be filed in the CRM`,
    );
  });
});
